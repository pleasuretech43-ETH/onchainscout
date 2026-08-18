'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CHAIN_HEX,
  CHAIN_NAME,
  WalletState,
  connectWallet,
  detectProvider,
  disconnectWallet,
  readWallet,
  shortAddress,
  walletInstalled,
} from '@/lib/wallet';

const PROVIDER_LABEL: Record<WalletState['provider'], string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  rabby: 'Rabby',
  brave: 'Brave Wallet',
  generic: 'Browser wallet',
};

export function WalletChip() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
    setInstalled(walletInstalled());
    setWallet(readWallet());

    const onWallet = (e: Event) => {
      const detail = (e as CustomEvent<WalletState | null>).detail;
      setWallet(detail);
    };
    window.addEventListener('onchainscout:wallet', onWallet);

    const eth = detectProvider();
    if (eth?.on) {
      const accountsChanged = () => setWallet(readWallet());
      const chainChanged = () => setWallet(readWallet());
      eth.on('accountsChanged', accountsChanged);
      eth.on('chainChanged', chainChanged);
    }

    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClickOutside);

    const fetchPrice = async () => {
      try {
        const r = await fetch('https://coins.llama.fi/prices/current/coingecko:ethereum', {
          cache: 'no-store',
        });
        const j = (await r.json()) as { coins?: Record<string, { price?: number }> };
        const p = j.coins?.['coingecko:ethereum']?.price;
        if (typeof p === 'number') setEthPrice(p);
      } catch {
        // ignore
      }
    };
    fetchPrice();
    const i = setInterval(fetchPrice, 60_000);

    return () => {
      window.removeEventListener('onchainscout:wallet', onWallet);
      document.removeEventListener('click', onClickOutside);
      clearInterval(i);
    };
  }, []);

  async function onConnect() {
    setError(null);
    setConnecting(true);
    try {
      await connectWallet();
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  }

  async function onDisconnect() {
    await disconnectWallet();
    setOpen(false);
  }

  if (!wallet) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink-500/60 bg-bg-800 px-3 py-1.5 text-xs font-medium text-ink-100 hover:bg-bg-700"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 7h12" />
            <circle cx="11" cy="10.5" r="0.8" fill="currentColor" />
          </svg>
          {connecting ? 'Connecting…' : 'Connect wallet'}
        </button>
        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-ink-500/50 bg-bg-800 p-3 shadow-soft">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
              Connect a wallet
            </p>
            {!installed ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-ink-200">No EIP-1193 wallet detected in this browser.</p>
                <div className="flex flex-col gap-1.5">
                  <a target="_blank" rel="noreferrer" href="https://metamask.io/download/" className="rounded border border-ink-500/50 px-2.5 py-1.5 text-xs text-ink-100 hover:bg-bg-700">Install MetaMask ↗</a>
                  <a target="_blank" rel="noreferrer" href="https://www.coinbase.com/wallet/downloads" className="rounded border border-ink-500/50 px-2.5 py-1.5 text-xs text-ink-100 hover:bg-bg-700">Install Coinbase Wallet ↗</a>
                  <a target="_blank" rel="noreferrer" href="https://rabby.io/" className="rounded border border-ink-500/50 px-2.5 py-1.5 text-xs text-ink-100 hover:bg-bg-700">Install Rabby ↗</a>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button
                  onClick={onConnect}
                  disabled={connecting}
                  className="focus-ring w-full rounded-md bg-accent-500/15 px-3 py-2 text-xs font-medium text-accent-400 ring-1 ring-inset ring-accent-500/30 hover:bg-accent-500/25 disabled:opacity-50"
                >
                  {connecting ? 'Awaiting wallet…' : 'Connect browser wallet'}
                </button>
                <p className="text-[11px] text-ink-300">
                  OnchainScout will request an account read. No transaction will be signed.
                </p>
                {ethPrice !== null && (
                  <p className="text-[11px] text-ink-300">
                    ETH <span className="font-mono text-ink-100">${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </p>
                )}
              </div>
            )}
            {error && (
              <p className="mt-2 rounded border border-signal-stop/40 bg-signal-stop/10 px-2 py-1.5 text-[11px] text-signal-stop">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const chainLabel = CHAIN_NAME[wallet.chainId] ?? `Chain ${wallet.chainId}`;
  const chainColor = CHAIN_HEX[wallet.chainId] ?? '#71717a';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink-500/60 bg-bg-800 px-3 py-1.5 text-xs font-medium text-ink-100 hover:bg-bg-700"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: chainColor, boxShadow: `0 0 8px ${chainColor}40` }}
        />
        <span className="font-mono">{shortAddress(wallet.address)}</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-300">{chainLabel}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-ink-500/50 bg-bg-800 p-3 shadow-soft">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
            Connected · {PROVIDER_LABEL[wallet.provider]}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-ink-100">{wallet.address}</p>
          <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-ink-300">Chain</span>
            <span className="rounded bg-bg-900 px-1.5 py-0.5 text-ink-100">{chainLabel} · #{wallet.chainId}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(wallet.address);
              setOpen(false);
            }}
            className="focus-ring mt-3 w-full rounded-md border border-ink-500/50 px-3 py-1.5 text-xs text-ink-100 hover:bg-bg-700"
          >
            Copy address
          </button>
          <button
            onClick={onDisconnect}
            className="focus-ring mt-2 w-full rounded-md border border-signal-stop/40 bg-signal-stop/10 px-3 py-1.5 text-xs text-signal-stop hover:bg-signal-stop/20"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
