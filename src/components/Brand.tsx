'use client';

import Link from 'next/link';

export function Brand({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="focus-ring flex items-center gap-2 rounded-md px-1 py-1 text-ink-50"
      aria-label="OnchainScout"
    >
      <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 text-bg-900">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1.5 8C3 4 6 2 8 2s5 2 6.5 6C13 12 10 14 8 14s-5-2-6.5-6z" />
          <circle cx="8" cy="8" r="2" />
          <path d="M8 0v3M8 13v3M0 8h3M13 8h3" strokeLinecap="round" />
        </svg>
        <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-accent-400/40" />
      </span>
      <span className="text-[14px] font-semibold tracking-tight">OnchainScout</span>
    </Link>
  );
}
