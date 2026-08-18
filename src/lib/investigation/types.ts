import type { ChainId } from '@/lib/chains';

export type CheckId =
  | 'verified'
  | 'proxy-upgradeable'
  | 'ownership'
  | 'dangerous-functions'
  | 'honeypot'
  | 'liquidity'
  | 'holder-concentration'
  | 'deployer-history'
  | 'contract-age'
  | 'claim-verification';

export type RiskLevel = 'go' | 'caution' | 'stop' | 'unknown';

export type Confidence = 'strong' | 'limited' | 'none' | 'unknown';

export interface CheckEvidence {
  source: string;
  url?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface CheckResult {
  id: CheckId;
  label: string;
  status: RiskLevel;
  summary: string;
  evidence: CheckEvidence[];
  signals: string[];
  confidence: Confidence;
  // why this evidence / what to verify
  why?: string;
}

export interface TraceStep {
  step: number;
  at: string;
  checkId: CheckId | 'orchestrator' | 'planner' | 'failure-scenarios';
  reasoning: string;
  decision: 'run' | 'skip' | 'investigate-further' | 'plan';
  outcome?: string;
  phase?: 'Discover' | 'Understand' | 'Investigate' | 'Verify' | 'Assess' | 'Synthesize';
}

export interface RiskDimension {
  name: string;
  level: RiskLevel;
  detail: string;
  confidence: Confidence;
  proveIt?: { evidence: CheckEvidence[]; source?: string };
}

export interface BlastRadiusToken {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: string;
  allowance: string;
  balanceUsd: number | null;
  allowanceUsd: number | null;
}

export interface BlastRadiusData {
  wallet: string;
  contract: string;
  chain: ChainId;
  nativeBalance: string;
  nativeSymbol: string;
  nativeBalanceUsd: number | null;
  tokens: BlastRadiusToken[];
  maxIdentifiableExposureUsd: number;
  warnings: string[];
  finishedAt: string;
}

export interface FailureScenario {
  title: string;
  steps: string[];
  worstIdentifiableLoss: string | null;
  why: string;
}

export interface InvestigationResult {
  address: string;
  chain: ChainId;
  isContract: boolean;
  startedAt: string;
  finishedAt: string;
  checks: CheckResult[];
  trace: TraceStep[];
  blastRadiusUsd: number | null;
  blastRadius?: BlastRadiusData | null;
  recommendation: RiskLevel;
  headline: string;
  narrative: string;
  riskDimensions: RiskDimension[];
  insufficientEvidence: boolean;
  errors: string[];
  inputType?: 'address' | 'url';
  claims?: VerifiedClaim[];
  scenarios?: FailureScenario[];
}

export interface VerifiedClaim {
  claim: string;
  category: 'users' | 'tvl' | 'audit' | 'chain' | 'other';
  rawText: string;
  status: 'verified' | 'partial' | 'unverified' | 'contradicted' | 'insufficient-evidence';
  onchainEvidence: string | null;
  source: string | null;
  sourceUrl?: string;
}
