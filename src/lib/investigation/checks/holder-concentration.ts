import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';

interface TokenHolder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
  Percent: string;
}

export async function checkHolderConcentration(
  address: string,
  chain: ChainId,
): Promise<CheckResult> {
  const adapter = getAdapter(chain);
  let holders: Array<{ address: string; balance: string; share: number }> = [];
  let source = '';

  try {
    const raw = await adapter.call<TokenHolder[]>({
      module: 'token',
      action: 'tokenholderlist',
      contractaddress: address,
      page: '1',
      offset: '20',
    });
    source = `${adapter.chain.explorer.name} V2: tokenholderlist`;
    holders = (raw || []).map((h) => ({
      address: h.TokenHolderAddress,
      balance: h.TokenHolderQuantity,
      share: parseFloat(h.Percent) || 0,
    }));
  } catch (e) {
    return {
      id: 'holder-concentration',
      label: 'Holder concentration',
      status: 'unknown',
      summary: `Could not retrieve holder list: ${(e as Error).message}`,
      evidence: [],
      signals: [],
    };
  }

  if (holders.length === 0) {
    return {
      id: 'holder-concentration',
      label: 'Holder concentration',
      status: 'unknown',
      summary: 'No holders returned (token may be non-ERC20, or has no transfers).',
      evidence: [],
      signals: [],
    };
  }

  const top1 = holders[0]?.share ?? 0;
  const top10 = holders.slice(0, 10).reduce((s, h) => s + h.share, 0);

  let status: 'go' | 'caution' | 'stop' = 'go';
  const signals: string[] = [];
  if (top1 > 50) {
    status = 'stop';
    signals.push('top1->50%');
  } else if (top1 > 25) {
    status = 'caution';
    signals.push('top1->25%');
  }
  if (top10 > 90) signals.push('top10->90%');
  else if (top10 > 80) signals.push('top10->80%');

  return {
    id: 'holder-concentration',
    label: 'Holder concentration',
    status,
    summary: `Top holder owns ${top1.toFixed(1)}% of supply; top 10 hold ${top10.toFixed(1)}% (sampled ${holders.length}).`,
    evidence: [
      {
        source,
        url: `${adapter.chain.explorer.browserUrl}/token/${address}#balances`,
        timestamp: new Date().toISOString(),
        data: { top10: holders.slice(0, 10) },
      },
    ],
    signals,
  };
}
