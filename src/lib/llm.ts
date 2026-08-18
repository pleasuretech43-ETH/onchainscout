import type { CheckResult, RiskLevel, VerifiedClaim } from '@/lib/investigation/types';
import type { ChainId } from '@/lib/chains';

interface NarrativeInput {
  address: string;
  chain: ChainId;
  checks: CheckResult[];
  recommendation: RiskLevel;
}

interface UrlNarrativeInput {
  url: string;
  claims: VerifiedClaim[];
  recommendation: RiskLevel;
}

export interface ExtractedClaim {
  claim: string;
  category: string;
  rawText: string;
}

export function hasLlmKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

function rulesBlock(): string {
  return `Hard rules:
- You may ONLY describe the structured findings provided to you. You may NOT invent, infer, or hallucinate numbers, names, addresses, or facts.
- If a check returned "unknown" or was skipped, you MUST say so explicitly.
- When the evidence is thin or conflicting, you MUST say "INSUFFICIENT EVIDENCE".
- Cite which check produced each claim using [check:<check_id>].
- Keep the response under 200 words. Plain English. No filler.`;
}

function summarizeDeterministically(input: NarrativeInput): string {
  const lines: string[] = [];
  lines.push(`Investigation of ${input.address} on ${input.chain}.`);
  for (const c of input.checks) {
    lines.push(`- ${c.label} [${c.status.toUpperCase()}]: ${c.summary}`);
  }
  lines.push(
    `\nRecommendation: ${input.recommendation.toUpperCase()}. ${
      input.recommendation === 'stop'
        ? 'Do not proceed without manual verification.'
        : input.recommendation === 'caution'
        ? 'Verify before proceeding.'
        : input.recommendation === 'unknown'
        ? 'INSUFFICIENT EVIDENCE.'
        : 'No major risk signals detected in the checks performed.'
    }`,
  );
  return lines.join('\n');
}

async function callOpenAI(system: string, user: string, model = 'gpt-4o-mini'): Promise<string> {
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

async function callAnthropic(system: string, user: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
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

// Robust JSON extractor for LLM responses that occasionally include ```json fences or chatter.
function extractJson<T>(raw: string): T {
  const trimmed = raw.trim();
  // Try direct parse first
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Pull the first {...} block
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON in response');
    return JSON.parse(m[0]) as T;
  }
}

export async function generateNarrative(input: NarrativeInput): Promise<string> {
  if (!hasLlmKey()) return summarizeDeterministically(input);
  try {
    const sys = `You are OnchainScout's narrator. Your job is to translate structured investigation findings into plain English for a user deciding whether to trust, sign, send, buy, or interact with a contract.
${rulesBlock()}`;
    const user = `Address: ${input.address}\nChain: ${input.chain}\nRecommendation: ${input.recommendation}\n\nStructured findings:\n${JSON.stringify(input.checks, null, 2)}\n\nWrite a 3-paragraph narrative: (1) what this contract is, (2) the key risk signals (with [check:id] citations), (3) the recommended action.`;
    const text = process.env.OPENAI_API_KEY
      ? await callOpenAI(sys, user)
      : await callAnthropic(sys, user);
    return text;
  } catch (e) {
    return (
      summarizeDeterministically(input) +
      `\n\n[Note: LLM narrative unavailable (${(e as Error).message}); using structured summary.]`
    );
  }
}

function summarizeUrlDeterministically(input: UrlNarrativeInput): string {
  const lines: string[] = [];
  lines.push(`Project URL: ${input.url}`);
  lines.push(`Recommendation: ${input.recommendation.toUpperCase()}.`);
  for (const c of input.claims) {
    lines.push(
      `- [${c.category}] ${c.claim} → ${c.status.toUpperCase()}${
        c.onchainEvidence ? ` (${c.onchainEvidence})` : ''
      }`,
    );
  }
  return lines.join('\n');
}

export async function generateUrlNarrative(input: UrlNarrativeInput): Promise<string> {
  if (!hasLlmKey()) return summarizeUrlDeterministically(input);
  try {
    const sys = `You are OnchainScout's narrator for project URLs. Your job is to translate structured claim-verification findings into plain English.
${rulesBlock()}`;
    const user = `URL: ${input.url}\nRecommendation: ${input.recommendation}\n\nStructured claim findings:\n${JSON.stringify(input.claims, null, 2)}\n\nWrite a 3-paragraph narrative: (1) what the project claims, (2) which claims are verified vs contradicted by on-chain evidence (with [claim:<category>] citations), (3) the recommended action.`;
    const text = process.env.OPENAI_API_KEY
      ? await callOpenAI(sys, user)
      : await callAnthropic(sys, user);
    return text;
  } catch (e) {
    return (
      summarizeUrlDeterministically(input) +
      `\n\n[Note: LLM narrative unavailable (${(e as Error).message}); using structured summary.]`
    );
  }
}

// ─── Claim extraction via LLM ─────────────────────────────────────────────

const EXTRACT_SYS = `You are OnchainScout's claim extractor. You read a crypto project's website and extract every concrete marketing claim that the page makes as FACT.

Return strict JSON of the form:
{ "claims": [ { "claim": "string (the claim as it appears)", "category": "users|tvl|audit|chain|partnership|team|traction|other", "rawText": "the surrounding sentence (≤200 chars)" } ] }

Rules:
- Only extract claims stated as FACT (not aspirations, not futures like "will launch")
- Numbers, dates, percentages are facts — extract them verbatim with their units
- "audited by X" / "verified by X" counts as an audit claim
- "live on X" / "deployed to X" counts as a chain claim
- Skip nav copy, headings, button labels, and 404-error text
- Maximum 30 claims; prefer the top 12 most quantitatively verifiable
- If the page has no factual claims, return { "claims": [] }`;

/**
 * LLM-based project-claim extraction. Returns an empty array if the LLM key
 * is absent or the call fails. Caller falls back to regex extraction then.
 */
export async function extractClaimsWithLlm(text: string, url: string): Promise<ExtractedClaim[]> {
  if (!hasLlmKey()) return [];
  const user = `URL: ${url}\n\nPage text (truncated):\n"""${text.slice(0, 30_000)}"""\n\nReturn strict JSON.`;
  try {
    const raw = process.env.OPENAI_API_KEY
      ? await callOpenAI(EXTRACT_SYS, user)
      : await callAnthropic(EXTRACT_SYS, user);
    const parsed = extractJson<{ claims?: ExtractedClaim[] }>(raw);
    const claims = parsed.claims || [];
    // Defensive: filter shape
    return claims.filter(
      (c) =>
        c &&
        typeof c.claim === 'string' &&
        typeof c.category === 'string' &&
        typeof c.rawText === 'string',
    );
  } catch {
    return [];
  }
}
