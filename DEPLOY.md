# Deploy OnchainScout — step by step

Estimated time: **10 minutes**.

---

## 0. Prereqs

- Node 20+ (check with `node -v`)
- npm 10+ (`npm -v`)
- A GitHub account
- A Vercel account (free signup at https://vercel.com — log in with GitHub)
- A free Etherscan V2 API key from https://etherscan.io/apis (30 sec signup, no CC)

---

## 1. Push to GitHub

In this repo:

```bash
cd /home/user/onchainscout
git status
git add .
git commit -m "OnchainScout MVP — Orion Builder Hackathon submission"
```

Then create an empty repo on GitHub (https://github.com/new — name it `onchainscout`, do NOT add README/license/.gitignore, leave the repo empty). Then:

```bash
git remote add origin git@github.com:YOUR_USERNAME/onchainscout.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_USERNAME` with your actual GitHub username. Use HTTPS URL + PAT if you don't have SSH keys.)

---

## 2. Deploy to Vercel

Two paths. Pick one.

### A. Vercel dashboard (recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your `onchainscout` repo
4. Framework preset: **Next.js** (auto-detected)
5. Root directory: `./` (leave default)
6. **Environment variables** — add these:
   - `ETHERSCAN_API_KEY` → your free Vercel V2 key
   - `OPENAI_API_KEY` → (optional) for richer claim extraction
   - `ANTHROPIC_API_KEY` → (optional) alternative
7. Click **Deploy**
8. Wait ~60 seconds for the build. Vercel will give you a URL like `onchainscout-xxx.vercel.app`.

### B. Vercel CLI

```bash
npm install -g vercel
cd /home/user/onchainscout
vercel login
vercel link --yes
# Add secrets:
vercel env add ETHERSCAN_API_KEY production
# (paste key when prompted)
vercel --prod
```

---

## 3. Verify the deployment

Visit the URL Vercel gave you. Try:

| Test | URL |
|---|---|
| Landing | `https://<your-app>.vercel.app/` |
| Investigation | `https://<your-app>.vercel.app/analyze?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum` |
| Claim verification | `https://<your-app>.vercel.app/analyze-url?url=https://aave.com` |
| Honest report card | `https://<your-app>.vercel.app/report-card` |

---

## 4. Hackathon submission checklist

- [ ] Wallet connected on Base, registered at the Orion Agents platform
- [ ] Web app live with a demo URL (this Vercel URL)
- [ ] GitHub repo public
- [ ] X profile with at least one OnchainScout post
- [ ] Discord OR Telegram channel live
- [ ] Ignition fee paid (~10 USD in ETH on Base from your registered wallet)
- [ ] Submission from your registered wallet before **Sep 2, 23:59 UTC**

The ignition tx + submission happens in the Orion Agents UI, not here. Bring your demo URL + GitHub URL + X profile + Discord/Telegram link into the submission form.

---

## 5. Cost & ops

| Resource | Cost | Notes |
|---|---|---|
| Vercel hosting | $0 | Free tier covers the whole submission |
| Etherscan V2 key | $0 | One key, all 6 chains |
| OpenAI (optional) | ~$0.001/investigation | gpt-4o-mini, only fires when LLM extraction enabled |
| DefiLlama / Dexscreener | $0 | Public, no auth |
| ETH (ignition fee) | ~$10 | One-time, paid on Base |

Serverless cold starts: first investigation after idle may take ~3 seconds (Next.js ISR + outbound API calls). Warm runs: ~1.5 seconds.

---

## 6. Updates / redeploy

Every push to `main` auto-deploys via Vercel's GitHub integration. No manual steps.

To update the report-card corpus: edit `src/data/corpus.ts`, commit, push. Vercel rebuilds and the new report card appears within ~60 seconds.
