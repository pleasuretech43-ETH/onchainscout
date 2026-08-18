import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';

export async function checkVerified(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);
  const sources = await adapter.getContractSource(address);
  const first = sources?.[0];
  const explorerName = adapter.chain.explorer.name;
  const browserUrl = adapter.chain.explorer.browserUrl;

  if (!first) {
    return {
      id: 'verified',
      label: 'Contract source verified',
      status: 'unknown',
      summary: 'Explorer returned no source-code data.',
      evidence: [],
      signals: [],
    };
  }
  const verified =
    Boolean(first.SourceCode) &&
    first.SourceCode !== 'Contract source code not verified' &&
    first.SourceCode !== '';
  const proxy = first.Proxy === '1';

  return {
    id: 'verified',
    label: 'Contract source verified',
    status: verified ? 'go' : 'stop',
    summary: verified
      ? `Source code is verified on ${explorerName}. Name: ${first.ContractName || 'Unnamed'}; compiler: ${first.CompilerVersion || 'unknown'}.${proxy ? ' This is a proxy — the logic behind it can change.' : ''}`
      : `Source code is NOT verified on ${explorerName}. You cannot audit what you cannot read. Treat as opaque.`,
    evidence: [
      {
        source: `${explorerName}: getsourcecode`,
        url: `${browserUrl}/address/${address}#code`,
        timestamp: new Date().toISOString(),
        data: {
          ContractName: first.ContractName,
          CompilerVersion: first.CompilerVersion,
          Proxy: first.Proxy === '1' ? 'EIP-1967 proxy' : 'no proxy',
          Implementation: first.Implementation || null,
        },
      },
    ],
    signals: verified ? ['source-verified', ...(proxy ? ['is-proxy'] : [])] : ['source-unverified'],
  };
}
