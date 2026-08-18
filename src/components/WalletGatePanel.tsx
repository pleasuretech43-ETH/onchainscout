'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/useWallet';
import { shortAddress } from '@/lib/wallet';

export function WalletGatePanel() {
  const { wallet, installed, hydrated, callState, error, connect } = useWallet();
  const connecting = callState === 'connecting';
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!wallet) {
      // no point fetching price while disconnected
      setEthPrice(null);
      return;
    }
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
  }, [wallet]);

  if (wallet) {
    return (
      <div className="card-hover rounded-xl border border-signal-go/40 bg-emerald-950/15 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-signal-go">
            Connected · personalized mode on
          </p>
          {ethPrice !== null && (
            <p className="font-mono text-[10px] text-ink-300">
              ETH ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
        <p className="mt-2 text-base font-semibold text-ink-50">
          Investigations auto-run blast-radius against{' '}
          <code className="font-mono text-accent-400">{shortAddress(wallet.address)}</code>.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-300">
          Every contract or URL you investigate now shows your exposure to it (live allowances,
          balance, USD price) without the extra click.
        </p>
        <Link
          href={`/analyze?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum`}
          className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-md border border-signal-go/40 bg-bg-800 px-3 py-1.5 text-xs font-medium text-signal-go hover:bg-emerald-950/30"
        >
          Try a personalized investigation →
        </Link>
      </div>
    );
  }

  const showInstallLinks = hydrated && !installed;

  return (
    <div className="card-hover rounded-xl border border-accent-500/30 bg-accent-500/5 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">
        Connect your wallet
      </p>
      <p className="mt-2 text-base font-semibold text-ink-50">
        Personalize every investigation.
      </p>
      <ul className="mt-3 space-y-2 text-xs text-ink-300">
        <li className="flex gap-2">
          <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-500" />
          <span>
            <strong className="font-medium text-ink-100">Auto blast-radius</strong> against every contract you investigate.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-500" />
          <span>
            <strong className="font-medium text-ink-100">Personalized scenarios</strong> against your positions, not the protocol&apos;s worst case.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-500" />
          <span>
            <strong className="font-medium text-ink-100">Coming next sprint:</strong> in-app approve / revoke + tx-decoder before you sign.
          </span>
        </li>
      </ul>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {showInstallLinks ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-bg-900 hover:bg-accent-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-bg-900 animate-pulse-dot" />
              Install MetaMask
            </a>
            <div className="flex gap-2">
              <a
                href="https://www.coinbase.com/wallet/downloads"
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center rounded-md border border-ink-500/60 bg-bg-800 px-3 py-2 text-xs font-medium text-ink-100 hover:bg-bg-700"
              >
                Coinbase ↗
              </a>
              <a
                href="https://rabby.io/"
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center rounded-md border border-ink-500/60 bg-bg-800 px-3 py-2 text-xs font-medium text-ink-100 hover:bg-bg-700"
              >
                Rabby ↗
              </a>
            </div>
          </div>
        ) : !hydrated ? (
          <button
            disabled
            className="focus-ring inline-flex items-center justify-center rounded-md bg-accent-500/40 px-4 py-2 text-sm font-medium text-bg-900 opacity-60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-bg-900" />
            Loading wallet…
          </button>
        ) : (
          <button
            onClick={() => connect()}
            disabled={connecting}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-bg-900 hover:bg-accent-400 disabled:opacity-50"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-bg-900 animate-pulse-dot" />
            {connecting ? 'Awaiting wallet…' : 'Connect wallet'}
          </button>
        )}
        <Link
          href="/report-card"
          className="focus-ring inline-flex items-center justify-center rounded-md border border-ink-500/40 px-4 py-2 text-xs font-medium text-ink-300 hover:bg-bg-700"
        >
          Or browse the report card
        </Link>
      </div>

      {error && (
        <p className="mt-3 rounded border border-signal-stop/40 bg-signal-stop/10 px-2 py-1.5 text-[11px] text-signal-stop">
          {error}
        </p>
      )}
      <p className="mt-3 text-[10px] text-ink-400">
        OnchainScout reads your address only — no transaction is ever signed.
      </p>
    </div>
  );
}
