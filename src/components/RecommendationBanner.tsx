import type { InvestigationResult } from '@/lib/investigation/types';

const COLORS: Record<string, string> = {
  go: 'border-signal-go/50 bg-emerald-950/30 text-emerald-100',
  caution: 'border-signal-caution/50 bg-amber-950/30 text-amber-100',
  stop: 'border-signal-stop/50 bg-rose-950/30 text-rose-100',
  unknown: 'border-ink-500/50 bg-bg-700/40 text-ink-100',
};

const VERDICT: Record<string, string> = {
  go: 'Proceed',
  caution: 'Proceed with caution',
  stop: "Don't proceed without verification",
  unknown: 'INSUFFICIENT EVIDENCE',
};

const VERDICT_ICON: Record<string, 'go' | 'caution' | 'stop' | 'unknown'> = {
  go: 'go',
  caution: 'caution',
  stop: 'stop',
  unknown: 'unknown',
};

export function RecommendationBanner({ result }: { result: InvestigationResult }) {
  const color = COLORS[result.recommendation];
  const verdict = VERDICT[result.recommendation];
  const icon = VERDICT_ICON[result.recommendation];

  return (
    <div className={`recommendation-glow overflow-hidden rounded-xl border ${color}`}>
      <div className="px-6 py-5">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
              icon === 'go'
                ? 'bg-emerald-500/20'
                : icon === 'caution'
                ? 'bg-amber-500/20'
                : icon === 'stop'
                ? 'bg-red-500/20'
                : 'bg-bg-700'
            }`}
          >
            <BannerIcon icon={icon} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">Verdict</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{verdict}</p>
            <p className="mt-1.5 text-sm opacity-90">{result.headline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerIcon({ icon }: { icon: 'go' | 'caution' | 'stop' | 'unknown' }) {
  const c = 'h-5 w-5';
  if (icon === 'go')
    return (
      <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2.5 8.5L6 12 13 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (icon === 'caution')
    return (
      <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 1l7 13H1z" strokeLinejoin="round" />
        <path d="M8 6v3.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
      </svg>
    );
  if (icon === 'stop')
    return (
      <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
