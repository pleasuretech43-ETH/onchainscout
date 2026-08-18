import { investigate } from '@/lib/investigation';
import { CORPUS, CORPUS_NOTE, type CorpusEntry, type CorpusLabel } from '@/data/corpus';
import type { ChainId } from '@/lib/chains';
import type { RiskLevel } from '@/lib/investigation/types';

export interface ReportCardEntry {
  address: string;
  chain: ChainId;
  expectedLabel: CorpusLabel;
  flagged: boolean;
  recommendation?: RiskLevel;
  durationMs: number;
  error?: string;
}

export interface ReportCardMetrics {
  total: number;
  byChain: Record<string, { total: number; flaggedCorrectly: number }>;
  truePositives: number; // correctly flagged scam
  falsePositives: number; // legit flagged as risk
  trueNegatives: number; // correctly not flagged legit
  falseNegatives: number; // scam not flagged (missed)
  precision: number;
  recall: number;
  f1: number;
  falsePositiveRate: number;
  accuracy: number;
  entries: ReportCardEntry[];
  generatedAt: string;
  corpusNote: typeof CORPUS_NOTE;
}

async function processEntry(entry: CorpusEntry): Promise<ReportCardEntry> {
  const start = Date.now();
  try {
    const result = await investigate(entry.address, entry.chain);
    const flagged = result.recommendation === 'stop' || result.recommendation === 'caution';
    return {
      address: entry.address,
      chain: entry.chain,
      expectedLabel: entry.label,
      flagged,
      recommendation: result.recommendation,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    return {
      address: entry.address,
      chain: entry.chain,
      expectedLabel: entry.label,
      flagged: false,
      durationMs: Date.now() - start,
      error: (e as Error).message,
    };
  }
}

async function processInBatches<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

export async function runReportCard(): Promise<ReportCardMetrics> {
  // Concurrency 2 keeps us under most public Etherscan rate limits.
  const entries = await processInBatches(CORPUS, processEntry, 2);

  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  const byChain: Record<string, { total: number; flaggedCorrectly: number }> = {};

  for (const e of entries) {
    if (e.error) continue;
    const isScam = e.expectedLabel === 'scam';
    const flagged = e.flagged;
    if (isScam && flagged) tp++;
    else if (!isScam && flagged) fp++;
    else if (!isScam && !flagged) tn++;
    else if (isScam && !flagged) fn++;

    if (!byChain[e.chain]) byChain[e.chain] = { total: 0, flaggedCorrectly: 0 };
    byChain[e.chain].total += 1;
    if ((isScam && flagged) || (!isScam && !flagged)) {
      byChain[e.chain].flaggedCorrectly += 1;
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falsePositiveRate = fp + tn > 0 ? fp / (fp + tn) : 0;
  const denom = entries.filter((e) => !e.error).length;
  const accuracy = denom > 0 ? (tp + tn) / denom : 0;

  return {
    total: entries.length,
    byChain,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    precision,
    recall,
    f1,
    falsePositiveRate,
    accuracy,
    entries,
    generatedAt: new Date().toISOString(),
    corpusNote: CORPUS_NOTE,
  };
}
