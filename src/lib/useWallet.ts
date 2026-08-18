'use client';

import { useEffect, useState } from 'react';
import {
  CHAIN_NAME,
  WalletState,
  connectWallet,
  disconnectWallet,
  readWallet,
  walletInstalled,
} from './wallet';

export type WalletCallState = 'idle' | 'connecting' | 'error';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [installed, setInstalled] = useState(false);
  const [callState, setCallState] = useState<WalletCallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInstalled(walletInstalled());
    setWallet(readWallet());
    setHydrated(true);

    const onWallet = (e: Event) => {
      const detail = (e as CustomEvent<WalletState | null>).detail;
      setWallet(detail);
    };
    window.addEventListener('onchainscout:wallet', onWallet);
    return () => window.removeEventListener('onchainscout:wallet', onWallet);
  }, []);

  async function connect() {
    setError(null);
    setCallState('connecting');
    try {
      await connectWallet();
      setCallState('idle');
    } catch (e) {
      setError((e as Error).message);
      setCallState('error');
      throw e;
    }
  }

  async function disconnect() {
    await disconnectWallet();
    setCallState('idle');
    setError(null);
  }

  return {
    wallet,
    installed,
    hydrated,
    callState,
    error,
    connect,
    disconnect,
    chainName: wallet ? (CHAIN_NAME[wallet.chainId] ?? `Chain ${wallet.chainId}`) : null,
  };
}
