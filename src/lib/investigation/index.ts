import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';
import type {
  CheckResult,
  FailureScenario,
  InvestigationResult,
  RiskDimension,
  RiskLevel,
  TraceStep,
} from './types';
import { generateNarrative } from '@/lib/llm';
import { buildNextStep, type Phase } from './planner';
import { generateScenarios } from './scenarios';
import {
  checkVerified,
  checkDangerousFunctions,
  checkOwnership,
  checkProxyUpgradeable,
  checkHoneypot,
  checkLiquidity,
  checkHolderConcentration,
  checkDeployerHistory,
  checkContractAge,
} from './checks';

const CHECK_FNS: Record<string, (address: string, chain: ChainId) => Promise<CheckResult>> = {
  verified: checkVerified,
  'proxy-upgradeable': checkProxyUpgradeable,
  ownership: checkOwnership,
  'dangerous-functions': checkDangerousFunctions,
  'contract-age': checkContractAge,
  'deployer-history': checkDeployerHistory,
  honeypot: checkHoneypot,
  liquidity: checkLiquidity,
  'holder-concentration': checkHolderConcentration,
};

function deriveRecommendation(checks: CheckResult[]): RiskLevel {
  if (checks.some((c) => c.status === 'stop')) return 'stop';
  if (checks.filter((c) => c.status === 'caution').length >= 2) return 'stop';
  if (checks.some((c) => c.status === 'caution')) return 'caution';
  if (checks.every((c) => c.status === 'unknown')) return 'unknown';
  return 'go';
}

function deriveDimensions(checks: CheckResult[]): RiskDimension[] {
  return checks.map((c) => ({
    name: c.label,
    level: c.status,
    detail: c.summary,
    confidence: c.confidence,
    proveIt: c.evidence.length
      ? { evidence: c.evidence, source: c.evidence[0].source }
      : undefined,
  }));
}

