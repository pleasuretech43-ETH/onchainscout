import { Suspense } from 'react';
import { ReportCardView } from './ReportCardView';

export default function ReportCardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Suspense fallback={<p className="text-ink-300">Loading…</p>}>
        <ReportCardView />
      </Suspense>
    </main>
  );
}
