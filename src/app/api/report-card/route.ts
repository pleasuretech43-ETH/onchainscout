import { NextResponse } from 'next/server';
import { runReportCard } from '@/lib/report-card/runner';

// 1-hour in-memory cache so the page renders quickly and we don't hammer Etherscan.
let cached: { result: Awaited<ReturnType<typeof runReportCard>>; at: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    try {
      const result = await runReportCard();
      cached = { result, at: now };
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }
  return NextResponse.json({ ...cached!.result, cacheAgeMs: now - cached!.at });
}

export async function POST() {
  // Force a fresh run.
  try {
    const result = await runReportCard();
    cached = { result, at: Date.now() };
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
