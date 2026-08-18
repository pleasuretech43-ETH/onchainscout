'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { listChains } from '@/lib/chains';

export function InputForm() {
  const chains = listChains();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [chain, setChain] = useState<string>(chains[0]?.id ?? 'ethereum');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function detectRoute(value: string): 'address' | 'url' | null {
    const trimmed = value.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return 'address';
    if (/^https?:\/\//i.test(trimmed)) return 'url';
    return null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const route = detectRoute(input);
    if (!route) {
      setError('Paste either a 0x… contract address or an https:// project URL.');
      return;
    }
    const params = new URLSearchParams();
    if (route === 'address') {
      params.set('address', input.trim());
      params.set('chain', chain);
      startTransition(() => router.push(`/analyze?${params.toString()}`));
    } else {
      params.set('url', input.trim());
      startTransition(() => router.push(`/analyze-url?${params.toString()}`));
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-ink-700 bg-ink-800/60 p-6 shadow-xl"
    >
      <div className="flex flex-col gap-4">
        <input
          aria-label="Contract address or project URL"
          placeholder="Paste a 0x… contract address OR an https:// project URL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="rounded-lg border border-ink-600 bg-ink-900 px-4 py-3 font-mono text-sm text-ink-50 outline-none focus:border-accent-500"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            aria-label="Chain (for addresses)"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-4 py-3 text-sm text-ink-50 outline-none focus:border-accent-500"
          >
            {chains.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-600 disabled:opacity-50"
          >
            {pending ? 'Loading…' : 'Investigate'}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-signal-stop">{error}</p>}
      <p className="mt-4 text-xs text-ink-400">
        <strong className="text-ink-300">Contracts:</strong>{' '}
        <button
          type="button"
          onClick={() => {
            setInput('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
            setChain('ethereum');
          }}
          className="underline"
        >
          Uniswap V2 Router (ETH)
        </button>
        {' · '}
        <button
          type="button"
          onClick={() => {
            setInput('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
            setChain('ethereum');
          }}
          className="underline"
        >
          WETH (ETH)
        </button>
        {' · '}
        <button
          type="button"
          onClick={() => {
            setInput('https://aave.com');
          }}
          className="underline"
        >
          aave.com (URL)
        </button>
        {' · '}
        <button
          type="button"
          onClick={() => {
            setInput('https://uniswap.org');
          }}
          className="underline"
        >
          uniswap.org (URL)
        </button>
      </p>
    </form>
  );
}