export async function investigate(
  address: string,
  chain: ChainId,
  opts: { intent?: InvestigationResult['inputType'] } = {},
): Promise<InvestigationResult> {
  const startedAt = new Date().toISOString();
  const trace: TraceStep[] = [];
  const errors: string[] = [];
  const checks: CheckResult[] = [];
  let stepCounter = 0;
  const seen: string[] = [];
  let phasesObserved = new Set<Phase>();

  // isContract probe
  const adapter = getAdapter(chain);
  let isContract = false;
  try {
    const r = await fetch(adapter.chain.rpc.http, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getCode',
        params: [address, 'latest'],
      }),
      cache: 'no-store',
    });
    const j = (await r.json()) as { result?: string };
    isContract = !!(j.result && j.result !== '0x' && j.result !== '0x0');
    trace.push({
      step: ++stepCounter,
      at: new Date().toISOString(),
      checkId: 'orchestrator',
      reasoning: `eth_getCode at ${address.slice(0, 10)}… (chain: ${chain})`,
      decision: isContract ? 'investigate-further' : 'skip',
      outcome: isContract ? 'contract detected — agent will plan investigation' : 'no bytecode',
      phase: 'Discover',
    });
  } catch (e) {
    errors.push(`isContract probe failed: ${(e as Error).message}`);
  }

  if (!isContract) {
    return finalise({
      address,
      chain,
      isContract: false,
      startedAt,
      checks: [],
      trace,
      errors,
      recommendation: 'unknown',
      headline: 'No contract bytecode on the selected chain.',
      narrative:
        'The address has no bytecode on the selected chain. Either it is an EOA or the contract is on a different chain.',
      riskDimensions: [],
      insufficientEvidence: true,
      inputType: opts.intent,
    });
  }

  // ─── Autonomous investigation loop ──────────────────────────────────
  // The agent picks the next check based on what has been found so far.
  // Hard cap of 9 actual checks (one per CheckId) plus the synthesis phase.
  const MAX_CHECKS = 9;
  let intent: 'verify-before-sign' | 'evaluate-risk' | 'research' | 'patrol' = 'evaluate-risk';

  while (seen.length < MAX_CHECKS) {
    const plan = await buildNextStep(
      {
        address,
        chain,
        intent,
        existingFindings: checks,
      },
      seen.length + 1,
      seen as Parameters<typeof buildNextStep>[2],
    );

    phasesObserved.add(plan.phase);
    trace.push({
      step: ++stepCounter,
      at: new Date().toISOString(),
      checkId: plan.checkId === 'scenarios' ? 'failure-scenarios' : plan.checkId === 'replan' ? 'planner' : plan.checkId,
      reasoning: `[${plan.phase}] ${plan.reasoning}`,
      decision: 'plan',
      outcome: plan.expectedOutcome,
      phase: plan.phase,
    });

    if (plan.checkId === 'scenarios') break; // transition to synthesis below
    if (plan.checkId === 'replan') continue; // agent re-plans

    const fn = CHECK_FNS[plan.checkId];
    if (!fn) {
      seen.push(plan.checkId);
      continue;
    }

    trace.push({
      step: ++stepCounter,
      at: new Date().toISOString(),
      checkId: plan.checkId as Parameters<typeof buildNextStep>[2][number],
      reasoning: `Running ${plan.checkId} under phase ${plan.phase}`,
      decision: 'run',
      phase: plan.phase,
    });

    try {
      const result = await fn(address, chain);
      checks.push(result);
      seen.push(plan.checkId);
      trace.push({
        step: ++stepCounter,
        at: new Date().toISOString(),
        checkId: plan.checkId as Parameters<typeof buildNextStep>[2][number],
        reasoning: `${plan.checkId} returned status=${result.status}; evidence=${result.evidence.length} entries; signals=[${result.signals.join(', ')}].`,
        decision: 'investigate-further',
        outcome: result.summary.slice(0, 160),
        phase: plan.phase,
      });
    } catch (e) {
      const msg = (e as Error).message;
      errors.push(`${plan.checkId}: ${msg}`);
      seen.push(plan.checkId);
      trace.push({
        step: ++stepCounter,
        at: new Date().toISOString(),
        checkId: plan.checkId as Parameters<typeof buildNextStep>[2][number],
        reasoning: `${plan.checkId} threw`,
        decision: 'skip',
        outcome: msg.slice(0, 160),
        phase: plan.phase,
      });
    }
  }

  const recommendation = deriveRecommendation(checks);
  const riskDimensions = deriveDimensions(checks);

  // Synthesize: narrative + failure scenarios
  let scenarios: FailureScenario[] = [];
  try {
    scenarios = await generateScenarios(checks, recommendation);
    trace.push({
      step: ++stepCounter,
      at: new Date().toISOString(),
      checkId: 'failure-scenarios',
      reasoning: 'Translating findings into plain-English failure scenarios.',
      decision: 'run',
      phase: 'Synthesize',
    });
  } catch (e) {
    errors.push(`scenarios: ${(e as Error).message}`);
  }

  let narrative = '';
  try {
    narrative = await generateNarrative({
      address,
      chain,
      checks,
      recommendation,
    });
  } catch (e) {
    errors.push(`narrative: ${(e as Error).message}`);
    narrative = 'Narrative unavailable; structured findings are below.';
  }

  const headline =
    recommendation === 'stop'
      ? 'Multiple risk signals detected. Do not proceed without manual verification.'
      : recommendation === 'caution'
      ? 'Some risk signals detected. Proceed only after verifying the evidence.'
      : recommendation === 'unknown'
      ? 'INSUFFICIENT EVIDENCE. Could not confidently assess.'
      : 'No major risk signals detected in the checks performed.';

  return finalise({
    address,
    chain,
    isContract: true,
    startedAt,
    checks,
    trace,
    errors,
    recommendation,
    headline,
    narrative,
    riskDimensions,
    insufficientEvidence: recommendation === 'unknown',
    scenarios,
    inputType: opts.intent,
  });
}

interface FinaliseInput {
  address: string;
  chain: ChainId;
  isContract: boolean;
  startedAt: string;
  checks: CheckResult[];
  trace: TraceStep[];
  errors: string[];
  recommendation: RiskLevel;
  headline: string;
  narrative: string;
  riskDimensions: RiskDimension[];
  insufficientEvidence: boolean;
  scenarios?: FailureScenario[];
  inputType?: InvestigationResult['inputType'];
}

function finalise(input: FinaliseInput): InvestigationResult {
  return {
    address: input.address,
    chain: input.chain,
    isContract: input.isContract,
    startedAt: input.startedAt,
    finishedAt: new Date().toISOString(),
    checks: input.checks,
    trace: input.trace,
    blastRadiusUsd: null,
    recommendation: input.recommendation,
    headline: input.headline,
    narrative: input.narrative,
    riskDimensions: input.riskDimensions,
    insufficientEvidence: input.insufficientEvidence,
    errors: input.errors,
    inputType: input.inputType,
    scenarios: input.scenarios,
  };
}
