import type { VerifiedClaim } from '@/lib/investigation/types';
import type { RawClaim } from './extractor';
import { extractClaimsWithLlm } from '@/lib/llm';

interface DefiLlamaProtocolSummary {
  slug: string;
  name: string;
  tvl?: number;
  chainTvls?: Record<string, number>;
  category?: string;
  audits?: string;
  audit_links?: string[];
  url?: string;
  chains?: string[];
}

const AUDIT_FIRM_KEYWORDS: Array<{ pattern: RegExp; slugs: string[] }> = [
  { pattern: /trail\s+of\s+bits/i, slugs: ['trail of bits'] },
  { pattern: /open\s*zeppelin/i, slugs: ['openzeppelin'] },
  { pattern: /spearbit/i, slugs: ['spearbit'] },
  { pattern: /chain\s*security/i, slugs: ['chainsecurity'] },
  { pattern: /peckshield/i, slugs: ['peckshield'] },
  { pattern: /certora/i, slugs: ['certora'] },
  { pattern: /quantstamp/i, slugs: ['quantstamp'] },
  { pattern: /consensys\s+diligence/i, slugs: ['consensys diligence'] },
  { pattern: /slowmist/i, slugs: ['slowmist'] },
];

const KNOWN_PROTOCOLS_BY_HOST: Record<string, string> = {
  'uniswap.org': 'uniswap',
  'app.uniswap.org': 'uniswap',
  'aave.com': 'aave',
  'curve.fi': 'curve',
  'compound.finance': 'compound-finance',
  'lido.fi': 'lido',
  'makerdao.com': 'makerdao',
  'aerodrome.finance': 'aerodrome',
  'gmx.io': 'gmx',
  'velodrome.finance': 'velodrome',
  'pancakeswap.finance': 'pancakeswap',
};

function hostnameOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
}

async function lookupDefiLlama(url: string): Promise<DefiLlamaProtocolSummary | null> {
  const host = hostnameOf(url);
  let slug = KNOWN_PROTOCOLS_BY_HOST[host];

  if (!slug) {
    try {
      const r = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' });
      if (!r.ok) return null;
      const all = (await r.json()) as Array<{ slug: string; url?: string }>;
      const match = all.find((p) => {
        if (!p.url) return false;
        try {
          return hostnameOf(p.url) === host;
        } catch {
          return false;
        }
      });
      if (match) slug = match.slug;
    } catch {
      return null;
    }
  }

  if (!slug) return null;
  try {
    const r = await fetch(`https://api.llama.fi/protocol/${slug}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as DefiLlamaProtocolSummary;
  } catch {
    return null;
  }
}

function parseTvlNumber(s: string): number | null {
  const m = s.match(/\$?\s*([\d.,]+)\s*([KkMmBb]?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  if (isNaN(n)) return null;
  const mult: Record<string, number> = { '': 1, K: 1e3, k: 1e3, M: 1e6, m: 1e6, B: 1e9, b: 1e9 };
  return n * (mult[m[2]] || 1);
}

export async function extractAllClaims(
  text: string,
  url: string,
  regexExtractor: (t: string) => RawClaim[],
): Promise<RawClaim[]> {
  const regexClaims = regexExtractor(text);

  // Try LLM; merge on success, fall back to regex on failure or absence.
  const llmClaims = await extractClaimsWithLlm(text, url);
  if (llmClaims.length === 0) return regexClaims;

  // Merge LLM-discovered claims into the regex set, preserving source tags.
  const merged: RawClaim[] = [...regexClaims];
  const seen = new Set(regexClaims.map((c) => c.claim.toLowerCase()));
  for (const c of llmClaims) {
    const norm = c.claim.toLowerCase().trim();
    if (!seen.has(norm)) {
      seen.add(norm);
      merged.push({
        claim: c.claim,
        category: (c.category as RawClaim['category']) || 'other',
        rawText: c.rawText,
        source: 'llm',
      });
    }
  }
  return merged;
}

export async function verifyClaims(
  claims: RawClaim[],
  url: string,
): Promise<VerifiedClaim[]> {
  const llama = await lookupDefiLlama(url);

  return Promise.all(
    claims.map(async (c): Promise<VerifiedClaim> => {
      switch (c.category) {
        case 'tvl':
          return { ...verifyTvlClaim(c, llama), source: c.source ?? 'OnchainScout' };
        case 'audit':
          return { ...verifyAuditClaim(c, llama), source: c.source ?? 'OnchainScout' };
        case 'chain':
          return { ...verifyChainClaim(c, llama), source: c.source ?? 'OnchainScout' };
        case 'users':
          // No reliable on-chain user count
          return {
            ...c,
            status: 'insufficient-evidence',
            onchainEvidence: null,
            source: c.source ?? 'OnchainScout',
          };
        default:
          return {
            ...c,
            status: 'unverified',
            onchainEvidence: null,
            source: c.source ?? 'OnchainScout',
          };
      }
    }),
  );
}

function verifyTvlClaim(c: RawClaim, llama: DefiLlamaProtocolSummary | null): VerifiedClaim {
  const claimed = parseTvlNumber(c.claim);
  if (!llama || typeof llama.tvl !== 'number') {
    return {
      ...c,
      status: 'insufficient-evidence',
      onchainEvidence: llama ? 'Protocol not found in DefiLlama' : 'DefiLlama unreachable',
      source: 'DefiLlama',
    };
  }
  if (claimed === null) {
    return {
      ...c,
      status: 'insufficient-evidence',
      onchainEvidence: `DefiLlama TVL: $${llama.tvl.toLocaleString()}`,
      source: 'DefiLlama',
      sourceUrl: `https://defillama.com/protocol/${llama.slug}`,
    };
  }
  const ratio = claimed / llama.tvl;
  let status: VerifiedClaim['status'];
  if (ratio >= 0.7 && ratio <= 1.5) status = 'verified';
  else if (ratio >= 0.3 && ratio <= 3) status = 'partial';
  else if (llama.tvl === 0 && claimed > 0) status = 'contradicted';
  else status = 'contradicted';
  return {
    ...c,
    status,
    onchainEvidence: `DefiLlama TVL: $${llama.tvl.toLocaleString()}; claimed ratio: ${ratio.toFixed(2)}`,
    source: 'DefiLlama',
    sourceUrl: `https://defillama.com/protocol/${llama.slug}`,
  };
}

