'use client';

import { useState } from 'react';
import type { RiskDimension } from '@/lib/investigation/types';

const LEVEL_LABEL: Record<string, string> = {
  go: 'OK',
  caution: 'Caution',
  stop: 'Risk',
  unknown: 'Unknown',
};

const LEVEL_TONE: Record<string, string> = {
  go: 'border-signal-go/40 bg-emerald-950/25',
  caution: 'border-signal-caution/40 bg-amber-950/25',
  stop: 'border-signal-stop/40 bg-rose-950/25',
  unknown: 'border-ink-500/40 bg-bg-700/30',
};

const LEVEL_EXPLAIN: Record<string, string> = {
  go: 'No risk signals in this check. The evidence either confirms expected safe behavior or is missing benign attributes.',
  caution:
    'At least one early-warning signal fired. This is not a verdict of guilt — it is a request to manually verify the next-hop (multisig? timelock? known owner?).',
  stop: 'Risk findings exceeded the threshold for this check. The signal is unambiguous; manual verification required.',
  unknown: 'Data was unavailable for this check. We refuse to guess — manual verification required.',
};

const CHECK_ICONS: Record<string, string> = {
  'Contract source verified': 'verified',
  'Proxy / upgradeability': 'shield',
  Ownership: 'owner',
  'Dangerous function surface': 'svp',
  'Contract age': 'clock',
  'Deployer history': 'deployer',
  'Honeypot / sellability probe': 'honeypot',
  'Liquidity depth': 'droplet',
  'Holder concentration': 'dots',
};

export function CheckCard({ dimension }: { dimension: RiskDimension }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`card-hover rounded-xl border ${LEVEL_TONE[dimension.level]} p-4`}>
      <div className="flex items-center gap-3">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
            dimension.level === 'go'
              ? 'bg-emerald-500/15 text-signal-go'
              : dimension.level === 'caution'
              ? 'bg-amber-500/15 text-signal-caution'
              : dimension.level === 'stop'
              ? 'bg-red-500/15 text-signal-stop'
              : 'bg-bg-700 text-ink-300'
          }`}
          aria-hidden
        >
          {icon(CHECK_ICONS[dimension.name] ?? 'unknown')}
        </span>
        <p className="grow text-sm font-medium text-ink-50">{dimension.name}</p>
        <span className="flex items-center gap-1.5">
          <span className={`signal-dot ${dimension.level}`} />
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-300">
            {LEVEL_LABEL[dimension.level]}
          </span>
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-200">{dimension.detail}</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="focus-ring mt-3 inline-flex items-center gap-1 text-[11px] text-ink-300 hover:text-ink-100"
      >
        <span>{open ? '−' : '+'}</span>
        <span>Why this verdict?</span>
      </button>
      {open && (
        <p className="mt-2 border-t border-ink-500/30 pt-2 text-[11px] leading-relaxed text-ink-300">
          {LEVEL_EXPLAIN[dimension.level] ?? LEVEL_EXPLAIN.unknown}
        </p>
      )}
    </div>
  );
}

function icon(name: string) {
  const c = 'h-3.5 w-3.5';
  switch (name) {
    case 'verified':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 8l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 1l6 3v4c0 4-2.6 6-6 7-3.4-1-6-3-6-7V4z" />
          <path d="M5.5 8l2 2 3.5-4" strokeLinecap="round" />
        </svg>
      );
    case 'owner':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round" />
        </svg>
      );
    case 'svp':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 2v8m-3-3l3 3 3-3" strokeLinecap="round" />
          <path d="M2 13h12" strokeLinecap="round" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4v4.2L10.6 8.6" strokeLinecap="round" />
        </svg>
      );
    case 'deployer':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 13c1-3 3-5 5-5s4 2 5 5" strokeLinecap="round" />
          <circle cx="8" cy="4.5" r="2.5" />
        </svg>
      );
    case 'honeypot':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 1l6 1 1 6c0 3-2 6-4.5 6S3 11 3 8l2-7z" strokeLinejoin="round" />
          <path d="M6 8l3 3 1-4" strokeLinecap="round" />
        </svg>
      );
    case 'droplet':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 1c-3 4-5 6-5 9a5 5 0 0010 0c0-3-2-5-5-9z" strokeLinejoin="round" />
        </svg>
      );
    case 'dots':
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="4" cy="4" r="1.2" /><circle cx="8" cy="4" r="1.2" /><circle cx="12" cy="4" r="1.2" />
          <circle cx="4" cy="8" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="12" cy="8" r="1.2" />
          <circle cx="4" cy="12" r="1.2" /><circle cx="8" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4v5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.8" fill="currentColor" />
        </svg>
      );
  }
}
