import type { CheckResult, Confidence, RiskLevel } from './types';

export function confidenceFor(result: {
  status: RiskLevel;
  signals?: string[];
  evidence?: unknown[];
}): Confidence {
  if (result.status === 'unknown') return 'none';
  if (result.status === 'go' || result.status === 'stop') {
    const hasEvidence = Array.isArray(result.evidence) && result.evidence.length > 0;
    const hasSignals = Array.isArray(result.signals) && result.signals.length > 0;
    return hasEvidence && hasSignals ? 'strong' : 'limited';
  }
  return 'limited';
}

const WHY_BY_SIGNAL: Record<string, string> = {
  selfdestruct: 'A selfdestruct call wipes the contract bytecode. If the contract holds user approvals or liquidity, they become unreachable.',
  delegatecall: 'Arbitrary code execution — used legitimately in proxy patterns but also a frequent exploit primitive.',
  upgradeable: 'Proxy contracts can swap their logic. The admin (or admin key) decides what the contract does tomorrow.',
  'mint-capable': 'If minting is open or owner-controlled, supply can be inflated, diluting holders.',
  'transferable-ownership': 'Ownership transfer can move admin to a new key instantly; the prior governance becomes moot.',
  pausable: 'A pausable contract can freeze all transfers in one transaction.',
  'blacklist-capable': 'The owner can arbitrarily exclude any address.',
  'tx-limit': 'Owner can change the maximum transaction size at any time.',
  'mutable-tax': 'Owner can change the buy/sell/transfer tax at any time.',
  'is-proxy': 'A proxy contract delegates logic. The implementation behind it can be swapped arbitrarily.',
  'has-owner': 'An active owner means admin powers are currently exercisable.',
  'ownership-renounced': 'No admin — the contract is fully autonomous. Strongest safety state.',
  'top1->50%': 'A single wallet controls majority of supply — single-point dump risk.',
  'top1->25%': 'A small set of wallets control meaningful supply — coordinated action risk.',
  'liquidity-<10k': 'Extremely thin liquidity. Any non-trivial trade will move price materially.',
  'liquidity-<100k': 'Liquidity is meaningful but small. Slippage on large exits can erode the position.',
  'no-pairs': 'No DEX pairs found — the token cannot be bought or sold through automated venues.',
  'no-volume-24h': 'No recent trading volume — exit depends on finding a buyer.',
  'age-<1d': 'Fresh contract. No public track record of bugs, audits, or operational behavior.',
  'age-<7d': 'Less than a week old. Recent contracts have a higher rugpull rate than established ones.',
  'serial-deployer->5': 'Deployer has shipped more than 5 contracts. Seriality is a soft signal but worth noting.',
  'serial-deployer->20': 'Deployer has shipped more than 20 contracts. Possibly a factory, possibly high-volume deployer.',
  'not-erc20': 'Address does not respond to standard ERC-20 selectors — likely not a token.',
  'is-erc20': 'Address responds as an ERC-20; we treat the asset as a fungible token for further checks.',
};

export function whyFor(signals: string[]): string | undefined {
  for (const s of signals) {
    if (WHY_BY_SIGNAL[s]) return WHY_BY_SIGNAL[s];
  }
  return undefined;
}