function verifyAuditClaim(c: RawClaim, llama: DefiLlamaProtocolSummary | null): VerifiedClaim {
  if (!llama) {
    return {
      ...c,
      status: 'insufficient-evidence',
      onchainEvidence: 'DefiLlama unreachable or protocol not listed',
      source: 'DefiLlama',
    };
  }
  const auditsCombined = `${llama.audits || ''} ${(llama.audit_links || []).join(' ')}`;
  const matched = AUDIT_FIRM_KEYWORDS.find((f) => f.pattern.test(c.claim));
  if (!matched) {
    return {
      ...c,
      status: 'unverified',
      onchainEvidence: 'Auditor not in known-firm list',
      source: 'DefiLlama',
    };
  }
  const isListed = matched.slugs.some((s) => auditsCombined.toLowerCase().includes(s.toLowerCase()));
  return {
    ...c,
    status: isListed ? 'verified' : 'unverified',
    onchainEvidence: isListed
      ? `Listed in DefiLlama audits field`
      : `Not found in DefiLlama audits field`,
    source: 'DefiLlama',
    sourceUrl: `https://defillama.com/protocol/${llama.slug}`,
  };
}

function verifyChainClaim(c: RawClaim, llama: DefiLlamaProtocolSummary | null): VerifiedClaim {
  if (!llama || !llama.chains) {
    return {
      ...c,
      status: 'insufficient-evidence',
      onchainEvidence: 'Chain data unavailable',
      source: 'DefiLlama',
    };
  }
  const claimedChain = (c.claim.match(/live\s+on\s+(\w+)/i)?.[1] || '').toLowerCase();
  const found = llama.chains.map((s) => s.toLowerCase()).some((chain) => claimedChain && chain.includes(claimedChain));
  return {
    ...c,
    status: found ? 'verified' : 'contradicted',
    onchainEvidence: found
      ? `Listed in DefiLlama chains: ${llama.chains.join(', ')}`
      : `Not in DefiLlama chains: ${llama.chains.join(', ')}`,
    source: 'DefiLlama',
    sourceUrl: `https://defillama.com/protocol/${llama.slug}`,
  };
}
