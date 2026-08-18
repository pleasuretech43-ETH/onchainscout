'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CHAINS } from '@/lib/chains';
import type { InvestigationResult } from '@/lib/investigation/types';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { CheckCard } from '@/components/CheckCard';
import { TraceView } from '@/components/TraceView';
import { BlastRadiusView } from '@/components/BlastRadiusView';
import { FailureScenarios } from '@/components/FailureScenarios';
import { useWallet } from '@/lib/useWallet';

export function AnalyzeClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const address = sp.get('address') || '';
  const chain = (sp.get('chain') || 'ethereum') as keyof typeof CHAINS;
  const initialWallet = sp.get('wallet') || '';

  const { wallet, hydrated } = useWallet();
  const [walletInput, setWalletInput] = useState(initialWallet);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userSubmittedWallet = useRef(false);

  // Auto-fill wallet field when wallet connects
  useEffect(() => {
    if (wallet && !walletInput && !userSubmittedWallet.current) {
      setWalletInput(wallet.address);
    }
  }, [wallet, walletInput]);

  async function runInvestigation(walletParam?: string) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Invalid address in URL.');
      setState('error');
      return;
    }
    setState('loading');
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, chain, wallet: walletParam || undefined }),
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

  useEffect(() => {
    runInvestigation();
    // We intentionally do NOT include runInvestigation in deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chain]);

  useEffect(() => {
    if (state !== 'done' || !wallet) return;
    const shouldReRun =
      wallet &&
      result &&
      (!result.blastRadius || result.blastRadius.wallet.toLowerCase() !== wallet.address.toLowerCase());
    if (shouldReRun) {
      runInvestigation(wallet.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.address, state]);

  function runWithWallet() {
    userSubmittedWallet.current = true;
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletInput)) {
      setError('Wallet must be 0x… (40 hex chars).');
      return;
    }
    setError(null);
    runInvestigation(walletInput);
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/')}
        className="text-sm text-ink-400 underline hover:text-ink-200"
      >
        ← Investigate another address
      </button>

      <header className="rounded-xl border border-ink-500/40 bg-bg-800/60 p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">Investigation</p>
        <h1 className="mt-2 break-all font-mono text-xl text-ink-50">{address}</h1>
        <p className="mt-1 text-sm text-ink-400">on {CHAINS[chain]?.name ?? chain}</p>

        <div className="mt-4 border-t border-ink-500/30 pt-4">
          {wallet ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-accent-500/30 bg-accent-500/5 px-3 py-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                <span className="font-mono text-xs text-accent-400">{wallet.address}</span>
              </div>
              <span className="text-[11px] text-ink-300">
                blast-radius auto-runs against this connected wallet
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-1 items-center gap-2 sm:flex-row">
                <input
                  placeholder="0x… (your wallet, for blast-radius)"
                  value={walletInput}
                  onChange={(e) => {
                    setWalletInput(e.target.value);
                    userSubmittedWallet.current = false;
                  }}
                  className="flex-1 rounded-md border border-ink-500/60 bg-bg-900 px-3 py-2 font-mono text-xs text-ink-50 placeholder:text-ink-400 focus:border-accent-500"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={runWithWallet}
                  disabled={state === 'loading'}
                  className="focus-ring rounded-md bg-accent-500/15 px-4 py-2 text-xs font-medium text-accent-400 ring-1 ring-inset ring-accent-500/30 hover:bg-accent-500/25 disabled:opacity-50"
                >
                  {state === 'loading' ? 'Computing…' : 'Compute blast-radius'}
                </button>
              </div>
              {hydrated && !wallet && (
                <p className="text-[11px] text-ink-400">
                  Tip: connect your wallet in the top bar to auto-fill this field and run blast-radius on every investigation.
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      {state === 'loading' && (
        <p className="rounded-lg border border-ink-500/40 bg-bg-800/40 p-6 text-ink-300">
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

          {result.blastRadius && <BlastRadiusView data={result.blastRadius} />}

          <section>
            <h2 className="mb-3 flex items-baseline justify-between text-lg font-semibold">
              <span>Risk dimensions</span>
              <span className="text-[11px] font-normal uppercase tracking-[0.18em] text-ink-300">
                {result.riskDimensions.length} dimension{result.riskDimensions.length === 1 ? '' : 's'}
              </span>
            </h2>
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

          {result.scenarios && result.scenarios.length > 0 && (
            <section>
              <FailureScenarios scenarios={result.scenarios} />
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Decision trace</h2>
            <TraceView trace={result.trace} />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Underlying evidence</h2>
            <div className="space-y-3">
              {result.checks.map((c) => (
                <details key={c.id} className="rounded-lg border border-ink-500/40 bg-bg-800/40 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-ink-100">
                    <span className={`signal-dot ${c.status}`} />
                    {c.label}
                  </summary>
                  <p className="mt-3 text-sm text-ink-300">{c.summary}</p>
                  <p className="mt-2 rounded-md border border-ink-500/30 bg-bg-900 px-2 py-1.5 text-xs text-ink-300">
                    <strong className="text-ink-200">Why:</strong> {c.why || 'See evidence.'}
                  </p>
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
                      <li key={i} className="rounded border border-ink-500/30 bg-bg-900 p-3 text-xs">
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
                        <pre className="mt-1 overflow-x-auto rounded bg-bg-800 p-2 text-[11px] text-ink-300">
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
              <h2 className="mb-4 text-lg font-semibold text-signal-caution">Investigator notes</h2>
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
