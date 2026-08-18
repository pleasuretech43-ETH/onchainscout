import type { CheckResult, RiskLevel } from '../types';
import type { ChainId } from '@/lib/chains';
import { getAdapter } from '@/lib/chains';

interface DangerousFnDef {
  name: string;
  signal: string;
  explanation: string;
  severity: RiskLevel;
}

const DANGEROUS_FUNCTIONS: DangerousFnDef[] = [
  { name: 'selfdestruct', signal: 'selfdestruct', explanation: 'Contract can permanently destroy itself and any ETH held.', severity: 'stop' },
  { name: 'delegatecall', signal: 'delegatecall', explanation: 'Contract can execute arbitrary code from another contract (common in proxy patterns).', severity: 'caution' },
  { name: 'upgradeTo', signal: 'upgradeable', explanation: 'Contract implements upgradeability; the logic behind it can change.', severity: 'caution' },
  { name: 'mint', signal: 'mint-capable', explanation: 'Owner can mint new tokens, diluting holders.', severity: 'caution' },
  { name: 'setOwner', signal: 'transferable-ownership', explanation: 'Ownership can be transferred to a new address at any time.', severity: 'caution' },
  { name: 'renounceOwnership', signal: 'has-renounce', explanation: 'Ownership can be renounced — positive if already renounced.', severity: 'go' },
  { name: 'pause', signal: 'pausable', explanation: 'Owner can pause all transfers (potential exit-scam primitive).', severity: 'caution' },
  { name: 'unpause', signal: 'pausable', explanation: 'Owner can resume paused transfers.', severity: 'caution' },
  { name: 'setBlacklist', signal: 'blacklist-capable', explanation: 'Owner can blacklist addresses from transacting.', severity: 'caution' },
  { name: 'setMaxTxAmount', signal: 'tx-limit', explanation: 'Owner can change the maximum transaction size.', severity: 'caution' },
  { name: 'setTaxFeePercent', signal: 'mutable-tax', explanation: 'Owner can change the buy/sell tax.', severity: 'caution' },
];

export async function checkDangerousFunctions(address: string, chain: ChainId): Promise<CheckResult> {
  const adapter = getAdapter(chain);
  const abiStr = await adapter.getContractAbi(address);
  const explorerName = adapter.chain.explorer.name;

  if (!abiStr) {
    return {
      id: 'dangerous-functions',
      label: 'Dangerous function surface',
      status: 'unknown',
      summary: 'No ABI returned; cannot enumerate function surface.',
      evidence: [],
      signals: [],
    };
  }

  let abi: Array<{ name?: string; type?: string }> = [];
  try {
    abi = JSON.parse(abiStr);
  } catch {
    return {
      id: 'dangerous-functions',
      label: 'Dangerous function surface',
      status: 'unknown',
      summary: 'ABI malformed.',
      evidence: [],
      signals: [],
    };
  }

  const fnNames = new Set(
    abi.filter((x) => x.type === 'function').map((x) => x.name).filter(Boolean) as string[],
  );
  const findings = DANGEROUS_FUNCTIONS.filter((d) => fnNames.has(d.name));
  const signals = findings.map((f) => f.signal);

  let status: RiskLevel = 'go';
  if (findings.some((f) => f.severity === 'stop')) status = 'stop';
  else if (findings.some((f) => f.severity === 'caution')) status = 'caution';

  const summary =
    findings.length === 0
      ? `No high-risk functions found in the public ABI. Surface looks normal.`
      : `Found ${findings.length} potentially risky function(s): ${findings.map((f) => f.name).join(', ')}.`;

  return {
    id: 'dangerous-functions',
    label: 'Dangerous function surface',
    status,
    summary,
    evidence: [
      {
        source: `${explorerName}: getabi`,
        url: `${adapter.chain.explorer.browserUrl}/address/${address}#code`,
        timestamp: new Date().toISOString(),
        data: {
          totalFunctions: abi.filter((x) => x.type === 'function').length,
          findings: findings.map((f) => ({ fn: f.name, signal: f.signal, severity: f.severity })),
        },
      },
    ],
    signals,
  };
}
