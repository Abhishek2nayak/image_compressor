import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { BRAND, SITE_URL } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND} — Free Online PDF & Image Tools`,
    template: `%s | ${BRAND}`,
  },
  description:
    'Free online PDF and image tools: compress images, convert JPG to PDF, merge PDF, split PDF and compress PDF. Most tools run in your browser.',
  applicationName: BRAND,
  authors: [{ name: BRAND }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: BRAND,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'nxkzM0PDGBbgXmWRyanSikl_1qlUeK6JbI2eTOUgGfU',
  },
  // NOTE: no `alternates.canonical` here on purpose. A canonical set on the
  // root layout is inherited by every page that does not override it, which is
  // exactly the bug this replaces. Each page declares its own self-referencing
  // canonical instead.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
