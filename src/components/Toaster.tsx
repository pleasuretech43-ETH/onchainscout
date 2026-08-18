'use client';

import { useEffect, useState } from 'react';

type Toast = { id: number; title: string; body?: string; tone: 'go' | 'caution' | 'stop' | 'info' };

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Expose a global toaster the rest of the app can call.
    const w = window as unknown as { onchainscoutToast?: (t: Omit<Toast, 'id'>) => void };
    w.onchainscoutToast = (t) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
    };
    return () => {
      w.onchainscoutToast = undefined;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-slide-in-right rounded-md border bg-bg-700/95 px-4 py-3 shadow-soft backdrop-blur-md ${
            t.tone === 'go'
              ? 'border-signal-go/40'
              : t.tone === 'caution'
              ? 'border-signal-caution/40'
              : t.tone === 'stop'
              ? 'border-signal-stop/40'
              : 'border-accent-500/30'
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink-300">OnchainScout</p>
          <p className="text-sm text-ink-50">{t.title}</p>
          {t.body && <p className="mt-0.5 text-xs text-ink-300">{t.body}</p>}
        </div>
      ))}
    </div>
  );
}
