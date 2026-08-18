'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listRecent, type RecentEntry } from '@/lib/recent';

export function RecentInvestigations() {
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setRecents(listRecent());
  }, []);

  return (
    <div className="card-hover rounded-xl border border-ink-500/40 bg-bg-800/40 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">
        Your investigations
      </p>
      <p className="mt-2 text-base font-semibold text-ink-50">Recent (this device)</p>
      {recents.length === 0 ? (
        <p className="mt-3 text-sm text-ink-300">
          Nothing here yet. Paste a contract or URL on the home page — your recent lookups will appear here.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {recents.map((r, i) => {
            const href =
              r.kind === 'contract'
                ? `/analyze?address=${r.value}&chain=${r.chain ?? 'ethereum'}`
                : `/analyze-url?url=${encodeURIComponent(r.value)}`;
            const label =
              r.kind === 'contract'
                ? `${r.value.slice(0, 6)}…${r.value.slice(-4)}`
                : r.value.replace(/^https?:\/\//, '').slice(0, 28);
            return (
              <li key={i} className="flex items-center gap-2 truncate">
                <span className="mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                <Link href={href} className="grow truncate font-mono text-xs text-ink-100 hover:text-accent-400">
                  {label}
                </Link>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-300">
                  {r.kind === 'contract' ? r.chain : 'url'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {recents.length > 0 && (
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('onchainscout:recent');
            setRecents([]);
          }}
          className="focus-ring mt-3 text-[10px] uppercase tracking-[0.18em] text-ink-300 hover:text-ink-100"
        >
          Clear
        </button>
      )}
    </div>
  );
}
