import type { ChainId } from '@/lib/chains';
import type { CheckId, CheckResult } from '@/lib/investigation/types';
import { hasLlmKey } from '@/lib/llm';

export const PHASES = ['Discover', 'Understand', 'Investigate', 'Verify', 'Assess', 'Synthesize'] as const;
export type Phase = (typeof PHASES)[number];

export interface PlanStep {
  phase: Phase;
  step: number; // 1..N within phase
  checkId: CheckId | 'claim-verification' | 'replan' | 'scenarios';
  reasoning: string;
  // optional 'next' hint to keep the trail readable
  expectedOutcome?: string;
}

export interface PlannerInput {
  address: string;
  chain: ChainId;
  intent?: 'verify-before-sign' | 'evaluate-risk' | 'research' | 'patrol';
  existingFindings?: CheckResult[];
}

const FALLBACK_PLAN: PlanStep[] = [
  { phase: 'Discover', step: 1, checkId: 'verified', reasoning: 'Confirm whether source code is published on the explorer.', expectedOutcome: 'determines whether anything else is auditable' },
  { phase: 'Discover', step: 2, checkId: 'proxy-upgradeable', reasoning: 'Detect EIP-1967 proxy pattern — needed to scope the rest of the audit.', expectedOutcome: 'flags whether logic can be replaced by an admin' },
  { phase: 'Understand', step: 1, checkId: 'ownership', reasoning: 'Read owner() to learn who holds administrative powers.', expectedOutcome: 'renounced vs active admin' },
  { phase: 'Investigate', step: 1, checkId: 'dangerous-functions', reasoning: 'Scan the ABI for surface-area primitives: selfdestruct, mint, pause, blacklist, mutable tax.', expectedOutcome: 'enumerates the operator weapons' },
  { phase: 'Investigate', step: 2, checkId: 'contract-age', reasoning: 'Compute days since first tx. New contracts are higher-risk.', expectedOutcome: 'freshness signal' },
  { phase: 'Investigate', step: 3, checkId: 'deployer-history', reasoning: 'Discover how many other contracts this deployer shipped.', expectedOutcome: 'serial-deployer signal' },
  { phase: 'Verify', step: 1, checkId: 'liquidity', reasoning: 'Look up DEX pairs and depth via Dexscreener.', expectedOutcome: 'liquidity and exit confidence' },
  { phase: 'Verify', step: 2, checkId: 'holder-concentration', reasoning: 'Compute top-1 / top-10 share of supply.', expectedOutcome: 'concentration / control signal' },
  { phase: 'Verify', step: 3, checkId: 'honeypot', reasoning: 'Probe whether the contract is even an ERC-20 and honestly report when true sell-simulation is needed.', expectedOutcome: 'covered if capability exists, INSUFFICIENT if not' },
  { phase: 'Assess', step: 1, checkId: 'replan', reasoning: 'Re-weight the verdict with everything we learned. Surface owner-history risks, honeypot uncertainty, etc.', expectedOutcome: 'a recommendation grounded in evidence' },
  { phase: 'Synthesize', step: 1, checkId: 'scenarios', reasoning: 'Translate findings into 2-3 plain-English failure scenarios the user can act on.', expectedOutcome: 'what could go wrong, and how badly' },
];

// LLM-based planner system prompt
const PLANNER_SYS = `You are OnchainScout's autonomous investigation planner.

The agent traces must read like a security analyst working — not a fixed checklist.
Given what we're investigating and what we've already found, decide what to look at next.

Return strict JSON:
{
  "phase": "Discover" | "Understand" | "Investigate" | "Verify" | "Assess" | "Synthesize",
  "step": <1..N within phase>,
  "checks": [<check_id>, ... up to 6],
  "reasoning": "<1 sentence: WHY these checks, given the findings so far>",
  "expectedOutcome": "<1 sentence: what we expect to learn>"
}

Check IDs you can use:
- verified
- proxy-upgradeable
- ownership
- dangerous-functions
- contract-age
- deployer-history
- liquidity
- holder-concentration
- honeypot

Plan rules:
- Differentiate per input — not the same plan each time
- The next plan MUST depend on what findings say (don't re-run checks we already know failed)
- If proxy-upgradeable was found with an active owner, prioritize checking the owner's other contracts (deployer-history) and holder concentration
- If source is unverified, prioritize honeypot + liquidity + contract-age
- Always include scenario generation last (synthesize)
- 4–8 steps. Sparse is fine.`;

