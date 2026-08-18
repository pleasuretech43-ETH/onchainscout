import type { BlastRadiusData } from '@/lib/investigation/types';

export function BlastRadiusView({ data }: { data: BlastRadiusData }) {
  return (
    <section className="rounded-xl border border-signal-stop/50 bg-rose-950/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-signal-stop">
            Blast-radius
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-rose-50">
            ${data.maxIdentifiableExposureUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="ml-2 text-sm font-normal text-ink-300">max identifiable exposure</span>
          </p>
          <p className="mt-2 text-sm text-ink-200">
            If this contract were malicious, this is how much of{' '}
            <code className="font-mono text-ink-100">{data.wallet.slice(0, 6)}…{data.wallet.slice(-4)}</code>{' '}
            could be lost, based on live allowances and balances.
          </p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-rose-500/20 text-signal-stop">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 3c-3 5-6 8-6 12a6 6 0 0012 0c0-4-3-7-6-12z" />
            <path d="M9 16c1 1 5 1 6 0" />
          </svg>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-ink-500/40">
        <table className="w-full text-sm">
          <thead className="bg-bg-900 text-left text-[10px] uppercase tracking-[0.14em] text-ink-300">
            <tr>
              <th className="p-2.5">Token</th>
              <th className="p-2.5">Balance</th>
              <th className="p-2.5">Allowance</th>
              <th className="p-2.5 text-right">Exposure USD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-ink-500/30">
              <td className="p-2.5 text-ink-50">{data.nativeSymbol} <span className="text-[10px] text-ink-300">native</span></td>
              <td className="p-2.5 font-mono text-ink-200">{data.nativeBalance}</td>
              <td className="p-2.5 text-ink-500">—</td>
              <td className="p-2.5 text-right font-mono text-ink-50">
                {data.nativeBalanceUsd !== null ? '$' + data.nativeBalanceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
              </td>
            </tr>
            {data.tokens.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-ink-400">No ERC-20 holdings detected in the first 100 transfers.</td>
              </tr>
            ) : (
              data.tokens.map((t) => (
                <tr key={t.tokenAddress} className="border-t border-ink-500/30">
                  <td className="p-2.5 text-ink-50">
                    {t.symbol || '(unknown)'}
                    <span className="ml-1 font-mono text-[10px] text-ink-400">{t.tokenAddress.slice(0, 6)}…</span>
                  </td>
                  <td className="p-2.5 font-mono text-ink-200">{t.balance}</td>
                  <td className={`p-2.5 font-mono ${parseFloat(t.allowance) > 0 ? 'text-signal-caution' : 'text-ink-500'}`}>
                    {parseFloat(t.allowance) > 0 ? t.allowance : '0'}
                  </td>
                  <td className="p-2.5 text-right font-mono text-ink-50">
                    {t.allowanceUsd !== null ? '$' + t.allowanceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.warnings.length > 0 && (
        <details className="mt-3 text-xs text-ink-400">
          <summary className="cursor-pointer">Warnings ({data.warnings.length})</summary>
          <ul className="mt-2 space-y-1">
            {data.warnings.map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
