'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listChains } from '@/lib/chains';
import { recordInvestigation } from '@/lib/recent';

const SUGGESTIONS = [
  { kind: 'contract' as const, label: 'WETH (ETH)', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum' },
  { kind: 'contract' as const, label: 'USDC (ETH)', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'ethereum' },
  { kind: 'contract' as const, label: 'Honeypot 2', address: '0x80e4f014c98320eab524ae16b0aaf1603f4dc01d', chain: 'ethereum' },
  { kind: 'url' as const, label: 'aave.com', url: 'https://aave.com' },
  { kind: 'url' as const, label: 'uniswap.org', url: 'https://uniswap.org' },
];

export function InputForm() {
  const chains = listChains();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [chain, setChain] = useState<string>(chains[0]?.id ?? 'ethereum');
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(JSON.parse(localStorage.getItem('onchainscout:recent') || '[]'));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      };
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        (inputRef.current?.form as HTMLFormElement | null)?.requestSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      inputRef.current?.focus();
      return;
    }
    const params = new URLSearchParams();
    if (route === 'address') {
      params.set('address', input.trim());
      params.set('chain', chain);
      recordInvestigation({ kind: 'contract', value: input.trim(), chain });
      startTransition(() => router.push(`/analyze?${params.toString()}`));
    } else {
      params.set('url', input.trim());
      recordInvestigation({ kind: 'url', value: input.trim() });
      startTransition(() => router.push(`/analyze-url?${params.toString()}`));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-accent-400">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M11 11l4 4" strokeLinecap="round" />
            </svg>
          </div>
          <input
            ref={inputRef}
            aria-label="Contract address or project URL"
            placeholder="Paste a 0x… contract address or an https:// project URL — press / to focus"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md border border-ink-500/60 bg-bg-800 py-3 pl-10 pr-12 font-mono text-sm text-ink-50 placeholder:text-ink-400 focus:border-accent-500"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 lg:inline-flex">/</kbd>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Chain"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="rounded-md border border-ink-500/60 bg-bg-800 px-3 py-3 text-sm text-ink-100 focus:border-accent-500"
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
            className="focus-ring relative inline-flex items-center justify-center overflow-hidden rounded-md bg-accent-500 px-5 text-sm font-medium text-bg-900 shadow-glow-accent hover:bg-accent-400 disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-shimmer opacity-0 hover:opacity-100" />
            {pending ? 'Loading…' : 'Investigate'}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-signal-stop/40 bg-signal-stop/10 px-3 py-2 text-xs text-signal-stop">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
          Sandboxes
        </span>
        {SUGGESTIONS.map((s) => {
          const apply = () => {
            if (s.kind === 'contract') {
              setInput(s.address);
              setChain(s.chain);
            } else {
              setInput(s.url);
            }
          };
          return (
            <button
              key={s.label}
              type="button"
              onClick={apply}
              className="focus-ring rounded-md border border-ink-500/40 bg-bg-700/60 px-2.5 py-1 text-xs text-ink-100 hover:border-accent-500/60 hover:text-accent-400"
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </form>
  );
}
