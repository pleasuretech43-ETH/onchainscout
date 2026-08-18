import Link from 'next/link';
import { InputForm } from '@/components/InputForm';
import { RecentInvestigations } from '@/components/RecentInvestigations';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-ink-500/40 bg-bg-800/40 px-6 py-12 sm:px-10 sm:py-14">
        {/* faded dot grid */}
        <div className="pointer-events-none absolute inset-0 bg-hero-grid opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -top-32 right-1/3 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-accent-700/10 blur-3xl" aria-hidden />

        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-2.5 py-0.5 text-[11px] font-medium text-accent-400">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-dot" />
              Live · 6 chains · 9 checks
            </span>
            <span className="rounded-full border border-ink-500/40 bg-bg-700/60 px-2.5 py-0.5 text-[11px] text-ink-200">
              Multichain · EVM-only · honest
            </span>
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            The intelligence layer{' '}
            <span className="bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent">
              between you
            </span>{' '}
            and the blockchain.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-100 sm:text-lg">
            Before you <strong className="font-medium text-ink-50">trust, sign, send, buy, approve, bridge, or invest</strong>,
            OnchainScout investigates what you&apos;re actually dealing with, verifies the evidence,
            explains the risks, and recommends whether to proceed.
          </p>

          <p className="mt-4 max-w-2xl text-sm text-ink-300">
            <span className="text-ink-200">Don't trust the AI.</span>{' '}
            <span className="text-ink-200">Don't trust the marketing.</span>{' '}
            <span className="text-ink-200">Don't trust the influencer.</span>{' '}
            <span className="text-ink-200">Don't trust the first piece of evidence.</span>
            <br />
            <span className="mt-1 inline-block text-ink-50">Investigate. Verify. Understand. Then act.</span>
          </p>

          <div className="mt-8">
            <InputForm />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Pillar
          eyebrow="01 · Investigate"
          title="9 deterministic checks"
          body="The agent picks the order: verified source, dangerous functions, ownership, deployer history, liquidity, holder concentration, and more — over 6 chains."
        />
        <Pillar
          eyebrow="02 · Verify"
          title="Every claim traces"
          body="Marketing claims cross-checked against DefiLlama, Etherscan, Dexscreener. Each line has a 'Prove it' link. INSUFFICIENT EVIDENCE is a real answer."
        />
        <Pillar
          eyebrow="03 · Explain"
          title="Honest receipts"
          body="Risk dimensions with bars. Blast-radius dollar exposure. Recommendation: proceed, caution, verify, or stop — published, not curated."
        />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <RecentInvestigations />
        <SandboxGuide />
        <VisionCard />
      </section>
    </div>
  );
}

function Pillar({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="card-hover rounded-xl border border-ink-500/40 bg-bg-800/40 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">{eyebrow}</p>
      <p className="mt-2 text-base font-semibold text-ink-50">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-200">{body}</p>
    </div>
  );
}

function SandboxGuide() {
  return (
    <div className="card-hover rounded-xl border border-ink-500/40 bg-bg-800/40 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">
        Try these
      </p>
      <p className="mt-2 text-base font-semibold text-ink-50">One-click sandbox</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li><Link href="/analyze?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum" className="text-accent-400 hover:underline">WETH (Ethereum)</Link> — verified, no owner</li>
        <li><Link href="/analyze?address=0x80e4f014c98320eab524ae16b0aaf1603f4dc01d&chain=ethereum" className="text-accent-400 hover:underline">Compromised: Honeypot 2</Link> — should flag</li>
        <li><Link href="/analyze-url?url=https://aave.com" className="text-accent-400 hover:underline">aave.com</Link> — claim verification</li>
        <li><Link href="/report-card" className="text-accent-400 hover:underline">Honest Report Card</Link> — self-evaluation</li>
      </ul>
    </div>
  );
}

function VisionCard() {
  return (
    <div className="card-hover rounded-xl border border-ink-500/40 bg-bg-800/40 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent-400">
        Why does this matter
      </p>
      <p className="mt-2 text-base font-semibold text-ink-50">Don't trust. Investigate.</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-200">
        The first generation of AI agents promotes wallets, calls contracts, moves funds —
        with zero guardrails. The second needs to investigate before it acts.
      </p>
      <p className="mt-3 text-xs text-ink-400">
        This MVP is the input layer of that future. Post-hackathon the same engine enforces guardrails on agent transactions.
      </p>
    </div>
  );
}