/**
 * Build the next investigation step using an LLM-aware planner.
 * Falls back to the deterministic plan when no key, an error, or empty result.
 */
export async function buildNextStep(input: PlannerInput, round: number, seen: CheckId[]): Promise<PlanStep> {
  const remaining = (['verified', 'proxy-upgradeable', 'ownership', 'dangerous-functions', 'contract-age', 'deployer-history', 'liquidity', 'holder-concentration', 'honeypot'] as CheckId[]).filter(
    (c) => !seen.includes(c),
  );

  if (!hasLlmKey() || remaining.length === 0) {
    // Fallback: pick from FALLBACK_PLAN in order, skipping seen
    const fallback = FALLBACK_PLAN.find(
      (p) => p.checkId !== 'replan' && p.checkId !== 'scenarios' && !seen.includes(p.checkId as CheckId),
    );
    if (fallback) return fallback;
    return FALLBACK_PLAN[FALLBACK_PLAN.length - 2]; // replan
  }

  const findings = (input.existingFindings ?? []).map((c) => ({
    id: c.id,
    status: c.status,
    signals: c.signals,
    summary: c.summary.slice(0, 120),
  }));

  const user = JSON.stringify(
    {
      address: input.address,
      chain: input.chain,
      intent: input.intent ?? 'evaluate-risk',
      round,
      seen,
      remaining,
      findings,
    },
    null,
    2,
  );

  try {
    const text = process.env.OPENAI_API_KEY
      ? await callLLM(PLANNER_SYS, user, 'gpt-4o-mini', 'openai')
      : await callLLM(PLANNER_SYS, user, 'claude-3-5-sonnet-20241022', 'anthropic');

    // Pull first {...} from response
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Planner returned no JSON');
    const parsed = JSON.parse(m[0]) as {
      phase: Phase;
      step: number;
      checks: CheckId[];
      reasoning: string;
      expectedOutcome?: string;
    };
    const checks = (parsed.checks || []).filter((c) => remaining.includes(c));
    if (checks.length === 0) {
      return FALLBACK_PLAN[FALLBACK_PLAN.length - 2];
    }
    if (parsed.phase === 'Synthesize') {
      return { phase: 'Synthesize', step: parsed.step ?? 1, checkId: 'scenarios', reasoning: parsed.reasoning };
    }
    if (parsed.phase === 'Assess') {
      return { phase: 'Assess', step: parsed.step ?? 1, checkId: 'replan', reasoning: parsed.reasoning };
    }
    return {
      phase: parsed.phase,
      step: parsed.step ?? 1,
      checkId: checks[0],
      reasoning: parsed.reasoning,
      expectedOutcome: parsed.expectedOutcome,
    };
  } catch {
    // pick first remaining deterministically based on priority
    const priority: CheckId[] = ['verified', 'proxy-upgradeable', 'ownership', 'dangerous-functions', 'liquidity', 'holder-concentration', 'contract-age', 'deployer-history', 'honeypot'];
    const next = priority.find((c) => remaining.includes(c)) ?? remaining[0];
    return {
      phase: phaseFor(next),
      step: 1,
      checkId: next,
      reasoning: `Continuing ${next} after earlier checks…`,
    };
  }
}

const PHASE_BY_CHECK: Partial<Record<CheckId, Phase>> = {
  verified: 'Discover',
  'proxy-upgradeable': 'Discover',
  ownership: 'Understand',
  'dangerous-functions': 'Investigate',
  'contract-age': 'Investigate',
  'deployer-history': 'Investigate',
  liquidity: 'Verify',
  'holder-concentration': 'Verify',
  honeypot: 'Verify',
};

function phaseFor(c: CheckId): Phase {
  return PHASE_BY_CHECK[c] ?? 'Investigate';
}

async function callLLM(system: string, user: string, model: string, provider: 'openai' | 'anthropic'): Promise<string> {
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return j.choices?.[0]?.message?.content ?? '';
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      temperature: 0,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}`);
  const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  return j.content?.[0]?.text ?? '';
}
