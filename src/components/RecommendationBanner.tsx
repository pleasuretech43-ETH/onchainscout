import type { InvestigationResult } from '@/lib/investigation/types';

const COLORS: Record<string, string> = {
  go: 'border-signal-go bg-emerald-950/40 text-emerald-100',
  caution: 'border-signal-caution bg-amber-950/40 text-amber-100',
  stop: 'border-signal-stop bg-rose-950/40 text-rose-100',
  unknown: 'border-signal-unknown bg-slate-800 text-slate-200',
};

const VERDICT: Record<string, string> = {
  go: 'Proceed',
  caution: 'Proceed with caution',
  stop: "Don't proceed without verification",
  unknown: 'INSUFFICIENT EVIDENCE',
};

export function RecommendationBanner({ result }: { result: InvestigationResult }) {
  const color = COLORS[result.recommendation];
  const verdict = VERDICT[result.recommendation];
  return (
    <div className={`rounded-xl border-2 ${color} p-6`}>
      <p className="text-xs uppercase tracking-[0.2em]">Verdict</p>
      <p className="mt-1 text-2xl font-semibold">{verdict}</p>
      <p className="mt-3 text-sm opacity-90">{result.headline}</p>
    </div>
  );
}
