import { Suspense } from 'react';
import { AnalyzeUrlClient } from './AnalyzeUrlClient';

export default function AnalyzeUrlPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Suspense fallback={<p className="text-ink-300">Loading…</p>}>
        <AnalyzeUrlClient />
      </Suspense>
    </main>
  );
}
