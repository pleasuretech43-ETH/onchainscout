import type { CheckResult } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';
import { confidenceFor, whyFor } from '../meta';

interface ContractCreation {
  contractCreator: string;
  txHash: string;
}

export async function checkDeployerHistory(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);
  let deployer: string | null = null;

  try {
    const raw = await adapter.call<ContractCreation[]>({
      module: 'contract',
      action: 'getcontractcreation',
      contractaddresses: address,
    });
    if (raw && raw[0]) deployer = raw[0].contractCreator;
  } catch {
    // fall back below
  }

  if (!deployer) {
    try {
      const txs = await adapter.getTxList(address, 1, 20);
      const sorted = [...txs]
        .filter((tx) => tx.from !== '0x0000000000000000000000000000000000000000')
        .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));
      if (sorted.length > 0) deployer = sorted[0].from;
    } catch {
      // best effort
    }
  }

  if (!deployer) {
    return {
      id: 'deployer-history',
      label: 'Deployer history',
      status: 'unknown',
      summary: 'Could not determine deployer address.',
      evidence: [],
      signals: [],
      confidence: 'none',
    };
  }

  let otherContractsCount = 0;
  let otherContractsSample: string[] = [];
  try {
    const txs = await adapter.getTxList(deployer, 1, 200);
    const creations = txs.filter((tx) => tx.to === '' || tx.to === '0x');
    otherContractsCount = creations.length;
    otherContractsSample = creations.slice(0, 5).map((tx) => tx.hash);
  } catch {
    // best effort
  }

  const signals = [`deployer:${deployer}`];
  let status: 'go' | 'caution' = 'go';
  if (otherContractsCount > 20) {
    status = 'caution';
    signals.push('serial-deployer->20');
  } else if (otherContractsCount > 5) {
    signals.push('serial-deployer->5');
  }

  return {
    id: 'deployer-history',
    label: 'Deployer history',
    status,
    summary: `Deployer is ${deployer}. They have deployed approximately ${otherContractsCount} contract(s) previously.`,
    evidence: [
      {
        source: `${adapter.chain.explorer.name}: getcontractcreation + txlist (deployer)`,
        url: `${adapter.chain.explorer.browserUrl}/address/${deployer}`,
        timestamp: new Date().toISOString(),
        data: { deployer, otherContractsCount, otherContractsSample },
      },
    ],
    signals,
    confidence: confidenceFor({ status, signals, evidence: [{}] }) as CheckResult['confidence'],
    why: whyFor(signals),
  };
}
