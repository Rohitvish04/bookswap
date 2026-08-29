import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap', axes: ['opsz', 'SOFT'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'BookSwap — Exchange Books, Not Money', template: '%s · BookSwap' },
  description:
    'Discover readers near you, exchange books you have for books you want, and pay only a small service fee. BookSwap is India\'s community book exchange platform.',
  openGraph: {
    title: 'BookSwap — Exchange Books, Not Money',
    description: 'Find nearby readers and exchange books you own for books you want.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
