import type { BlastRadiusData } from '@/lib/investigation/types';

export function BlastRadiusView({ data }: { data: BlastRadiusData }) {
  return (
    <section className="rounded-xl border-2 border-signal-stop bg-rose-950/20 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-signal-stop">Blast-radius</p>
      <p className="mt-1 text-2xl font-semibold text-rose-100">
        Maximum identifiable exposure: ${data.maxIdentifiableExposureUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <p className="mt-2 text-sm text-ink-300">
        If this contract were malicious, this is how much of wallet{' '}
        <code className="font-mono text-ink-100">{data.wallet.slice(0, 10)}…</code> could be lost,
        based on live allowances and balances.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800/60 text-left text-xs uppercase tracking-wider text-ink-400">
            <tr>
              <th className="p-2">Token</th>
              <th className="p-2">Balance</th>
              <th className="p-2">Allowance to contract</th>
              <th className="p-2">Exposure USD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-ink-700">
              <td className="p-2 text-ink-100">{data.nativeSymbol} (native)</td>
              <td className="p-2 text-ink-300">{data.nativeBalance}</td>
              <td className="p-2 text-ink-500">—</td>
              <td className="p-2 text-ink-300">
                {data.nativeBalanceUsd !== null ? '$' + data.nativeBalanceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
              </td>
            </tr>
            {data.tokens.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-ink-500">No ERC20 holdings detected in the first 100 transfers.</td>
              </tr>
            ) : (
              data.tokens.map((t) => (
                <tr key={t.tokenAddress} className="border-t border-ink-700">
                  <td className="p-2 text-ink-100">
                    {t.symbol || '(unknown)'}
                    <span className="ml-1 font-mono text-[10px] text-ink-500">{t.tokenAddress.slice(0, 6)}…</span>
                  </td>
                  <td className="p-2 text-ink-300">{t.balance}</td>
                  <td className={`p-2 ${parseFloat(t.allowance) > 0 ? 'text-signal-caution' : 'text-ink-500'}`}>
                    {parseFloat(t.allowance) > 0 ? t.allowance : '0'}
                  </td>
                  <td className="p-2 text-ink-300">
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
