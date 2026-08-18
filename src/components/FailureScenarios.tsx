import type { FailureScenario } from '@/lib/investigation/types';

export function FailureScenarios({ scenarios }: { scenarios: FailureScenario[] }) {
  if (scenarios.length === 0) return null;

  return (
    <section className="rounded-xl border border-signal-caution/40 bg-amber-950/15 p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-signal-caution">
        What could go wrong
      </p>
      <p className="mt-1 text-base font-semibold text-ink-50">
        Plain-English failure scenarios, derived from what we found.
      </p>

      <ol className="mt-4 space-y-4">
        {scenarios.map((s, i) => (
          <li
            key={i}
            className="rounded-lg border border-ink-500/40 bg-bg-900/60 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-signal-caution/20 text-[10px] font-medium text-signal-caution">
                {i + 1}
              </span>
              <div className="min-w-0 grow">
                <h3 className="text-sm font-medium text-ink-50">{s.title}</h3>
                <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-200">
                  {s.steps.map((step, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="shrink-0 text-ink-500">{j + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 flex items-center gap-2 border-t border-ink-500/30 pt-2 text-[11px] text-ink-300">
                  <span className="font-medium uppercase tracking-[0.14em] text-ink-200">Why:</span>
                  <span>{s.why}</span>
                </p>
                {s.worstIdentifiableLoss && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-signal-stop/15 px-2 py-1 text-[11px] text-signal-stop">
                    <span className="font-medium uppercase tracking-wider">Identifiable loss:</span>
                    <span className="font-mono">{s.worstIdentifiableLoss}</span>
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
