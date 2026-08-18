import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';
import { fetchPriceUsd } from './prices';

export interface BlastRadiusToken {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: string;
  allowance: string;
  balanceUsd: number | null;
  allowanceUsd: number | null;
}

export interface BlastRadiusResult {
  wallet: string;
  contract: string;
  chain: ChainId;
  nativeBalance: string;
  nativeSymbol: string;
  nativeBalanceUsd: number | null;
  tokens: BlastRadiusToken[];
  maxIdentifiableExposureUsd: number;
  warnings: string[];
  finishedAt: string;
}

// ERC20 selectors
const SEL_BALANCE_OF = '0x70a08231';   // balanceOf(address)
const SEL_ALLOWANCE = '0xdd62ed3e';    // allowance(address,address)
const SEL_SYMBOL = '0x95d89b41';
const SEL_DECIMALS = '0x313ce567';

// Decode a uint256 returned by eth_call to a BigInt string
function decodeUint(hex: string): bigint {
  const h = hex.replace(/^0x/, '');
  return BigInt('0x' + (h.length === 64 ? h : h.padStart(64, '0')));
}

// Decode a bytes32 (right-padded 32 bytes) symbol into a UTF-8 string
function decodeSymbol(hex: string): string {
  const h = hex.replace(/^0x/, '');
  const buf = Buffer.from(h, 'hex');
  const end = buf.indexOf(0);
  return buf.subarray(0, end === -1 ? Math.min(buf.length, 32) : end).toString('utf8').trim();
}

function encodeAddressParam(addr: string): string {
  // Pad address to 32 bytes (no 0x prefix on input)
  return addr.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

const TOKENTX_PAGE_SIZE = 100;

export async function computeBlastRadius(
  wallet: string,
  contract: string,
  chain: ChainId,
  opts: { maxTokens?: number; timeoutMs?: number } = {},
): Promise<BlastRadiusResult> {
  const adapter = getAdapter(chain);
  const maxTokens = opts.maxTokens ?? 20;
  const timeoutMs = opts.timeoutMs ?? 25_000;
  const start = Date.now();
  const warnings: string[] = [];

  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet) || !/^0x[a-fA-F0-9]{40}$/.test(contract)) {
    throw new Error('Invalid wallet or contract address');
  }

  // Native balance
  let nativeBalance = '0';
  try {
    nativeBalance = await adapter.getNativeBalance(wallet);
  } catch (e) {
    warnings.push(`native balance: ${(e as Error).message}`);
  }
  const nativeWei = BigInt(nativeBalance);

  // Enumerate tokens the wallet has interacted with via tokentx
  let tokenAddresses: string[] = [];
  try {
    const txs = await adapter.call<Array<{ contractAddress: string }>>({
      module: 'account',
      action: 'tokentx',
      address: wallet,
      page: '1',
      offset: String(TOKENTX_PAGE_SIZE),
      sort: 'desc',
    });
    const seen = new Set<string>();
    for (const t of txs || []) {
      const a = (t.contractAddress || '').toLowerCase();
      if (a && a !== '0x0000000000000000000000000000000000000000' && !seen.has(a)) {
        seen.add(a);
        tokenAddresses.push(a);
        if (tokenAddresses.length >= maxTokens) break;
      }
    }
  } catch (e) {
    warnings.push(`tokentx enumeration: ${(e as Error).message}`);
  }

  // For each token: read symbol, decimals, balance, allowance
  const tokens: BlastRadiusToken[] = [];
  for (const token of tokenAddresses) {
    if (Date.now() - start > timeoutMs) {
      warnings.push(`timeout reached after ${tokenAddresses.length - tokens.length} tokens`);
      break;
    }
    let symbol = '';
    let decimals = 18;
    let balanceWei = 0n;
    let allowanceWei = 0n;

    try {
      const decR = await adapter.ethCall(token, SEL_DECIMALS);
      const dec = Number(decodeUint(decR));
      if (!isNaN(dec) && dec <= 36) decimals = dec;
    } catch {
      // ignore
    }
    try {
      const symR = await adapter.ethCall(token, SEL_SYMBOL);
      symbol = decodeSymbol(symR);
    } catch {
      // ignore
    }
    try {
      const balR = await adapter.ethCall(token, SEL_BALANCE_OF + encodeAddressParam(wallet));
      balanceWei = decodeUint(balR);
    } catch {
      // ignore
    }
    try {
      const allowR = await adapter.ethCall(
        token,
        SEL_ALLOWANCE + encodeAddressParam(wallet) + encodeAddressParam(contract),
      );
      allowanceWei = decodeUint(allowR);
    } catch {
      // ignore
    }

    if (balanceWei === 0n && allowanceWei === 0n) continue;

    const balance = formatUnits(balanceWei, decimals);
    const allowance = formatUnits(allowanceWei, decimals);
    const [balanceUsd, allowanceUsd] = await Promise.all([
      symbol ? fetchPriceUsd(chain, token, symbol, decimals, balanceWei) : Promise.resolve(null),
      symbol ? fetchPriceUsd(chain, token, symbol, decimals, allowanceWei) : Promise.resolve(null),
    ]);

    tokens.push({
      tokenAddress: token,
      symbol,
      decimals,
      balance,
      allowance,
      balanceUsd,
      allowanceUsd,
    });
  }

  const nativeBalanceFmt = formatUnits(nativeWei, 18);
  const nativeBalanceUsd = await fetchPriceUsd(chain, null, adapter.chain.native.symbol, 18, nativeWei);

  let maxExposure = 0;
  for (const t of tokens) {
    if (typeof t.allowanceUsd === 'number') maxExposure += t.allowanceUsd;
  }
  if (typeof nativeBalanceUsd === 'number') maxExposure += nativeBalanceUsd;

  return {
    wallet,
    contract,
    chain,
    nativeBalance: nativeBalanceFmt,
    nativeSymbol: adapter.chain.native.symbol,
    nativeBalanceUsd,
    tokens,
    maxIdentifiableExposureUsd: maxExposure,
    warnings,
    finishedAt: new Date().toISOString(),
  };
}

function formatUnits(wei: bigint, decimals: number): string {
  const denom = 10n ** BigInt(decimals);
  const whole = wei / denom;
  const frac = wei % denom;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole.toString()}.${fracStr}`;
}
