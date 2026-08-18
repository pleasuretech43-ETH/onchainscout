'use client';

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
}

export interface WalletState {
  address: string;
  chainId: number;
  provider: 'metamask' | 'coinbase' | 'rabby' | 'brave' | 'generic';
  connectedAt: number;
}

const KEY = 'onchainscout:wallet';

export const CHAIN_NAME: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  42161: 'Arbitrum',
  10: 'Optimism',
  137: 'Polygon',
  56: 'BNB',
  11155111: 'Sepolia',
};

export const CHAIN_HEX: Record<number, string> = {
  1: '#627eea',
  8453: '#0052ff',
  42161: '#28a0f0',
  10: '#ff0420',
  137: '#8247e5',
  56: '#f0b90b',
  11155111: '#a7a9be',
};

export function detectProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

export function detectProviderName(eth: EthereumProvider): WalletState['provider'] {
  if (eth.isMetaMask) return 'metamask';
  if (eth.isCoinbaseWallet) return 'coinbase';
  if (eth.isRabby) return 'rabby';
  if (eth.isBraveWallet) return 'brave';
  return 'generic';
}

export function walletInstalled(): boolean {
  return detectProvider() !== null;
}

export async function connectWallet(): Promise<WalletState> {
  const eth = detectProvider();
  if (!eth) {
    throw new Error(
      'No EIP-1193 wallet detected. Install MetaMask, Coinbase Wallet, Rabby, or use a browser with built-in crypto.',
    );
  }
  const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  const chainIdHex = (await eth.request({ method: 'eth_chainId' })) as string;
  if (!accounts.length) throw new Error('Wallet returned no accounts — did you reject the connection?');
  const state: WalletState = {
    address: accounts[0],
    chainId: parseInt(chainIdHex, 16),
    provider: detectProviderName(eth),
    connectedAt: Date.now(),
  };
  saveWallet(state);
  return state;
}

export function saveWallet(state: WalletState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('onchainscout:wallet', { detail: state }));
}

export function readWallet(): WalletState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletState;
    if (!parsed.address || !parsed.chainId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function disconnectWallet() {
  if (typeof window === 'undefined') return;
  const eth = detectProvider();
  if (eth?.request) {
    try {
      await eth.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
    } catch {
      // some wallets don't support revoke — localStorage clear is enough
    }
  }
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent('onchainscout:wallet', { detail: null }));
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
