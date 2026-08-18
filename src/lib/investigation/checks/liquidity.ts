import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { confidenceFor, whyFor } from '../meta';

const CHAIN_TO_DEXSCREENER: Record<ChainId, string> = {
  ethereum: 'ethereum',
  base: 'base',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  polygon: 'polygon',
  bnb: 'bsc',
};

interface DexPair {
  chainId: string;
  dexId: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceUsd?: string;
  pairCreatedAt?: number;
  url?: string;
}

interface DexResponse {
  pairs?: DexPair[];
}

export async function checkLiquidity(address: string, chain: ChainId): Promise<CheckResult> {
  const target = CHAIN_TO_DEXSCREENER[chain];
  let pairs: DexPair[] = [];

  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Dexscreener HTTP ${r.status}`);
    const data = (await r.json()) as DexResponse;
    pairs = (data.pairs || []).filter((p) => p.chainId === target);
  } catch (e) {
    return {
      id: 'liquidity',
      label: 'Liquidity depth',
      status: 'unknown',
      summary: `Could not reach Dexscreener: ${(e as Error).message}`,
      evidence: [],
      signals: [],
      confidence: 'none',
    };
  }

  if (pairs.length === 0) {
    return {
      id: 'liquidity',
      label: 'Liquidity depth',
      status: 'stop',
      summary: 'No DEX pairs found for this token on the selected chain. Cannot be bought or sold here.',
      evidence: [
        {
          source: 'Dexscreener: /latest/dex/tokens/{address}',
          url: `https://dexscreener.com/${chain}/${address}`,
          timestamp: new Date().toISOString(),
          data: { pairsFound: 0 },
        },
      ],
      signals: ['no-pairs'],
      confidence: 'strong',
      why: 'No automated DEX pairs were found on the chain selector. Without pairs, the trade cannot settle.',
    };
  }

  pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  const top = pairs[0];
  const liq = top.liquidity?.usd ?? 0;
  const vol24 = top.volume?.h24 ?? 0;

  const signals: string[] = [];
  let status: 'go' | 'caution' | 'stop' = 'go';
  if (liq < 10_000) {
    status = 'stop';
    signals.push('liquidity-<10k');
  } else if (liq < 100_000) {
    status = 'caution';
    signals.push('liquidity-<100k');
  }
  if (vol24 === 0 && liq > 0) signals.push('no-volume-24h');

  return {
    id: 'liquidity',
    label: 'Liquidity depth',
    status,
    summary: `Found ${pairs.length} DEX pair(s). Top pair on ${top.dexId} has $${liq.toLocaleString()} liquidity and $${vol24.toLocaleString()} 24h volume.`,
    evidence: [
      {
        source: 'Dexscreener: /latest/dex/tokens/{address}',
        url: top.url ?? `https://dexscreener.com/${chain}/${address}`,
        timestamp: new Date().toISOString(),
        data: {
          totalPairs: pairs.length,
          topPair: {
            dex: top.dexId,
            liquidity: liq,
            vol24,
            priceUsd: top.priceUsd,
            createdAt: top.pairCreatedAt ? new Date(top.pairCreatedAt).toISOString() : null,
          },
        },
      },
    ],
    signals,
    confidence: confidenceFor({ status, signals, evidence: [{}] }) as CheckResult['confidence'],
    why: whyFor(signals),
  };
}
