import { NextRequest, NextResponse } from 'next/server';
import { investigate } from '@/lib/investigation';
import { computeBlastRadius } from '@/lib/blast-radius';
import type { ChainId } from '@/lib/chains';

const VALID_CHAINS: ChainId[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bnb'];

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function POST(req: NextRequest) {
  let body: { address?: string; chain?: string; wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const address = (body.address || '').trim();
  const chain = (body.chain || '').trim() as ChainId;
  const wallet = (body.wallet || '').trim();

  if (!isValidAddress(address)) {
    return NextResponse.json(
      { error: 'Address must be 0x-prefixed 40 hex chars.' },
      { status: 400 },
    );
  }
  if (!VALID_CHAINS.includes(chain)) {
    return NextResponse.json(
      { error: `Unsupported chain. Pick one of: ${VALID_CHAINS.join(', ')}` },
      { status: 400 },
    );
  }

  const investigationP = investigate(address, chain);
  const blastP =
    wallet && isValidAddress(wallet)
      ? computeBlastRadius(wallet, address, chain).catch((e) => ({ error: (e as Error).message }))
      : Promise.resolve(null);

  const [investigation, blast] = await Promise.all([investigationP, blastP]);

  if (blast && !(blast as { error?: string }).error && (blast as { maxIdentifiableExposureUsd?: number }).maxIdentifiableExposureUsd !== undefined) {
    investigation.blastRadiusUsd = (blast as { maxIdentifiableExposureUsd: number }).maxIdentifiableExposureUsd;
    investigation.blastRadius = blast as any;
  }

  return NextResponse.json(investigation);
}

export async function GET() {
  return NextResponse.json({
    usage:
      'POST { address: "0x...", chain: "ethereum|base|arbitrum|optimism|polygon|bnb", wallet?: "0x..." }',
  });
}
