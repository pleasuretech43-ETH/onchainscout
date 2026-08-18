'use client';

export interface RecentEntry {
  kind: 'contract' | 'url';
  value: string;
  chain?: string;
  at: number; // timestamp
}

const KEY = 'onchainscout:recent';
const MAX = 8;

export function recordInvestigation(entry: Omit<RecentEntry, 'at'>): void {
  if (typeof window === 'undefined') return;
  const all: RecentEntry[] = JSON.parse(localStorage.getItem(KEY) || '[]');
  const filtered = all.filter(
    (e) => !(e.kind === entry.kind && e.value.toLowerCase() === entry.value.toLowerCase()),
  );
  const next: RecentEntry[] = [{ ...entry, at: Date.now() }, ...filtered].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
}

export function listRecent(): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
