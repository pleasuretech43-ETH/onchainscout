'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toaster } from './Toaster';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-900">
      {/* Sidebar — persistent on lg+, drawer on mobile */}
      <aside
        className={`fixed lg:sticky lg:top-0 z-40 flex h-screen w-[260px] shrink-0 flex-col border-r border-ink-500/50 bg-bg-800 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-bg-900/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main key={pathname} className="flex-1 px-4 pb-12 pt-6 lg:px-8 animate-fade-in">
          {children}
        </main>
        <AppFooter />
      </div>

      <Toaster />
    </div>
  );
}

import { AppFooter } from './AppFooter';
