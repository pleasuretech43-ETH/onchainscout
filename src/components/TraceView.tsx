import type { TraceStep } from '@/lib/investigation/types';
import { PHASES } from '@/lib/investigation/planner';
import { StatusDot } from './StatusDot';

const DECISION_COLOR: Record<string, string> = {
  run: 'text-accent-400',
  skip: 'text-ink-500',
  'investigate-further': 'text-signal-caution',
  plan: 'text-signal-go',
};

const DECISION_BG: Record<string, string> = {
  run: 'bg-accent-500/15 ring-accent-500/30',
  skip: 'bg-ink-500/10 ring-ink-500/30',
  'investigate-further': 'bg-signal-caution/15 ring-signal-caution/30',
  plan: 'bg-signal-go/15 ring-signal-go/30',
};

const PHASE_LABEL: Record<string, string> = {
  Discover: 'Discover',
  Understand: 'Understand',
  Investigate: 'Investigate',
  Verify: 'Verify',
  Assess: 'Assess',
  Synthesize: 'Synthesize',
};

export function TraceView({ trace }: { trace: TraceStep[] }) {
  if (trace.length === 0) {
    return <p className="text-sm text-ink-300">No trace steps recorded.</p>;
  }

  // Group by phase, preserving order
  const groups: Record<string, TraceStep[]> = {};
  PHASES.forEach((p) => (groups[p] = []));
  trace.forEach((t) => {
    const ph = (t.phase as string) ?? 'Discover';
    if (!groups[ph]) groups[ph] = [];
    groups[ph].push(t);
  });

  const times = trace.map((t) => new Date(t.at).getTime());
  const firstTs = times[0];
  const lastTs = times[times.length - 1];
  const duration = Math.max(1, lastTs - firstTs);

  return (
    <div className="overflow-hidden rounded-xl border border-ink-500/40 bg-bg-800/40">
      <div className="flex items-center justify-between border-b border-ink-500/40 bg-bg-800 px-4 py-2.5 text-[11px] text-ink-300">
        <span className="flex items-center gap-3">
          <span className="font-mono">{trace.length} steps</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-go animate-pulse-dot" />
            <span className="text-ink-200">agent reasoning</span>
          </span>
        </span>
        <span className="font-mono text-ink-400">{(duration / 1000).toFixed(1)}s</span>
      </div>

      <ol className="divide-y divide-ink-500/30">
        {PHASES.map((phase) => {
          const items = groups[phase];
          if (items.length === 0) return null;
          return (
            <li key={phase} className="border-ink-500/30 px-4 py-3 first:border-t-0">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
                <span className="text-accent-400">{PHASE_LABEL[phase]}</span>
                <span className="h-px flex-1 bg-ink-500/50" />
                <span className="font-mono">{items.length}</span>
              </div>
              <ul className="space-y-1.5 font-mono text-xs">
                {items.map((t) => {
                  const isStep = t.decision === 'run';
                  const isPlan = t.decision === 'plan';
                  return (
                    <li key={t.step + t.checkId} className="flex items-start gap-3">
                      <span className="shrink-0 text-ink-500">#{String(t.step).padStart(2, '0')}</span>
                      <span className="shrink-0 text-ink-400">{new Date(t.at).toLocaleTimeString()}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${DECISION_BG[t.decision] ?? ''} ${DECISION_COLOR[t.decision] ?? ''}`}
                      >
                        {t.decision}
                      </span>
                      <span className="shrink-0 text-ink-200">{t.checkId}</span>
                      <span className="grow text-ink-300">
                        {t.reasoning}
                        {t.outcome && <span className="block pl-0 text-ink-400">{/* indent on small screens */}</span>}
                      </span>
                      {t.outcome && <span className="shrink-0 text-ink-400">{t.outcome}</span>}
                      {isStep && <StatusDot status="live" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
