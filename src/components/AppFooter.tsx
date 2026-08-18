'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function AppFooter() {
  const [chainStats, setChainStats] = useState<{ height: string; baseFee: string; gas: string }>({
    height: '—',
    baseFee: '—',
    gas: '—',
  });

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const r = await fetch('https://ethereum-rpc.publicnode.com', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }),
          cache: 'no-store',
        });
        const j = (await r.json()) as { result?: string };
        if (!active) return;
        const wei = BigInt(j.result || '0x0');
        const gwei = Number(wei / 1000000000n);
        const blockInfo = await fetch('https://ethereum-rpc.publicnode.com', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
          cache: 'no-store',
        });
        const j2 = (await blockInfo.json()) as { result?: string };
        const blockNum = j2.result ? parseInt(j2.result, 16).toLocaleString() : '—';
        setChainStats({
          height: blockNum,
          baseFee: `${gwei} gwei`,
          gas: `${(gwei * 21_000 / 1e9).toFixed(4)} Ξ per transfer`,
        });
      } catch {
        // keep dashes
      }
    };
    fetchStats();
    const i = setInterval(fetchStats, 30_000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, []);

  return (
    <footer className="border-t border-ink-500/40 bg-bg-800/40">
      <div className="grid grid-cols-2 gap-6 px-6 py-6 text-xs sm:grid-cols-4 lg:grid-cols-5">
        <Stat label="Block" value={chainStats.height} hint="Ethereum mainnet" />
        <Stat label="Gas (avg)" value={chainStats.baseFee} hint="live RPC poll · 30s" />
        <Stat label="Transfer cost" value={chainStats.gas} hint="21000 gas · ETH" />
        <Stat label="Networks" value="6 EVMs" hint="Ethereum · Base · Arb · OP · Poly · BNB" />
        <Stat label="Investigation checks" value="9" hint="deterministic engine" />
      </div>
      <div className="flex flex-col gap-3 border-t border-ink-500/30 px-6 py-4 text-[11px] text-ink-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <span className="text-ink-200">OnchainScout</span> · 9 deterministic checks across 6 EVMs
        </span>
        <span className="flex items-center gap-3">
          <Link href="/" className="hover:text-ink-100">Home</Link>
          <span className="text-ink-500">·</span>
          <Link href="/report-card" className="hover:text-ink-100">Report card</Link>
          <span className="text-ink-500">·</span>
          <a href="https://etherscan.io/apis" target="_blank" rel="noreferrer" className="hover:text-ink-100">
            Get Etherscan key
          </a>
        </span>
      </div>
    </footer>
  );
}

function Stat({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: string;
  hint?: string;
  status?: 'live' | 'caution';
}) {
  const color = status === 'caution' ? 'text-signal-caution' : 'text-ink-50';
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-ink-300">{label}</p>
      <p className={`mt-1 truncate font-mono text-sm ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-[10px] text-ink-400">{hint}</p>}
    </div>
  );
}
