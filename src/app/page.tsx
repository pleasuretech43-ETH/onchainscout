import Link from 'next/link';
import { InputForm } from '@/components/InputForm';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <header className="mb-12">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-accent-400">OnchainScout</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            The intelligence layer between you and the blockchain.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-300">
            Before you <em>trust, sign, send, buy, approve, bridge, or invest</em>,
            OnchainScout investigates what you're actually dealing with, verifies the
            evidence, explains the risks, and recommends whether to proceed.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-ink-400">
            Don't trust the AI. Don't trust the marketing. Don't trust the influencer. Don't
            trust the first piece of evidence.
            <br />
            <span className="text-ink-200">
              Investigate. Verify. Understand. Then act.
            </span>
          </p>
        </header>

        <InputForm />

        <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Pillar
            title="Investigate"
            body="9 deterministic checks across 6 EVM chains. The agent picks the order, runs each check, and records every tool call."
          />
          <Pillar
            title="Verify"
            body="Marketing claims get cross-checked against DefiLlama, Etherscan, and Dexscreener. Every line item has a 'Prove it' link. INSUFFICIENT EVIDENCE is a real answer."
          />
          <Pillar
            title="Explain"
            body="Risk dimensions with bars, not one meaningless AI-generated score. Blast-radius dollar exposure. Recommendation: proceed, caution, verify, or stop."
          />
        </section>

        <section className="mt-12 flex flex-wrap gap-3 text-sm">
          <Link
            href="/report-card"
            className="rounded-lg border border-accent-500 bg-accent-500/10 px-4 py-2 text-accent-400 hover:bg-accent-500/20"
          >
            View Honest Report Card →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-ink-700 px-4 py-2 text-ink-300 hover:bg-ink-800"
          >
            GitHub
          </a>
        </section>

        <footer className="mt-20 border-t border-ink-700 pt-6 text-sm text-ink-400">
          Multichain: Ethereum · Base · Arbitrum · Optimism · Polygon · BNB · Built for the
          Orion Builder Hackathon.
        </footer>
      </section>
    </main>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800/50 p-5">
      <h3 className="mb-2 text-base font-semibold text-accent-400">{title}</h3>
      <p className="text-sm text-ink-300">{body}</p>
    </div>
  );
}
