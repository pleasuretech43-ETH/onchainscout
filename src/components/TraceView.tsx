import type { TraceStep } from '@/lib/investigation/types';

const DECISION_COLOR: Record<string, string> = {
  run: 'text-accent-400',
  skip: 'text-ink-500',
  'investigate-further': 'text-signal-caution',
};

export function TraceView({ trace }: { trace: TraceStep[] }) {
  if (trace.length === 0) {
    return <p className="text-sm text-ink-400">No trace steps recorded.</p>;
  }
  return (
    <ol className="space-y-2 rounded-xl border border-ink-700 bg-ink-800/40 p-4 font-mono text-xs">
      {trace.map((t) => (
        <li key={t.step} className="flex gap-3">
          <span className="shrink-0 text-ink-500">#{t.step}</span>
          <span className="shrink-0 text-ink-400">{new Date(t.at).toLocaleTimeString()}</span>
          <span className="shrink-0 text-ink-200">{t.checkId}</span>
          <span className={`shrink-0 ${DECISION_COLOR[t.decision] ?? ''}`}>[{t.decision}]</span>
          <span className="grow text-ink-300">{t.reasoning}</span>
          {t.outcome && <span className="shrink-0 text-ink-400">— {t.outcome}</span>}
        </li>
      ))}
    </ol>
  );
}
