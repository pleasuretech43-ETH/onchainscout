import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';

export async function checkOwnership(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);

  // owner() selector = 0x8da5cb5b
  let ownerResult: string | null = null;
  try {
    const result = await adapter.ethCall(address, '0x8da5cb5b');
    const hex = result.replace(/^0x/, '');
    const padded = hex.padStart(64, '0');
    const ownerHex = '0x' + padded.slice(-40);
    if (ownerHex !== '0x0000000000000000000000000000000000000000') {
      ownerResult = ownerHex;
    }
  } catch {
    // contract doesn't expose owner()
  }

  const browserUrl = adapter.chain.explorer.browserUrl;
  const signals: string[] = [];
  let status: 'go' | 'caution' | 'unknown';
  let summary: string;

  if (ownerResult === null) {
    status = 'unknown';
    summary = 'Contract does not expose a standard owner() slot, or the call failed.';
  } else if (ownerResult === '0x0000000000000000000000000000000000000000') {
    status = 'go';
    signals.push('ownership-renounced');
    summary = 'Ownership appears renounced (owner() returns 0x0).';
  } else {
    signals.push('has-owner', `owner:${ownerResult}`);
    status = 'caution';
    summary = `Contract has an active owner: ${ownerResult}. Verify whether owner powers are restricted (multisig, timelock, DAO).`;
  }

  return {
    id: 'ownership',
    label: 'Ownership',
    status,
    summary,
    evidence: [
      {
        source: `${adapter.chain.rpc.http} eth_call (owner() 0x8da5cb5b)`,
        url: `${browserUrl}/address/${address}`,
        timestamp: new Date().toISOString(),
        data: { owner: ownerResult },
      },
    ],
    signals,
  };
}
