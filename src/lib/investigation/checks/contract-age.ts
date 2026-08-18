import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';
import { confidenceFor, whyFor } from '../meta';

export async function checkContractAge(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);

  let firstTxTimestamp: string | null = null;
  try {
    const txs = await adapter.getTxList(address, 1, 20);
    if (txs.length > 0) {
      const sorted = [...txs]
        .filter((tx) => tx.from !== '0x0000000000000000000000000000000000000000')
        .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));
      firstTxTimestamp = sorted[0]?.timeStamp || txs[0].timeStamp;
    }
  } catch (e) {
    return {
      id: 'contract-age',
      label: 'Contract age',
      status: 'unknown',
      summary: `Could not determine contract age: ${(e as Error).message}`,
      evidence: [],
      signals: [],
      confidence: 'none',
    };
  }

  if (!firstTxTimestamp) {
    return {
      id: 'contract-age',
      label: 'Contract age',
      status: 'unknown',
      summary: 'No transactions found for this address.',
      evidence: [],
      signals: [],
      confidence: 'none',
    };
  }

  const ageDays = Math.floor((Date.now() / 1000 - parseInt(firstTxTimestamp)) / 86_400);

  const signals = [`age-days:${ageDays}`];
  let status: 'go' | 'caution' = 'go';
  if (ageDays < 1) {
    status = 'caution';
    signals.push('age-<1d');
  } else if (ageDays < 7) {
    status = 'caution';
    signals.push('age-<7d');
  } else if (ageDays < 30) {
    signals.push('age-<30d');
  }

  return {
    id: 'contract-age',
    label: 'Contract age',
    status,
    summary: `Contract is ${ageDays} day(s) old (first tx ${new Date(parseInt(firstTxTimestamp) * 1000).toISOString()}).`,
    evidence: [
      {
        source: `${adapter.chain.explorer.name}: txlist`,
        url: `${adapter.chain.explorer.browserUrl}/address/${address}`,
        timestamp: new Date().toISOString(),
        data: { firstTxTimestamp, ageDays },
      },
    ],
    signals,
    confidence: confidenceFor({ status, signals, evidence: [{}] }) as CheckResult['confidence'],
    why: whyFor(signals),
  };
}
