import { Suspense } from 'react';
import { AnalyzeClient } from './AnalyzeClient';

export default function AnalyzePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Suspense fallback={<p className="text-ink-300">Loading…</p>}>
        <AnalyzeClient />
      </Suspense>
    </main>
  );
}
