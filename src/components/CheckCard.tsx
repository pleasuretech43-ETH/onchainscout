'use client';

import type { RiskDimension } from '@/lib/investigation/types';
import { useState } from 'react';

const LEVEL_LABEL: Record<string, string> = {
  go: 'OK',
  caution: 'Caution',
  stop: 'Risk',
  unknown: 'Unknown',
};

const LEVEL_TONE: Record<string, string> = {
  go: 'border-signal-go bg-emerald-950/30',
  caution: 'border-signal-caution bg-amber-950/30',
  stop: 'border-signal-stop bg-rose-950/40',
  unknown: 'border-signal-unknown bg-slate-800',
};

export function CheckCard({ dimension }: { dimension: RiskDimension }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border ${LEVEL_TONE[dimension.level]} p-4`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-sm font-medium text-ink-100">{dimension.name}</p>
        <span className="flex items-center gap-2">
          <span className={`signal-dot ${dimension.level}`} />
          <span className="text-[10px] text-ink-500">{open ? '−' : '+ Why?'}</span>
        </span>
      </button>
      <p className="mt-1 text-xs uppercase tracking-wider text-ink-400">
        {LEVEL_LABEL[dimension.level]}
      </p>
      <p className="mt-2 text-sm text-ink-300">{dimension.detail}</p>
      {open && dimension.detail && (
        <p className="mt-3 border-t border-ink-700 pt-2 text-[11px] leading-relaxed text-ink-400">
          <strong>Why this verdict?</strong>{' '}
          {explain(dimension)}
        </p>
      )}
    </div>
  );
}

function explain(d: RiskDimension): string {
  switch (d.level) {
    case 'go':
      return 'No risk signals in this check. The evidence either confirms expected safe behavior or is missing benign attributes.';
    case 'caution':
      return 'At least one early-warning signal fired. This is not a verdict of guilt — it is a request to manually verify the next-hop (multisig? timelock? known owner?).';
    case 'stop':
    case 'unknown':
    default:
      return 'Risk findings exceeded the threshold for this check. Either the signal is unambiguous, or the data was unavailable and we refuse to guess — manual verification required.';
  }
}
