'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { WalletChip } from './WalletChip';

interface TopBarProps {
  onMenuClick?: () => void;
}

const PAGE_META: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  '/': { eyebrow: 'Module · Investigation', title: 'Investigate', subtitle: 'Pick an on-chain object or paste a URL.' },
  '/analyze': { eyebrow: 'Module · Investigation', title: 'Contract investigation', subtitle: "Live trace of the agent's decision loop." },
  '/analyze-url': { eyebrow: 'Module · Claim verification', title: 'Project claim verification', subtitle: 'Marketing claims cross-checked against on-chain evidence.' },
  '/report-card': { eyebrow: 'Module · Self-evaluation', title: 'Honest Report Card', subtitle: 'How well does OnchainScout perform on a labeled corpus?' },
};

function pageMeta(pathname: string) {
  if (pathname?.startsWith('/analyze?') || pathname?.startsWith('/analyze/')) return PAGE_META['/analyze'];
  if (pathname?.startsWith('/analyze-url')) return PAGE_META['/analyze-url'];
  if (pathname?.startsWith('/report-card')) return PAGE_META['/report-card'];
  return PAGE_META['/'];
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const meta = pageMeta(pathname || '/');
  const [now, setNow] = useState<string>('');
  const [block, setBlock] = useState<string>('—');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.toUTCString().slice(17, 25) + ' UTC');
    };
    tick();
    const i = setInterval(tick, 30_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const eta = Math.floor(Date.now() / 12_000);
    setBlock(`#${eta.toLocaleString()}`);
    const i = setInterval(() => {
      const next = Math.floor(Date.now() / 12_000);
      setBlock(`#${next.toLocaleString()}`);
    }, 60_000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-500/40 bg-bg-900/85 backdrop-blur-md">
      <button
        type="button"
        onClick={onMenuClick}
        className="focus-ring -ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-200 hover:bg-bg-700/60 lg:hidden"
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
        </svg>
      </button>

      <nav className="flex min-w-0 grow items-center gap-2 px-2 lg:px-4">
        <div className="hidden md:block">
          <span className="mr-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
            {meta.eyebrow}
          </span>
        </div>
        <h1 className="truncate text-sm font-medium text-ink-50">
          {meta.title}
          <span className="ml-2 hidden font-normal text-ink-300 lg:inline">· {meta.subtitle}</span>
        </h1>
      </nav>

      <div className="hidden items-center gap-2 lg:flex">
        <Pill icon="clock" label={now || '—'} />
        <Pill icon="block" label={block} status="live" />
      </div>

      <div className="ml-auto flex items-center gap-2 px-2 lg:px-3">
        <Link
          href="/report-card"
          className="focus-ring hidden rounded-md border border-ink-500/60 bg-bg-800 px-3 py-1.5 text-xs font-medium text-ink-100 hover:bg-bg-700 sm:inline-flex"
        >
          Report Card
        </Link>
        <WalletChip />
      </div>
    </header>
  );
}

function Pill({ icon, label, status }: { icon: 'clock' | 'block'; label: string; status?: 'live' | 'off' }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-ink-500/40 bg-bg-800 px-2.5 py-1 text-[11px] text-ink-200">
      {icon === 'clock' ? (
        <svg viewBox="0 0 14 14" className="h-3 w-3 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M7 4v3.2L8.6 8.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" className="h-3 w-3 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M2 5c2-2 8-2 10 0M3.5 7c1.3-1.3 5.7-1.3 7 0M5 9c.7-.7 4.3-.7 5 0M7 11l1-1" strokeLinecap="round" />
        </svg>
      )}
      <span className="font-mono">{label}</span>
      {status === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-signal-go animate-pulse-dot" />}
    </div>
  );
}
