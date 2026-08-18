import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';
import { confidenceFor, whyFor } from '../meta';

export async function checkProxyUpgradeable(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);
  const sources = await adapter.getContractSource(address);
  const first = sources?.[0];
  const explorerName = adapter.chain.explorer.name;
  const browserUrl = adapter.chain.explorer.browserUrl;

  if (!first) {
    return {
      id: 'proxy-upgradeable',
      label: 'Proxy / upgradeability',
      status: 'unknown',
      summary: 'No source data returned.',
      evidence: [],
      signals: [],
      confidence: 'none',
    };
  }

  const isProxy = first.Proxy === '1';
  const implementation = first.Implementation || null;
  const signals = isProxy
    ? ['is-proxy', ...(implementation ? [`implementation:${implementation}`] : ['implementation-unknown'])]
    : ['not-proxy'];

  if (isProxy) {
    return {
      id: 'proxy-upgradeable',
      label: 'Proxy / upgradeability',
      status: 'caution',
      summary: `This is a proxy contract pointing to implementation ${implementation || '(unknown)'}. The implementation can be changed by the proxy admin. Verify whether the admin is renounced, a multisig, or a DAO you trust.`,
      evidence: [
        {
          source: `${explorerName}: getsourcecode (Proxy=1)`,
          url: `${browserUrl}/address/${address}#code`,
          timestamp: new Date().toISOString(),
          data: { Implementation: implementation, Proxy: 'EIP-1967' },
        },
      ],
      signals,
      confidence: 'strong',
      why: whyFor(signals),
    };
  }

  return {
    id: 'proxy-upgradeable',
    label: 'Proxy / upgradeability',
    status: 'go',
    summary: 'No proxy pattern detected. Logic is fixed at this address.',
    evidence: [
      {
        source: `${explorerName}: getsourcecode`,
        url: `${browserUrl}/address/${address}#code`,
        timestamp: new Date().toISOString(),
        data: { Proxy: first.Proxy, Implementation: null },
      },
    ],
    signals,
    confidence: 'strong',
    why: whyFor(signals),
  };
}
