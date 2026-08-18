import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';

/**
 * Honeypot / sellability probe.
 *
 * Honest limitation: full honeypot detection (simulating buy→sell) requires a state fork
 * (Tenderly, Foundry). Without one, we can only check whether the contract is even an ERC20
 * (symbol/decimals respond) and flag the verdict as INSUFFICIENT EVIDENCE for tokens that
 * pass that gate. We refuse to guess.
 *
 * Future work: integrate a Tenderly fork or Anvil to do a true sell-simulation.
 */
export async function checkHoneypot(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);

  let isToken = false;
  let decimals = 18;
  let symbol = '';

  try {
    const decResult = await adapter.ethCall(address, '0x313ce567'); // decimals()
    const dec = parseInt(decResult, 16);
    if (!isNaN(dec) && dec <= 36) {
      decimals = dec;
      isToken = true;
    }
  } catch {
    // not an ERC20
  }

  try {
    const symResult = await adapter.ethCall(address, '0x95d89b41'); // symbol()
    const hex = symResult.replace(/^0x/, '');
    const buf = Buffer.from(hex, 'hex');
    const end = buf.indexOf(0);
    symbol = buf.subarray(0, end === -1 ? Math.min(buf.length, 32) : end).toString('utf8').trim();
    if (symbol) isToken = true;
  } catch {
    // no symbol response
  }

  if (!isToken) {
    return {
      id: 'honeypot',
      label: 'Honeypot / sellability probe',
      status: 'unknown',
      summary:
        'Address does not appear to be an ERC20 token (symbol/decimals not responding). Honeypot probe is N/A.',
      evidence: [],
      signals: ['not-erc20'],
    };
  }

  return {
    id: 'honeypot',
    label: 'Honeypot / sellability probe',
    status: 'unknown',
    summary: `Contract responds as an ERC20 (symbol="${symbol}", decimals=${decimals}). Full honeypot detection requires state-fork simulation; we flag this as INSUFFICIENT EVIDENCE rather than guess. Verify on a DEX interface before any buy.`,
    evidence: [
      {
        source: `${adapter.chain.rpc.http} eth_call (decimals 0x313ce567 + symbol 0x95d89b41)`,
        timestamp: new Date().toISOString(),
        data: { symbol, decimals },
      },
    ],
    signals: ['is-erc20', 'honeypot-undetectable-without-state-fork'],
  };
}
