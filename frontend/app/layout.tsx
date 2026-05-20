import './globals.css';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'ChatLeads AI | Dark Nexus Intelligence Platform',
  description: 'Next-generation WhatsApp lead intelligence powered by AI. Capture, score, and convert leads in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className={`${inter.className} bg-[var(--bg-void)] text-[var(--text-primary)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
