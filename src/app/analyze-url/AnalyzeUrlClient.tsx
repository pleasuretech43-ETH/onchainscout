'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { VerifiedClaim } from '@/lib/investigation/types';
import { RecommendationBanner } from '@/components/RecommendationBanner';

interface UrlResult {
  inputType: 'url';
  url: string;
  finalUrl: string;
  recommendation: 'go' | 'caution' | 'stop' | 'unknown';
  headline: string;
  narrative: string;
  claims: VerifiedClaim[];
  errors: string[];
  insufficientEvidence: boolean;
  text: string;
  llmEnabled: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  verified: 'text-signal-go',
  partial: 'text-signal-caution',
  unverified: 'text-signal-caution',
  contradicted: 'text-signal-stop',
  'insufficient-evidence': 'text-signal-unknown',
};

const SOURCE_COLOR: Record<string, string> = {
  llm: 'border-accent-400 text-accent-400',
  regex: 'border-ink-500 text-ink-400',
  DefiLlama: 'border-ink-600 text-ink-400',
  OnchainScout: 'border-ink-600 text-ink-400',
};

export function AnalyzeUrlClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const url = sp.get('url') || '';

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<UrlResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError('No URL provided.');
      setState('error');
      return;
    }
    setState('loading');
    fetch('/api/analyze-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json()) as { error?: string };
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return (await r.json()) as UrlResult;
      })
      .then((j) => {
        setResult(j);
        setState('done');
      })
      .catch((e) => {
        setError((e as Error).message);
        setState('error');
      });
  }, [url]);

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/')}
        className="text-sm text-ink-400 underline hover:text-ink-200"
      >
        ← Investigate something else
      </button>

      <header className="rounded-xl border border-ink-700 bg-ink-800/60 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-400">Claim verification</p>
        <h1 className="mt-2 break-all font-mono text-xl text-ink-50">{url}</h1>
        <p className="mt-1 text-sm text-ink-400">
          Cross-checking marketing claims against on-chain evidence
        </p>
      </header>

      {state === 'loading' && (
        <p className="rounded-lg border border-ink-700 bg-ink-800/40 p-6 text-ink-300">
          Fetching and verifying…
        </p>
      )}

      {state === 'error' && (
        <p className="rounded-lg border border-signal-stop bg-ink-800/40 p-6 text-signal-stop">
          {error}
        </p>
      )}

      {state === 'done' && result && (
        <>
          <RecommendationBanner
            result={
              {
                address: result.finalUrl,
                chain: 'ethereum',
                recommendation: result.recommendation,
                headline: result.headline,
              } as any
            }
          />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Claim verification table</h2>
              <span
                className={`rounded border px-2 py-0.5 text-xs ${
                  result.llmEnabled
                    ? 'border-accent-500 text-accent-400'
                    : 'border-ink-600 text-ink-400'
                }`}
                title="Without OPENAI_API_KEY or ANTHROPIC_API_KEY the agent uses regex-only extraction. With a key, the LLM extracts richer claims and merges with regex."
              >
                {result.llmEnabled ? 'LLM extraction enabled' : 'Regex-only (no LLM key)'}
              </span>
            </div>

            {!result.llmEnabled && (
              <p className="mb-3 rounded-lg border border-signal-caution/40 bg-amber-950/20 p-3 text-xs text-amber-100">
                <strong>Limited coverage:</strong> regex patterns catch the common forms
                (&ldquo;X users&rdquo;, &ldquo;$Y TVL&rdquo;, &ldquo;audited by Z&rdquo;) but miss marketing
                language like &ldquo;trusted by thousands&rdquo;. Add{' '}
                <code className="rounded bg-ink-900 px-1 py-0.5">OPENAI_API_KEY</code> to{' '}
                <code className="rounded bg-ink-900 px-1 py-0.5">.env.local</code> to enable LLM-based extraction.
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-800/80 text-left text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="p-3">Source · Claim</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">On-chain evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {result.claims.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-ink-400">
                        No verifiable marketing claims detected on this page.
                      </td>
                    </tr>
                  ) : (
                    result.claims.map((c, i) => (
                      <tr key={i} className="border-t border-ink-700 align-top">
                        <td className="p-3 text-ink-100">
                          {c.source && (
                            <span
                              className={`mr-2 inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                                SOURCE_COLOR[c.source] ?? SOURCE_COLOR.OnchainScout
                              }`}
                            >
                              {c.source}
                            </span>
                          )}
                          {c.claim}
                          <p className="mt-1 text-[11px] text-ink-500">"{c.rawText}"</p>
                        </td>
                        <td className="p-3 text-ink-400">{c.category}</td>
                        <td className={`p-3 font-medium ${STATUS_COLOR[c.status]}`}>
                          {c.status.toUpperCase()}
                        </td>
                        <td className="p-3 text-ink-300">
                          {c.onchainEvidence ?? '—'}
                          {c.sourceUrl && (
                            <>
                              {' · '}
                              <a
                                href={c.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent-400 underline"
                              >
                                source
                              </a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Plain-English verdict</h2>
            <div className="whitespace-pre-wrap rounded-xl border border-ink-700 bg-ink-800/60 p-6 text-ink-200">
              {result.narrative}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Page text (sampled)</h2>
            <details className="rounded-lg border border-ink-700 bg-ink-800/40 p-4 text-xs">
              <summary className="cursor-pointer text-ink-300">
                Click to expand the page text we analyzed ({result.text.length} chars)
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-ink-400">{result.text}</p>
            </details>
          </section>
        </>
      )}
    </div>
  );
}
