import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'OnchainScout — Investigate before you trust',
  description:
    'The intelligence layer between you and the blockchain. Investigates, verifies, and explains the risks of any contract before you sign, send, buy, approve, or invest.',
  keywords: [
    'web3',
    'crypto',
    'security',
    'scam detection',
    'rug pull',
    'honeypot',
    'AI agent',
    'OnchainScout',
    'Orion',
  ],
  authors: [{ name: 'OnchainScout' }],
  creator: 'OnchainScout',
  openGraph: {
    title: 'OnchainScout — Investigate before you trust',
    description:
      "Don't trust the AI. Don't trust the marketing. Don't trust the influencer. Investigate. Verify. Understand. Then act.",
    type: 'website',
    siteName: 'OnchainScout',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnchainScout — Investigate before you trust',
    description:
      "An AI agent that investigates contracts and verifies project claims before you sign, send, buy, or approve. Multichain. Honest receipts.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-900 text-ink-50 antialiased">{children}</body>
    </html>
  );
}
