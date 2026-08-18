import { NextRequest, NextResponse } from 'next/server';
import { fetchUrlText } from '@/lib/url-input/fetcher';
import { extractClaims } from '@/lib/url-input/extractor';
import { extractAllClaims, verifyClaims } from '@/lib/url-input/verifier';
import { generateUrlNarrative, hasLlmKey } from '@/lib/llm';
import type { InvestigationResult, VerifiedClaim } from '@/lib/investigation/types';

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const url = (body.url || '').trim();
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let text: string;
  let finalUrl: string;
  try {
    const r = await fetchUrlText(url);
    text = r.text;
    finalUrl = r.finalUrl;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const rawClaims = await extractAllClaims(text, finalUrl, extractClaims);
  const claims = await verifyClaims(rawClaims, finalUrl);

  const recommendation = deriveRecommendation(claims);
  const headline = buildHeadline(claims);
  const narrative = await generateNarrativeForUrl(finalUrl, claims, recommendation);

  const result = {
    address: finalUrl,
    chain: 'ethereum' as const,
    isContract: false,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    checks: [],
    trace: [],
    blastRadiusUsd: null,
    recommendation,
    headline,
    narrative,
    riskDimensions: [],
    insufficientEvidence: claims.every((c) => c.status === 'insufficient-evidence'),
    errors: [],
    inputType: 'url' as const,
    claims,
    text,
    finalUrl,
    llmEnabled: hasLlmKey(),
  };

  return NextResponse.json(result);
}

function deriveRecommendation(claims: VerifiedClaim[]): 'go' | 'caution' | 'stop' | 'unknown' {
  if (claims.length === 0) return 'unknown';
  if (claims.some((c) => c.status === 'contradicted')) return 'stop';
  if (claims.filter((c) => c.status === 'unverified' || c.status === 'partial').length >= 2) return 'caution';
  if (claims.some((c) => c.status === 'unverified' || c.status === 'partial')) return 'caution';
  if (claims.every((c) => c.status === 'verified')) return 'go';
  return 'unknown';
}

function buildHeadline(claims: VerifiedClaim[]): string {
  if (claims.length === 0) return 'No verifiable marketing claims found on the page.';
  const v = claims.filter((c) => c.status === 'verified').length;
  const u = claims.filter((c) => c.status === 'unverified' || c.status === 'partial').length;
  const c = claims.filter((c) => c.status === 'contradicted').length;
  const ie = claims.filter((c) => c.status === 'insufficient-evidence').length;
  return `Found ${claims.length} claims on the page: ${v} verified, ${u} unverified/partial, ${c} contradicted, ${ie} insufficient evidence.`;
}

async function generateNarrativeForUrl(
  url: string,
  claims: VerifiedClaim[],
  recommendation: 'go' | 'caution' | 'stop' | 'unknown',
): Promise<string> {
  try {
    return await generateUrlNarrative({ url, claims, recommendation });
  } catch (e) {
    return [
      `Project URL: ${url}`,
      `Recommendation: ${recommendation.toUpperCase()}.`,
      ...claims.map(
        (c) =>
          `- [${c.category}] ${c.claim} → ${c.status.toUpperCase()}${
            c.onchainEvidence ? ` (${c.onchainEvidence})` : ''
          }`,
      ),
      `[LLM narrative unavailable: ${(e as Error).message}]`,
    ].join('\n');
  }
}
