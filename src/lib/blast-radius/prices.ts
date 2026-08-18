import type { ChainId } from '@/lib/chains';

interface LlamaPriceResponse {
  coins: Record<string, { price: number; symbol?: string }>;
}

// Map our chain + token → DefiLlama coin key (`ethereum:0x...`).
function llamaKey(chain: ChainId, token: string | null): string | null {
  const chainMap: Record<ChainId, string> = {
    ethereum: 'ethereum',
    base: 'base',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    polygon: 'polygon',
    bnb: 'bsc',
  };
  if (!token) return null; // native balance price-by-symbol handled separately
  return `${chainMap[chain]}:${token.toLowerCase()}`;
}

const symbolToLlamaKey: Record<string, string> = {
  ETH: 'coingecko:ethereum',
  WETH: 'coingecko:ethereum',
  POL: 'coingecko:matic-network',
  BNB: 'coingecko:binancecoin',
};

const PRICE_CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; price: number }>();

export async function fetchPriceUsd(
  chain: ChainId,
  token: string | null,
  symbol: string,
  _decimals: number,
  amountWei: bigint,
): Promise<number | null> {
  if (amountWei === 0n) return 0;

  let key: string | null = null;
  if (token) key = llamaKey(chain, token);
  else if (symbolToLlamaKey[symbol.toUpperCase()]) key = symbolToLlamaKey[symbol.toUpperCase()];

  if (!key) return null;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < PRICE_CACHE_TTL_MS) {
    return Number(formatUnitsBigInt(amountWei, _decimals)) * cached.price;
  }

  try {
    const url = `https://coins.llama.fi/prices/current/${key}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = (await r.json()) as LlamaPriceResponse;
    const entry = j.coins?.[key];
    if (!entry?.price) return null;
    cache.set(key, { at: Date.now(), price: entry.price });
    return Number(formatUnitsBigInt(amountWei, _decimals)) * entry.price;
  } catch {
    return null;
  }
}

function formatUnitsBigInt(wei: bigint, decimals: number): string {
  const denom = 10n ** BigInt(decimals);
  const whole = wei / denom;
  const frac = wei % denom;
  return `${whole.toString()}.${frac.toString().padStart(decimals, '0').slice(0, 6)}`;
}
