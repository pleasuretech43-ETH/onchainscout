import './globals.css';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppShell } from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500'],
});

export const metadata = {
  title: 'OnchainScout — Investigate before you trust',
  description:
    'The intelligence layer between you and the blockchain. Investigates, verifies, and explains the risks of any contract before you sign, send, buy, approve, or invest.',
  keywords: ['web3', 'crypto', 'security', 'scam detection', 'honeypot', 'AI agent', 'OnchainScout', 'Orion'],
  authors: [{ name: 'OnchainScout' }],
  creator: 'OnchainScout',
  metadataBase: new URL('https://onchainscout.xyz'),
  openGraph: {
    title: 'OnchainScout — Investigate before you trust',
    description:
      "An AI agent that investigates contracts and verifies project claims before you sign, send, buy, or approve.",
    type: 'website',
    siteName: 'OnchainScout',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnchainScout — Investigate before you trust',
    description:
      '9 deterministic checks × 6 chains. Honest receipts. Live blast-radius. Verified claims.',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#07090f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-bg-900 text-ink antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
