'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from './Brand';
import { StatusDot } from './StatusDot';
import { listChains } from '@/lib/chains';

interface SidebarProps {
  onNavigate?: () => void;
}

const PRIMARY_NAV = [
  { href: '/', label: 'Investigate', subtitle: 'Address or URL', icon: 'search' },
  { href: '/analyze?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum', label: 'Demo: WETH', subtitle: 'Pre-canned contract', icon: 'bolt' },
  { href: '/analyze-url?url=https://aave.com', label: 'Demo: Aave', subtitle: 'Pre-canned URL', icon: 'bolt' },
  { href: '/report-card', label: 'Honest Report Card', subtitle: 'Self-evaluation', icon: 'chart' },
];

const SECONDARY_NAV = [
  { href: 'https://github.com/pleasuretech43-ETH/onchainscout', label: 'GitHub', external: true },
  { href: 'https://www.orion.xyz', label: 'Orion Agents', external: true },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const chains = listChains();

  return (
    <nav className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-ink-500/40 px-5">
        <Brand onNavigate={onNavigate} />
      </div>

      <div className="px-5 pb-2 pt-5">
        <p className="px-1 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
          Investigate
        </p>
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map((item) => {
            const active =
              (item.href === '/' && (pathname === '/' || pathname === '/analyze')) ||
              (item.href !== '/' && pathname?.startsWith(item.href.split('?')[0]));
            const isExternal = item.href.startsWith('http');
            const itemEl = (
              <>
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center text-ink-200">
                  <NavIcon name={item.icon} />
                </span>
                <span className="grow truncate text-sm">{item.label}</span>
                {isExternal && <span className="text-[10px] text-ink-300">↗</span>}
              </>
            );
            return (
              <li key={item.label}>
                {isExternal ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`focus-ring flex items-center rounded-md px-2.5 py-1.5 text-ink-100 hover:bg-bg-700/60 ${
                      active ? 'bg-bg-700/70 text-accent-400' : ''
                    }`}
                  >
                    {itemEl}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`focus-ring flex items-center rounded-md px-2.5 py-1.5 text-ink-100 hover:bg-bg-700/60 ${
                      active ? 'bg-bg-700/70 text-accent-400' : ''
                    }`}
                  >
                    {itemEl}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-5 pb-2 pt-4">
        <p className="px-1 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-300">
          Networks
        </p>
        <ul className="space-y-0.5">
          {chains.map((c) => (
            <li key={c.id}>
              <Link
                href={`/analyze?address=0x0000000000000000000000000000000000000000&chain=${c.id}`}
                onClick={onNavigate}
                className="focus-ring flex items-center rounded-md px-2.5 py-1.5 text-sm text-ink-100 hover:bg-bg-700/60"
              >
                <span className="mr-2 inline-flex h-2 w-2 shrink-0">
                  <StatusDot chain={c.id} />
                </span>
                <span className="grow truncate">{c.name}</span>
                <span className="text-[10px] text-ink-300">#{c.chainId}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-ink-500/40 px-5 py-4">
        <div className="flex items-center gap-2 rounded-md bg-bg-900/60 px-2.5 py-2 text-[11px] text-ink-300">
          <StatusDot status="live" />
          <span className="grow">Live · 6 chains</span>
        </div>
      </div>
    </nav>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = 'h-3.5 w-3.5';
  if (name === 'search')
    return (
      <svg viewBox="0 0 16 16" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="7" cy="7" r="4.5" />
        <path d="M11 11l4 4" strokeLinecap="round" />
      </svg>
    );
  if (name === 'bolt')
    return (
      <svg viewBox="0 0 16 16" className={common} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 1 3 9h4l-1 6 6-8H8z" strokeLinejoin="round" />
      </svg>
    );
  if (name === 'chart')
    return (
      <svg viewBox="0 0 16 16" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 14V2M2 14h12M5 11V8M8 11V4M11 11V6" strokeLinecap="round" />
      </svg>
    );
  return null;
}
