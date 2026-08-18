'use client';

interface Props {
  chain?: 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon' | 'bnb';
  status?: 'live' | 'off' | 'pending';
}

const CHAIN_COLOR: Record<NonNullable<Props['chain']>, string> = {
  ethereum: '#627eea',
  base: '#0052ff',
  arbitrum: '#28a0f0',
  optimism: '#ff0420',
  polygon: '#8247e5',
  bnb: '#f0b90b',
};

export function StatusDot({ chain, status }: Props) {
  const color = chain ? CHAIN_COLOR[chain] : status === 'live' ? '#10b981' : '#71717a';
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}80`,
      }}
      aria-hidden
    />
  );
}
