import type { VerifiedClaim } from '@/lib/investigation/types';

export interface RawClaim {
  claim: string;
  category: VerifiedClaim['category'];
  rawText: string;
  source?: 'regex' | 'llm';
}

/**
 * Regex-based claim extraction fallback (no LLM).
 * Catches the most common forms:
 *   "1M users", "$2B TVL", "audited by Trail of Bits", "live on Ethereum"
 */
export function extractClaims(text: string): RawClaim[] {
  const claims: RawClaim[] = [];

  const userRegex = /([\d.,]+[KkMmBb]?\+?)\s+(users|wallets|holders|traders|customers|monthly\s+active|active\s+users|DAU|MAU)/gi;
  for (const m of text.matchAll(userRegex)) {
    claims.push({
      claim: m[0].trim(),
      category: 'users',
      rawText: m[0],
      source: 'regex',
    });
  }

  const tvlRegex = /(\$[\d.,]+[KkMmBb]?\s+TVL|total\s+value\s+locked\s+(?:of|is|:)?\s*\$?[\d.,]+[KkMmBb]?|TVL\s+(?:of|is|:)?\s*\$[\d.,]+[KkMmBb]?)/gi;
  for (const m of text.matchAll(tvlRegex)) {
    claims.push({
      claim: m[0].trim(),
      category: 'tvl',
      rawText: m[0],
      source: 'regex',
    });
  }

  const auditRegex = /audited\s+by\s+([A-Z][A-Za-z0-9 &.\-]{2,40}?)(?:\.|,|;|!|$)/gim;
  for (const m of text.matchAll(auditRegex)) {
    const auditor = m[1].trim();
    claims.push({
      claim: `Audited by ${auditor}`,
      category: 'audit',
      rawText: m[0],
      source: 'regex',
    });
  }

  const chainRegex = /live\s+on\s+(ethereum|base|arbitrum|optimism|polygon|bsc|bnb|mainnet|sepolia)/gi;
  for (const m of text.matchAll(chainRegex)) {
    claims.push({
      claim: m[0].trim(),
      category: 'chain',
      rawText: m[0],
      source: 'regex',
    });
  }

  // De-duplicate by claim text
  const seen = new Set<string>();
  return claims.filter((c) => {
    if (seen.has(c.claim.toLowerCase())) return false;
    seen.add(c.claim.toLowerCase());
    return true;
  });
}
