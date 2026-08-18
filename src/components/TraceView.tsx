import type { TraceStep } from '@/lib/investigation/types';

const DECISION_COLOR: Record<string, string> = {
  run: 'text-accent-400',
  skip: 'text-ink-500',
  'investigate-further': 'text-signal-caution',
};

const DECISION_LABEL: Record<string, string> = {
  run: 'RUN',
  skip: 'SKIP',
  'investigate-further': 'INVESTIGATE',
};

export function TraceView({ trace }: { trace: TraceStep[] }) {
  if (trace.length === 0) {
    return <p className="text-sm text-ink-300">No trace steps recorded.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-500/40 bg-bg-800/40">
      <div className="flex items-center justify-between border-b border-ink-500/40 bg-bg-800 px-4 py-2 text-[11px] text-ink-300">
        <span className="font-mono">{trace.length} steps</span>
        <span className="font-mono">{new Date(trace[trace.length - 1].at).toLocaleTimeString()} → {new Date(trace[0].at).toLocaleTimeString()}</span>
      </div>
      <ol className="divide-y divide-ink-500/30 font-mono text-xs">
        {trace.map((t) => (
          <li key={t.step} className="flex items-start gap-3 px-4 py-2.5 hover:bg-bg-700/40">
            <span className="shrink-0 text-ink-500">#{String(t.step).padStart(2, '0')}</span>
            <span className="shrink-0 text-ink-400">{new Date(t.at).toLocaleTimeString()}</span>
            <span className="shrink-0 text-ink-200">{t.checkId}</span>
            <span className={`shrink-0 ${DECISION_COLOR[t.decision]}`}>{DECISION_LABEL[t.decision]}</span>
            <span className="grow text-ink-300">{t.reasoning}</span>
            {t.outcome && <span className="shrink-0 text-ink-400">→ {t.outcome}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
