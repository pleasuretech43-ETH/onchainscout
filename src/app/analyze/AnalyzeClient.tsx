'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CHAINS } from '@/lib/chains';
import type { InvestigationResult } from '@/lib/investigation/types';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { CheckCard } from '@/components/CheckCard';
import { TraceView } from '@/components/TraceView';
import { BlastRadiusView } from '@/components/BlastRadiusView';

export function AnalyzeClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const address = sp.get('address') || '';
  const chain = (sp.get('chain') || 'ethereum') as keyof typeof CHAINS;
  const initialWallet = sp.get('wallet') || '';

  const [wallet, setWallet] = useState(initialWallet);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Invalid address in URL.');
      setState('error');
      return;
    }
    setState('loading');
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, chain, wallet: wallet || undefined }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json()) as { error?: string };
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return (await r.json()) as InvestigationResult;
      })
      .then((j) => {
        setResult(j);
        setState('done');
      })
      .catch((e) => {
        setError((e as Error).message);
        setState('error');
      });
    // We intentionally only re-fetch when address/chain change; wallet has its own button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chain]);

  function runBlastRadius() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Wallet must be 0x… (40 hex chars).');
      return;
    }
    setState('loading');
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, chain, wallet }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json()) as { error?: string };
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return (await r.json()) as InvestigationResult;
      })
      .then((j) => {
        setResult(j);
        setState('done');
        setError(null);
      })
      .catch((e) => {
        setError((e as Error).message);
        setState('error');
      });
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/')}
        className="text-sm text-ink-400 underline hover:text-ink-200"
      >
        ← Investigate another address
      </button>

      <header className="rounded-xl border border-ink-700 bg-ink-800/60 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-400">Investigation</p>
        <h1 className="mt-2 break-all font-mono text-xl text-ink-50">{address}</h1>
        <p className="mt-1 text-sm text-ink-400">on {CHAINS[chain]?.name ?? chain}</p>

        <div className="mt-4 border-t border-ink-700 pt-4">
          <label className="block text-xs uppercase tracking-wider text-ink-400">
            Optional: your wallet (for blast-radius)
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              placeholder="0x… (your wallet)"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-xs text-ink-50 outline-none focus:border-accent-500"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={runBlastRadius}
              disabled={state === 'loading'}
              className="rounded-lg bg-accent-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-600 disabled:opacity-50"
            >
              {state === 'loading' ? 'Computing…' : 'Compute blast-radius'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-500">
            Computes how much of this wallet could be lost if the contract were malicious. Wallet is sent to the API for this single request only — not stored.
          </p>
        </div>
      </header>

      {state === 'loading' && (
        <p className="rounded-lg border border-ink-700 bg-ink-800/40 p-6 text-ink-300">
          Investigating…
        </p>
      )}

      {state === 'error' && (
        <p className="rounded-lg border border-signal-stop bg-ink-800/40 p-6 text-signal-stop">
          {error}
        </p>
      )}

      {state === 'done' && result && (
        <>
          <RecommendationBanner result={result} />

          {result.blastRadius && (
            <BlastRadiusView data={result.blastRadius} />
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Risk dimensions</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.riskDimensions.map((d) => (
                <CheckCard key={d.name} dimension={d} />
              ))}
              {result.riskDimensions.length === 0 && (
                <p className="text-sm text-ink-400">
                  {result.insufficientEvidence
                    ? 'INSUFFICIENT EVIDENCE — could not produce structured findings for this input.'
                    : 'No checks ran.'}
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Plain-English verdict</h2>
            <div className="whitespace-pre-wrap rounded-xl border border-ink-700 bg-ink-800/60 p-6 text-ink-200">
              {result.narrative}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Decision trace</h2>
            <TraceView trace={result.trace} />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Underlying evidence</h2>
            <div className="space-y-3">
              {result.checks.map((c) => (
                <details key={c.id} className="rounded-lg border border-ink-700 bg-ink-800/40 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-ink-100">
                    <span className={`signal-dot ${c.status}`} />
                    {c.label}
                  </summary>
                  <p className="mt-3 text-sm text-ink-300">{c.summary}</p>
                  {c.signals.length > 0 && (
                    <p className="mt-2 text-xs text-ink-400">
                      Signals:{' '}
                      {c.signals.map((s) => (
                        <code
                          key={s}
                          className="mr-1 rounded bg-ink-900 px-1.5 py-0.5"
                        >
                          {s}
                        </code>
                      ))}
                    </p>
                  )}
                  <ul className="mt-3 space-y-2">
                    {c.evidence.map((e, i) => (
                      <li key={i} className="rounded border border-ink-700 bg-ink-900 p-3 text-xs">
                        <p className="text-ink-300">
                          <span className="text-ink-400">Source:</span> {e.source}
                        </p>
                        {e.url && (
                          <p>
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent-400 underline"
                            >
                              {e.url}
                            </a>
                          </p>
                        )}
                        <pre className="mt-1 overflow-x-auto rounded bg-ink-800 p-2 text-[11px] text-ink-300">
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {result.errors.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-signal-caution">
                Investigator notes
              </h2>
              <ul className="space-y-1 text-sm text-ink-300">
                {result.errors.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
