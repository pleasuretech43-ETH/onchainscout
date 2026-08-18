# OnchainScout demo script — 60 seconds, frame-perfect

A narration you can read while screen-recording. Designed for the Orion hackathon submission video / live demo.

---

## Setup (before recording)

1. Open your deployed Vercel URL (or `http://localhost:3000` locally)
2. Have the input box cleared
3. Open these tabs in advance so you can switch quickly:
   - Landing (`/`)
   - WETH investigation (`/analyze?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum`)
   - Aave claim verification (`/analyze-url?url=https://aave.com`)
   - Honest report card (`/report-card`)
4. Browser zoom: 100% or 110%

---

## The script (60 seconds, narration under each timestamp)

### 0:00 — 0:05 — Landing
> *"Web3 has spent years solving infrastructure. Faster chains. Cheaper transactions. Better wallets. But one problem remains: people still don't know what they're interacting with. OnchainScout is the intelligence layer that investigates before you sign, send, buy, approve, or invest."*

(Camera: landing page. Cursor highlights "Investigate. Verify. Understand. Then act.")

### 0:05 — 0:20 — Contract investigation (WETH)
> *"Paste any contract address. Pick a chain. Hit investigate. The agent picks what to check, runs each one against real chain data, and records the entire decision trace. Here we're looking at WETH on Ethereum — six chains configured, the agent found it's verified, the ownership is renounced, six DEX pairs with ninety-eight million in liquidity. No risk signals. Proceed."*

(Camera: paste address → click Investigate → wait for result. Scroll to risk dimensions and trace.)

### 0:20 — 0:30 — Claim verification (Aave)
> *"OnchainScout also verifies marketing claims. Paste a project URL — the agent scrapes the page, extracts every concrete claim, and cross-checks each against DefiLlama. Here Aave claims twenty-one million users — OnchainScout correctly says INSUFFICIENT EVIDENCE, because on-chain user count isn't a verifiable thing. That's not a failure — that's honesty."*

(Camera: paste `https://aave.com` → Investigate → scroll the claim verification table.)

### 0:30 — 0:45 — Honest report card (the receipts)
> *"Every investigation is graded against a labeled corpus of known scams and legit protocols. Twenty-eight percent precision. Forty-one percent recall. Why is recall lower? Because legitimate DeFi protocols have owners — USDC's master minter, Aave's governance. We treat that as a verification prompt, not a clearance. That's exactly how an investigator reasons. And the false-positive rate is published at headline size, just like Drift-d. We don't curate. We publish."*

(Camera: /report-card. Highlight the "About these numbers" section. Scroll to per-entry table.)

### 0:45 — 0:55 — The blast-radius differentiator
> *"Optional: paste your wallet. OnchainScout enumerates every ERC-20 you hold, checks live allowances to the contract, sums the dollar exposure. If this contract were malicious, this is how much you could lose. That's the missing number in every DeFi interface."*

(Camera: scroll back to the analyze page, paste a wallet, click "Compute blast-radius". Highlight the rose-colored exposure panel.)

### 0:55 — 1:00 — Close
> *"OnchainScout. Don't trust the AI. Don't trust the marketing. Investigate. Verify. Understand. Then act."*

(Camera: zoom out on the verdict panel.)

---

## Alternative 30-second version (for X / Twitter)

If you only have 30 seconds:

> *"OnchainScout investigates contracts before you sign. Verified source, dangerous functions, ownership, deployer history, liquidity, holder concentration — nine deterministic checks across six chains. Plus claim verification for project URLs, and a blast-radius number for your wallet. Honest report card, published at headline size, even when the numbers are bad. Investigate. Verify. Then act."*

---

## What NOT to say

- Don't promise "100% accuracy" — the honest report card shows what the numbers really are
- Don't claim "AI-detects all scams" — be specific about what each check does
- Don't say "revolutionary" or "industry-first" — the audience is technical; speak to engineering specifics
- Don't apologize for the FP rate — frame it as the agent being appropriately cautious

---

## Suggested captions for X / social

```
OnchainScout — the intelligence layer between you and the blockchain.

- 9 deterministic checks across 6 EVM chains
- Claim verification for project URLs (vs DefiLlama)
- Live blast-radius: $X max identifiable exposure for your wallet
- Honest Report Card — accuracy published at headline size

Don't trust. Investigate. Verify. Then act.

[link] #OrionBuildersHackathon
```
