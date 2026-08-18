import type { CheckResult, RiskLevel } from '@/lib/investigation/types';
import { hasLlmKey } from '@/lib/llm';

export interface FailureScenario {
  title: string;
  steps: string[];
  worstIdentifiableLoss: string | null;
  why: string;
}

const SCENARIO_SYS = `You write failure scenarios for a security agent.
Given the findings of an investigation, produce 2-3 short plain-English scenarios of how a real user could lose money or have their expectations violated.

Return strict JSON:
{
  "scenarios": [
    {
      "title": "string",
      "steps": ["sentence 1", "sentence 2", "sentence 3"],
      "why": "1 sentence explaining which finding caused it",
      "worstIdentifiableLoss": "string or null"
    }
  ]
}

Rules:
- Plain English, no jargon. The user is not technical.
- Each scenario has 2-4 concrete steps. Each step is a separate sentence.
- "worstIdentifiableLoss" is a single $ amount the user could lose, or null if unknown.
- Don't speculate beyond the actual findings.
- If findings strongly imply safety, that's fine too — return one "you're probably fine" scenario.`;

/**
 * Generate "What could go wrong?" scenarios from a set of findings.
 * Falls back to deterministic rule-based scenarios when no LLM key or on error.
 */
export async function generateScenarios(checks: CheckResult[], recommendation: RiskLevel): Promise<FailureScenario[]> {
  // Deterministic baseline
  const baseline: FailureScenario[] = deterministicScenarios(checks);

  if (!hasLlmKey()) return baseline;
  try {
    const user = JSON.stringify(
      {
        recommendation,
        findings: checks.map((c) => ({
          id: c.id,
          label: c.label,
          status: c.status,
          signals: c.signals,
          summary: c.summary.slice(0, 160),
        })),
      },
      null,
      2,
    );

    const text = process.env.OPENAI_API_KEY
      ? await callLLM(SCENARIO_SYS, user, 'gpt-4o-mini')
      : await callLLM(SCENARIO_SYS, user, 'claude-3-5-sonnet-20241022');

    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('narrator returned no JSON');
    const parsed = JSON.parse(m[0]) as { scenarios?: FailureScenario[] };
    if (Array.isArray(parsed.scenarios) && parsed.scenarios.length) {
      return parsed.scenarios.slice(0, 3);
    }
    throw new Error('empty scenarios');
  } catch {
    return baseline;
  }
}

function deterministicScenarios(checks: CheckResult[]): FailureScenario[] {
  const out: FailureScenario[] = [];
  const signals = new Set(checks.flatMap((c) => c.signals));

  if (signals.has('is-proxy')) {
    out.push({
      title: 'Upgraded implementation changes behavior',
      steps: [
        'The proxy admin calls upgradeTo() to swap the implementation address.',
        'The new implementation introduces or removes privileged functions silently.',
        'Your past approvals remain live — whatever the new logic permits.',
      ],
      worstIdentifiableLoss: null,
      why: 'proxy-upgradeable check fired',
    });
  }

  if (signals.has('has-owner')) {
    out.push({
      title: 'Active owner can revoke, blacklist, or change taxes overnight',
      steps: [
        'You approve the contract to spend your USDC.',
        'The owner pushes an update that adds you to a blacklist or raises the sell tax.',
        'You can no longer exit at a fair price.',
      ],
      worstIdentifiableLoss: null,
      why: 'ownership check fired and owner is not renounced',
    });
  }

  if (signals.has('mint-capable')) {
    out.push({
      title: 'Owner mints supply, diluting your position',
      steps: [
        'The contract exposes a public or owner-only mint function.',
        'The owner mints a large amount of supply to themselves.',
        'Your share of total supply drops; selling pressure on any listing is severe.',
      ],
      worstIdentifiableLoss: null,
      why: 'dangerous-functions found mint',
    });
  }

  if (signals.has('top1->50%') || signals.has('top1->25%')) {
    out.push({
      title: 'Concentrated holders dump on you',
      steps: [
        'A small set of wallets holds a large share of supply.',
        'They sell into any uptick, the price drops, your position marks down.',
        'You can only exit at a fraction of entry.',
      ],
      worstIdentifiableLoss: null,
      why: 'holder-concentration check found top-1 share above threshold',
    });
  }

  if (signals.has('liquidity-<10k')) {
    out.push({
      title: 'Thin liquidity prevents clean exit',
      steps: [
        'You buy at a thin ask.',
        'When you sell, the price impact on the pool is large.',
        'You receive meaningfully less than spot.',
      ],
      worstIdentifiableLoss: null,
      why: 'liquidity check found <$10k pool depth',
    });
  }

  if (signals.has('age-<1d') || signals.has('age-<7d')) {
    out.push({
      title: 'Untried contract, no track record',
      steps: [
        'The contract was deployed within the past week.',
        'There is no public reputation — neither audit, history, nor community.',
        'A bug, backdoor, or rugpull has not yet had time to surface.',
      ],
      worstIdentifiableLoss: null,
      why: 'contract-age check fired',
    });
  }

  if (out.length === 0 && checks.every((c) => c.status === 'go' || c.status === 'unknown')) {
    out.push({
      title: 'No failure signals found',
      steps: [
        'Every check that ran either confirmed benign behavior or returned INSUFFICIENT EVIDENCE.',
        'There remains unaddressed risk we cannot read from public data — your diligence is still required.',
      ],
      worstIdentifiableLoss: null,
      why: 'no risk-signals fired',
    });
  }

  return out.slice(0, 3);
}

async function callLLM(system: string, user: string, model: string): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
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
      max_tokens: 800,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}`);
  const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
  return j.content?.[0]?.text ?? '';
}
