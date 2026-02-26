import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = 'https://imagepress.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ImagePress — Free Online Image Compressor',
    template: '%s | ImagePress',
  },
  description:
    'Compress JPEG, PNG, WebP and AVIF images online for free. Reduce file size by up to 80% without visible quality loss. No sign-up required.',
  keywords: [
    'image compressor', 'compress images online', 'reduce image size', 'jpg compressor',
    'png compressor', 'webp compressor', 'avif compressor', 'free image compression',
    'compress jpeg online', 'reduce png file size', 'image optimizer',
  ],
  authors: [{ name: 'ImagePress' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'ImagePress',
    title: 'ImagePress — Free Online Image Compressor',
    description:
      'Compress JPEG, PNG, WebP and AVIF images online for free. Reduce file size by up to 80% without visible quality loss.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ImagePress — Free Online Image Compressor',
    description: 'Compress JPEG, PNG, WebP and AVIF images online for free. Up to 80% smaller files.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: BASE_URL },
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
