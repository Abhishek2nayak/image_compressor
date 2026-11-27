import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppChrome } from '@/components/shell/AppChrome';
import { THEME_INIT_SCRIPT } from '@/lib/theme-script';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const BASE_URL = 'https://vyooom.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'VYOOOM — Free Online PDF, Image, Text Tools & Calculators',
    template: '%s | VYOOOM',
  },
  description:
    'Free online tools for PDFs, images and text, plus EMI, SIP, GST and age calculators. Everything runs in your browser — no sign-up, no upload.',
  keywords: [
    'online tools', 'free online tools', 'pdf tools', 'merge pdf', 'image compressor', 'resize image',
    'emi calculator', 'word counter', 'no upload', 'browser tools', 'vyooom',
  ],
  authors: [{ name: 'VYOOOM' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'VYOOOM',
    title: 'VYOOOM — Free Online PDF, Image, Text Tools & Calculators',
    description: 'Free online tools for PDFs, images, text and everyday calculations — entirely in your browser.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VYOOOM — Free Online PDF, Image, Text Tools & Calculators',
    description: 'Free tools for PDFs, images, text and calculations. No account, no upload, no watermarks.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // No site-wide canonical here: it would be inherited by every page and mark
  // them all as duplicates of the home page. Tool pages set their own.
  // The old Search Console token belonged to the previous domain. Set
  // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token Google gives for vyooom.com.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0e0d' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <Providers>
          {children}
          {/* Room for the floating dock so it never covers the end of a page. */}
          <div aria-hidden="true" className="h-[calc(7rem+env(safe-area-inset-bottom,0px))] print:hidden" />
          <AppChrome />
        </Providers>
      </body>
    </html>
  );
}
