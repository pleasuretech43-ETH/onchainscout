'use client';

import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/lib/useWallet';
import { CHAIN_HEX, WalletState, shortAddress } from '@/lib/wallet';

const PROVIDER_LABEL: Record<WalletState['provider'], string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  rabby: 'Rabby',
  brave: 'Brave Wallet',
  generic: 'Browser wallet',
};

export function WalletChip() {
  const { wallet, installed, callState, error, connect, disconnect, chainName } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
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
      document.removeEventListener('click', onClickOutside);
      clearInterval(i);
    };
  }, []);

  async function onConnect() {
    try {
      await connect();
      setOpen(false);
    } catch {
      // error displayed via useWallet.error
    }
  }

  if (!wallet) {
    const isConnecting = callState === 'connecting';
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
          {isConnecting ? 'Awaiting…' : 'Connect wallet'}
        </button>
        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-ink-500/50 bg-bg-800 p-3 shadow-soft">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
              Connect a wallet
            </p>
            {!installed ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-ink-200">
                  No EIP-1193 wallet detected. Install one to enable auto blast-radius + personalized checks.
                </p>
                <div className="flex flex-col gap-1.5">
                  <a target="_blank" rel="noreferrer" href="https://metamask.io/download/" className="rounded border border-ink-500/50 px-2.5 py-1.5 text-xs text-ink-100 hover:bg-bg-700">
                    Install MetaMask ↗
                  </a>
                  <a target="_blank" rel="noreferrer" href="https://www.coinbase.com/wallet/downloads" className="rounded border border-ink-500/50 px-2.5 py-1.5 text-xs text-ink-100 hover:bg-bg-700">
                    Install Coinbase Wallet ↗
                  </a>
                  <a target="_blank" rel="noreferrer" href="https://rabby.io/" className="rounded border border-ink-500/50 px-2.5 py-1.5 text-xs text-ink-100 hover:bg-bg-700">
                    Install Rabby ↗
                  </a>
                </div>
                <p className="text-[11px] text-ink-400">
                  OnchainScout reads your address only. No transaction is signed and nothing is broadcast.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button
                  onClick={onConnect}
                  disabled={isConnecting}
                  className="focus-ring w-full rounded-md bg-accent-500/15 px-3 py-2 text-xs font-medium text-accent-400 ring-1 ring-inset ring-accent-500/30 hover:bg-accent-500/25 disabled:opacity-50"
                >
                  {isConnecting ? 'Awaiting wallet…' : 'Connect browser wallet'}
                </button>
                <p className="text-[11px] text-ink-300">
                  Read-only access. OnchainScout will request your address — no signing.
                </p>
                <div className="rounded-md border border-ink-500/40 bg-bg-900/70 p-2 text-[11px] text-ink-300">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink-200">
                    Once connected you get
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    <li>· auto blast-radius on every investigation</li>
                    <li>· wallet field pre-filled</li>
                    <li>· personalized scenarios against your positions</li>
                  </ul>
                </div>
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

  const label = chainName ?? `Chain ${wallet.chainId}`;
  const color = CHAIN_HEX[wallet.chainId] ?? '#71717a';

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
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
        />
        <span className="font-mono">{shortAddress(wallet.address)}</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-300">{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-ink-500/50 bg-bg-800 p-3 shadow-soft">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
            Connected · {PROVIDER_LABEL[wallet.provider]}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-ink-100">{wallet.address}</p>
          <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-ink-300">Chain</span>
            <span className="rounded bg-bg-900 px-1.5 py-0.5 text-ink-100">
              {label} · #{wallet.chainId}
            </span>
          </div>
          <div className="mt-3 rounded-md border border-accent-500/30 bg-accent-500/5 p-2 text-[11px]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-accent-400">
              Personalized mode
            </p>
            <p className="mt-1 text-ink-200">
              Investigations on this browser auto-run blast-radius against this wallet.
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(wallet.address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="focus-ring mt-3 w-full rounded-md border border-ink-500/50 px-3 py-1.5 text-xs text-ink-100 hover:bg-bg-700"
          >
            {copied ? 'Copied ✓' : 'Copy address'}
          </button>
          <button
            onClick={async () => {
              await disconnect();
              setOpen(false);
            }}
            className="focus-ring mt-2 w-full rounded-md border border-signal-stop/40 bg-signal-stop/10 px-3 py-1.5 text-xs text-signal-stop hover:bg-signal-stop/20"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
