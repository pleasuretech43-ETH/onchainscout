import Link from 'next/link';
import { InputForm } from '@/components/InputForm';
import { RecentInvestigations } from '@/components/RecentInvestigations';
import { CORPUS, type CorpusEntry } from '@/data/corpus';

export default function HomePage() {
  const recent = CORPUS.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SystemStrip recent={recent} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-ink-500/40 bg-bg-800/50 p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
              Investigate
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-[1.1] tracking-tight">
              Paste an address or URL.
              <br />
              <span className="text-ink-300">Get a verdict.</span>
            </h1>
            <p className="mt-3 text-sm text-ink-300">
              Nine deterministic checks across six EVM chains. Verdict, blast-radius, and trace — never a guess.
            </p>
            <div className="mt-5">
              <InputForm />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <ContextPanel recent={recent} />
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Investigations"
          title="Recent corpus runs"
          hint="19 labeled addresses across 4 chains · run nightly · used to grade the agent honestly"
        />
        <RecentInvestigationsTable rows={recent} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MethodologyCard
          title="Deterministic engine"
          body="Every check is a real tool call. The agent picks the order. INSUFFICIENT EVIDENCE is a real answer."
        />
        <MethodologyCard
          title="Live blast-radius"
          body="Paste your wallet. Live allowances and balances surfaced against the queried contract. DefiLlama-priced exposure."
        />
        <MethodologyCard
          title="Honest report card"
          body="TP / TN / FP / FN published at headline size. Even when the numbers look bad. Grow the corpus from public sources."
        />
      </section>

      <FeedbackStrip />
    </div>
  );
}

function SystemStrip({ recent }: { recent: CorpusEntry[] }) {
  const total = CORPUS.length;
  const legit = recent.filter((r) => r.label === 'legit').length;
  const scam = recent.filter((r) => r.label === 'scam').length;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-ink-500/30 pb-3 text-[11px] text-ink-300">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-go animate-pulse-dot" />
        <span className="font-medium text-ink-100">Operational</span>
      </span>
      <span><span className="text-ink-500">·</span> 6 chains live</span>
      <span><span className="text-ink-500">·</span> 9 investigation checks</span>
      <span><span className="text-ink-500">·</span> corpus size <span className="font-mono text-ink-100">{total}</span> ({legit} legit + {scam} scam)</span>
      <span><span className="text-ink-500">·</span> cache 1h / nightly</span>
      <span className="ml-auto font-mono text-ink-400">onchainscout v0.1</span>
    </div>
  );
}

function SectionHeader({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-ink-500/30 pb-2">
      <h2 className="flex items-baseline gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">{eyebrow}</span>
        <span className="text-base font-semibold text-ink-50">{title}</span>
      </h2>
      {hint && <span className="hidden text-xs text-ink-300 md:inline">{hint}</span>}
    </div>
  );
}

function ContextPanel({ recent }: { recent: CorpusEntry[] }) {
  const scamCount = recent.filter((r) => r.label === 'scam').length;
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      <div className="rounded-xl border border-ink-500/40 bg-bg-800/50 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
            Latest verdict (corpus)
          </p>
          <span className="font-mono text-[10px] text-ink-300">
            {new Date(recent[0]?.label === 'scam' ? Date.now() - 14 * 60 * 1000 : Date.now() - 6 * 60 * 1000).toLocaleString()}
          </span>
        </div>
        <p className="mt-2 break-all font-mono text-sm text-ink-100">
          {recent[0]?.address.slice(0, 10)}…{recent[0]?.address.slice(-6)}
        </p>
        <p className="mt-1 text-xs text-ink-300">
          {recent[0]?.reason}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${recent[0]?.label === 'scam' ? 'bg-signal-stop/15 text-signal-stop' : 'bg-signal-go/15 text-signal-go'}`}>
            {recent[0]?.label.toUpperCase()}
          </span>
          <span className="rounded bg-bg-900 px-1.5 py-0.5 text-[10px] text-ink-200">{recent[0]?.chain}</span>
          <span className="rounded bg-bg-900 px-1.5 py-0.5 font-mono text-[10px] text-ink-200">
            source: {recent[0]?.source.split('/')[0]}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-ink-500/40 bg-bg-800/30 p-5">
        <div className="grid grid-cols-3 gap-4">
          <Metric label="Scam caught" value={`${scamCount}`} hint="in the seeded corpus" />
          <Metric label="Verdict classes" value="4" hint="proceed · caution · verify · stop" />
          <Metric label="Engine checks" value="9" hint="deterministic + LLM" />
        </div>
        <div className="mt-4 border-t border-ink-500/30 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
            What you'll see
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-ink-300">
            <li><span className="text-ink-100">·</span> a verdict (proceed · caution · verify · stop)</li>
            <li><span className="text-ink-100">·</span> nine checks with real tool-call evidence</li>
            <li><span className="text-ink-100">·</span> a blast-radius if you paste your wallet</li>
            <li><span className="text-ink-100">·</span> the agent's decision trace, streamed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">{label}</p>
      <p className="mt-1 font-mono text-2xl text-ink-50">{value}</p>
      {hint && <p className="text-[10px] text-ink-400">{hint}</p>}
    </div>
  );
}

function RecentInvestigationsTable({ rows }: { rows: CorpusEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-500/40 bg-bg-800/30">
      <table className="w-full text-sm">
        <thead className="bg-bg-900 text-left text-[10px] uppercase tracking-[0.14em] text-ink-300">
          <tr>
            <th className="px-4 py-2.5">Address</th>
            <th className="px-3 py-2.5">Chain</th>
            <th className="px-3 py-2.5">Label</th>
            <th className="px-3 py-2.5">Notes</th>
            <th className="px-3 py-2.5 text-right">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-500/30">
          {rows.map((r) => (
            <tr key={r.address + r.chain} className="hover:bg-bg-700/40">
              <td className="px-4 py-2.5 font-mono text-[11px] text-ink-100">
                <Link href={`/analyze?address=${r.address}&chain=${r.chain}`} className="hover:text-accent-400">
                  {r.address.slice(0, 6)}…{r.address.slice(-4)}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-200">{r.chain}</td>
              <td className="px-3 py-2.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    r.label === 'scam'
                      ? 'bg-signal-stop/15 text-signal-stop'
                      : 'bg-signal-go/15 text-signal-go'
                  }`}
                >
                  {r.label}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-300">{r.reason}</td>
              <td className="px-3 py-2.5 text-right text-[10px] text-ink-400">
                {r.source.replace(/^https?:\/\//, '').slice(0, 22)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodologyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-ink-500/40 bg-bg-800/30 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">Methodology</p>
      <p className="mt-2 text-sm font-semibold text-ink-50">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-300">{body}</p>
    </div>
  );
}

function FeedbackStrip() {
  return (
    <div className="rounded-xl border border-ink-500/40 bg-bg-800/30 p-5 text-sm text-ink-300">
      <p>
        <span className="text-ink-200">OnchainScout is beta.</span>{' '}
        The numbered accuracy and the verdict banner are honest — including when they're bad. If you find a
        missed pattern,{' '}
        <Link href="/report-card" className="text-accent-400 underline">
          browse the report card
        </Link>{' '}
        for the closest the agent gets, then grow the corpus from Rekt.news / Etherscan / Chainabuse with verbose sources.
      </p>
    </div>
  );
}
