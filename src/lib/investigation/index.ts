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
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';
import type {
  CheckResult,
  InvestigationResult,
  RiskDimension,
  RiskLevel,
  TraceStep,
} from './types';
import { generateNarrative } from '@/lib/llm';

type CheckFn = (address: string, chain: ChainId) => Promise<CheckResult>;

// Order is the agent's reasoning flow: cheap-and-decisive checks first, broad coverage after.
const CHECK_PLAN: Array<{ id: CheckResult['id']; run: CheckFn; skipIfNonToken?: boolean }> = [
  { id: 'verified', run: checkVerified },
  { id: 'proxy-upgradeable', run: checkProxyUpgradeable },
  { id: 'ownership', run: checkOwnership },
  { id: 'dangerous-functions', run: checkDangerousFunctions },
  { id: 'contract-age', run: checkContractAge },
  { id: 'deployer-history', run: checkDeployerHistory },
  { id: 'honeypot', run: checkHoneypot, skipIfNonToken: false },
  { id: 'liquidity', run: checkLiquidity, skipIfNonToken: false },
  { id: 'holder-concentration', run: checkHolderConcentration, skipIfNonToken: false },
];

function deriveRecommendation(checks: CheckResult[]): RiskLevel {
  if (checks.some((c) => c.status === 'stop')) return 'stop';
  if (checks.filter((c) => c.status === 'caution').length >= 2) return 'stop';
  if (checks.some((c) => c.status === 'caution')) return 'caution';
  if (checks.every((c) => c.status === 'unknown')) return 'unknown';
  return 'go';
}

function deriveDimensions(checks: CheckResult[]): RiskDimension[] {
  return checks.map((c) => ({ name: c.label, level: c.status, detail: c.summary }));
}

export async function investigate(address: string, chain: ChainId): Promise<InvestigationResult> {
  const startedAt = new Date().toISOString();
  const trace: TraceStep[] = [];
  const errors: string[] = [];
  let stepCounter = 0;

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
  } catch (e) {
    errors.push(`isContract probe failed: ${(e as Error).message}`);
  }

  trace.push({
    step: ++stepCounter,
    at: new Date().toISOString(),
    checkId: 'orchestrator',
    reasoning: `eth_getCode at ${address} on ${chain}`,
    decision: isContract ? 'investigate-further' : 'skip',
    outcome: isContract ? 'contract detected' : 'no bytecode',
  });

  if (!isContract) {
    return {
      address,
      chain,
      isContract: false,
      startedAt,
      finishedAt: new Date().toISOString(),
      checks: [],
      trace,
      blastRadiusUsd: null,
      recommendation: 'unknown',
      headline: 'No contract bytecode on the selected chain.',
      narrative:
        'The address has no bytecode on the selected chain. Either it is an EOA or the contract is on a different chain.',
      riskDimensions: [],
      insufficientEvidence: true,
      errors,
      inputType: 'address',
    };
  }

  const checks: CheckResult[] = [];

  for (const plan of CHECK_PLAN) {
    trace.push({
      step: ++stepCounter,
      at: new Date().toISOString(),
      checkId: plan.id,
      reasoning: `Running ${plan.id}`,
      decision: 'run',
    });

    let result: CheckResult;
    try {
      result = await plan.run(address, chain);
    } catch (e) {
      const msg = (e as Error).message;
      errors.push(`${plan.id}: ${msg}`);
      trace.push({
        step: ++stepCounter,
        at: new Date().toISOString(),
        checkId: plan.id,
        reasoning: `${plan.id} threw`,
        decision: 'skip',
        outcome: msg.slice(0, 160),
      });
      continue;
    }

    checks.push(result);
    trace.push({
      step: ++stepCounter,
      at: new Date().toISOString(),
      checkId: plan.id,
      reasoning: `${plan.id} returned status=${result.status}`,
      decision: 'investigate-further',
      outcome: result.summary.slice(0, 160),
    });
  }

  const recommendation = deriveRecommendation(checks);
  const riskDimensions = deriveDimensions(checks);

  let narrative = '';
  try {
    narrative = await generateNarrative({ address, chain, checks, recommendation });
  } catch (e) {
    errors.push(`narrative: ${(e as Error).message}`);
    narrative = 'Narrative unavailable; see the structured findings below for the evidence.';
  }

  const headline =
    recommendation === 'stop'
      ? 'Multiple risk signals detected. Do not proceed without manual verification.'
      : recommendation === 'caution'
      ? 'Some risk signals detected. Proceed only after verifying the evidence.'
      : recommendation === 'unknown'
      ? 'INSUFFICIENT EVIDENCE. Could not confidently assess.'
      : 'No major risk signals detected in the checks performed.';

  return {
    address,
    chain,
    isContract: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    checks,
    trace,
    blastRadiusUsd: null,
    recommendation,
    headline,
    narrative,
    riskDimensions,
    insufficientEvidence: recommendation === 'unknown',
    errors,
    inputType: 'address',
  };
}
