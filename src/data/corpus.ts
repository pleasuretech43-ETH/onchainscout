import type { ChainId } from '@/lib/chains';

export type CorpusLabel = 'legit' | 'scam';

export interface CorpusEntry {
  address: string;
  chain: ChainId;
  label: CorpusLabel;
  reason: string;
  source: string;
}

/**
 * Honest starter set for the Honest Report Card.
 *
 * Inclusion policy:
 *  - Every entry is from a public, citable source (Etherscan, Rekt.news, Chainabuse community reports).
 *  - "legit" = well-known, publicly-deployed protocol that has not been hacked/exploited.
 *  - "scam" = contract that has been ONCHAIN-LABELED as a honeypot by Etherscan, OR
 *    is the named victim contract in a top-Rekt.news documented exploit.
 *
 * To extend the corpus, add chains and addresses from these same sources.
 * The runner is chain-agnostic — just keep `source` as a citable URL/handle.
 */
export const CORPUS: CorpusEntry[] = [
  // ───────────────────────── LEGIT, cross-chain (10) ─────────────────────────
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum', label: 'legit', reason: 'WETH — canonical wrapped Ether', source: 'etherscan.io' },
  { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', chain: 'ethereum', label: 'legit', reason: 'Uniswap V2 Router', source: 'etherscan.io' },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', chain: 'ethereum', label: 'legit', reason: 'DAI — MakerDAO', source: 'etherscan.io' },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'ethereum', label: 'legit', reason: 'USDC — Circle', source: 'etherscan.io' },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chain: 'ethereum', label: 'legit', reason: 'USDT — Tether', source: 'etherscan.io' },
  { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', chain: 'ethereum', label: 'legit', reason: 'Lido stETH', source: 'etherscan.io' },
  { address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', chain: 'ethereum', label: 'legit', reason: 'Aave V3 Pool (Ethereum)', source: 'aave.com' },
  { address: '0x4200000000000000000000000000000000000010', chain: 'base', label: 'legit', reason: 'Base L2 standard bridge', source: 'docs.base.org' },
  { address: '0x10ED43C718714eb63d5aA57B78B54704E256024E', chain: 'bnb', label: 'legit', reason: 'PancakeSwap V2 Router', source: 'docs.pancakeswap.finance' },
  { address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', chain: 'polygon', label: 'legit', reason: 'Aave V3 Pool (Polygon)', source: 'aave.com' },

  // ───────────────────────── SCAM, public labels (9) ─────────────────────────
  // Etherscan–labeled honeypots / Unsafe Token Reports
  { address: '0x80e4f014c98320eab524ae16b0aaf1603f4dc01d', chain: 'ethereum', label: 'scam', reason: 'Etherscan-labeled "Compromised: Honeypot 2" — flagged at source', source: 'etherscan.io/address/0x80e4f014c98320eab524ae16b0aaf1603f4dc01d' },
  { address: '0x34c6211621f2763c60eb007dc2ae91090a2d22f6', chain: 'ethereum', label: 'scam', reason: 'Etherscan-labeled "BELLE Honeypot Token" (Fake_Phishing tag)', source: 'etherscan.io/address/0x34c6211621f2763c60eb007dc2ae91090a2d22f6' },
  { address: '0x45dac6c8776e5eb1548d3cdcf0c5f6959e410c3a', chain: 'ethereum', label: 'scam', reason: 'Etherscan-labeled "MommyMilkers" — Token Rep: Unsafe, Fake_Phishing tag', source: 'etherscan.io/address/0x45dac6c8776e5eb1548d3cdcf0c5f6959e410c3a' },

  // Rekt.news-documented exploits (victim contracts)
  { address: '0x250e76987d838a75310c34bf422ea9f1ac4cc906', chain: 'ethereum', label: 'scam', reason: 'Poly Network Proxy Lock Contract (Ethereum) — Aug 2021 $611M exploit', source: 'rekt.news/polynetwork-rekt' },
  { address: '0x05f0fDD0E49A5225011fff92aD85cC68e1D1F08e', chain: 'bnb', label: 'scam', reason: 'Poly Network exploit proxy (BNB) — Aug 2021 $611M exploit', source: 'rekt.news/polynetwork-rekt' },
  { address: '0x489a8756c18c0b8b24ec2a2b9ff3d4d447f79bec', chain: 'bnb', label: 'scam', reason: 'BSC Token Hub — BNB bridge exploit Oct 2022 ($586M)', source: 'rekt.news/bnb-bridge-rekt' },

  // Chainabuse community-reported
  { address: '0xC4574DDEF299e7E563971e200433e592EeaaFA69', chain: 'bnb', label: 'scam', reason: 'DxSale / DxLock LP locker exploit target on BNB (2024)', source: 'chainabuse.com/category/contract-exploit' },
  { address: '0x99045BD612dDF2dD1d2C9146cF8641ccedcA7290', chain: 'base', label: 'scam', reason: 'Community-reported attacker in Jamma contract exploit (Base, 2024)', source: 'chainabuse.com/category/contract-exploit' },
  { address: '0xd8010aca201f6113160200b8a521F35BE9f94C24', chain: 'polygon', label: 'scam', reason: 'Admin/bridge role attacker — Polygon aave-style exploit Apr 27 2026', source: 'chainabuse.com/category/contract-exploit' },
];

export const CORPUS_NOTE = {
  total: CORPUS.length,
  byLabel: {
    legit: CORPUS.filter((e) => e.label === 'legit').length,
    scam: CORPUS.filter((e) => e.label === 'scam').length,
  },
  byChain: Object.fromEntries(
    (['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb'] as ChainId[]).map(
      (c) => [c, CORPUS.filter((e) => e.chain === c).length],
    ),
  ),
};
