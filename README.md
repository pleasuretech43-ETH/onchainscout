# OnchainScout

> **The intelligence layer between you and the blockchain.**
>
> Before you trust, sign, send, buy, approve, bridge, or interact, OnchainScout investigates what you're actually dealing with, verifies the evidence, explains the risks, and recommends whether to proceed.

Built for the **Orion Builder Hackathon**.

![Status](https://img.shields.io/badge/scope-MVP-7c5cff) ![Chains](https://img.shields.io/badge/chains-6-34d399) ![Checks](https://img.shields.io/badge/investigation%20checks-9-fbbf24) ![UI](https://img.shields.io/badge/UI-Dark%20%2B%20Tailwind-9d85ff)

---

## What it does

Paste any **EVM contract address** OR any **project URL**. OnchainScout:

| Input | Output |
|---|---|
| `0x…` contract address + chain | Full investigation: 9 deterministic checks across 6 EVM chains, risk dimensions, blast-radius (optional wallet input), decision trace, evidence drill-down |
| `https://…` project URL | Claim verification table: every marketing claim extracted, cross-checked against DefiLlama, status: VERIFIED / UNVERIFIED / CONTRADICTED / INSUFFICIENT EVIDENCE |

### The investigation loop

**Discover → Understand → Investigate → Verify → Assess → Simulate → Explain → Act**

Every claim has a "Prove it" link back to the underlying tool call. Every check returns a structured result before the LLM is allowed to narrate. **INSUFFICIENT EVIDENCE** is a real answer — never a guess.

### Multichain (6 EVM chains, one architecture)

`Ethereum · Base · Arbitrum · Optimism · Polygon · BNB`

One `ChainAdapter` interface, six Etherscan-V2 implementations, **one API key covers all six**.

### 9 deterministic checks (the investigation engine)

| Check | What it does | Source |
|---|---|---|
| `verified` | Source code published & verified? | Etherscan V2 getsourcecode |
| `proxy-upgradeable` | EIP-1967 proxy pattern? | Etherscan V2 |
| `ownership` | `owner()` exposed? Renounced vs active? | eth_call to `0x8da5cb5b` |
| `dangerous-functions` | ABI scan for selfdestruct, mint, blacklist, mutable-tax, etc. | Etherscan V2 getabi |
| `honeypot` | ERC-20 detection; honest INSUFFICIENT EVIDENCE without state fork | eth_call to symbol/decimals |
| `liquidity` | DEX pairs, liquidity $, 24h volume | Dexscreener (free, no auth) |
| `holder-concentration` | Top 1 / Top 10 holders % | Etherscan V2 tokenholderlist |
| `deployer-history` | Creator + number of contracts they've deployed | Etherscan V2 getcontractcreation |
| `contract-age` | Days since first tx | Etherscan V2 txlist |

### Two non-trivial additions

- **Claim verification** for project URLs: regex + LLM extraction, DefiLlama cross-check, structured status table. **Nobody in the gallery does this.**
- **Blast-radius**: paste your wallet, get the total $ exposure to the queried contract across all live allowances + balances. DefiLlama prices.

### The Honest Report Card

A self-running accuracy report over a labeled corpus (10 legit + 9 scam, sourced from Etherscan, Rekt.news, Chainabuse). Precision / recall / F1 / FP rate / confusion matrix / per-entry classification — **published at headline size, even when bad**.

That's the Drift-d move applied to safety. The agent gets better as the corpus grows.

---

## Run it locally

```bash
cd /home/user/onchainscout
cp .env.example .env.local       # add your free Etherscan V2 key here
npm install
npm run dev                      # http://localhost:3000
```

> One free signup unlocks the full project: a free Etherscan API key from [etherscan.io/apis](https://etherscan.io/apis) covers all 6 EVM chains in this project via the unified V2 endpoint. Without a key, the demo still runs but most checks return INSUFFICIENT EVIDENCE.

### Try these first

| Address / URL | Chain / Domain | What it shows |
|---|---|---|
| `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Ethereum | WETH — verified, no owner, $98M liquidity |
| `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Ethereum | Uniswap V2 Router — verified, owner-caution |
| `0x80e4f014c98320eab524ae16b0aaf1603f4dc01d` | Ethereum | Etherscan-labeled honeypot — should flag stop |
| `https://aave.com` | URL | Claim verification table with INSUFFICIENT EVIDENCE for user counts |

---

## Project structure

```
onchainscout/
├── src/
│   ├── app/
│   │   ├── page.tsx                      ← Landing
│   │   ├── analyze/page.tsx              ← Contract investigation
│   │   ├── analyze-url/page.tsx          ← Project claim verification
│   │   ├── report-card/page.tsx          ← Honest Report Card
│   │   └── api/
│   │       ├── analyze/route.ts          ← POST address + chain + wallet?
│   │       ├── analyze-url/route.ts      ← POST url
│   │       └── report-card/route.ts      ← GET / POST (force refresh)
│   ├── lib/
│   │   ├── chains/                       ← Chain-agnostic adapter + Etherscan V2 client
│   │   ├── investigation/
│   │   │   ├── checks/                  ← 9 individual check modules
│   │   │   └── orchestrator.ts           ← Decides order, runs checks, traces
│   │   ├── url-input/                    ← URL fetcher, claim extractor, claim verifier
│   │   ├── blast-radius/                 ← Wallet enumeration + allowance compute + USD pricing
│   │   ├── report-card/                  ← Self-running accuracy report
│   │   └── llm.ts                        ← OpenAI / Anthropic narrative + LLM claim extraction
│   ├── components/
│   │   ├── InputForm.tsx                 ← Auto-detects address vs URL
│   │   ├── RecommendationBanner.tsx
│   │   ├── CheckCard.tsx                 ← Inline "Why this verdict?" expansion
│   │   ├── TraceView.tsx
│   │   └── BlastRadiusView.tsx
│   └── data/
│       └── corpus.ts                     ← Labeled corpus: 10 legit + 9 scam
├── DEPLOY.md                             ← Step-by-step Vercel + GitHub push
├── DEMO_SCRIPT.md                        ← 60-second narration for the demo video
├── vercel.json                           ← Vercel config (security headers, regions)
└── README.md                             ← (you are here)
```

---

## The honesty posture

OnchainScout is allowed to say **INSUFFICIENT EVIDENCE** when the data isn't there. If a contract isn't verified, the verdict says so — we don't fabricate confidence. Every claim in the narrative is gated by a `[check:<id>]` citation that maps to a real tool call.

The Honest Report Card publishes its own false-positive rate at headline size. **We don't curate. We publish.**

---

## The vision (post-hackathon roadmap)

What's in the MVP today:

- 9 deterministic investigation checks · 6 EVM chains
- Project claim verification · blast-radius quantification
- Honest Report Card · live trace

What's deferred (Agent Store post-MVP):

- Wallet connection · real-time monitoring + alerts
- AI-Agent Guardrails: agent-to-agent policy enforcement
- Reputation layer over time · cross-chain extension to zkSync, Avalanche, Solana

---

## License

MIT. Build on it, fork it, ship your own.
