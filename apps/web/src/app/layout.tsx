import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = 'https://easypdfstudio.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Easy PDF Studio — Free Online Image & PDF Tools",
    template: "%s | Easy PDF Studio",
  },
  description:
    "Free online tools for images and PDFs. Compress JPEG, PNG, WebP and AVIF files by up to 80% without visible quality loss. No sign-up required.",
  keywords: [
    "image compressor",
    "compress images online",
    "reduce image size",
    "jpg compressor",
    "png compressor",
    "webp compressor",
    "avif compressor",
    "free image compression",
    "compress jpeg online",
    "reduce png file size",
    "image optimizer",
    "pdf tools",
    "easy pdf studio",
  ],
  authors: [{ name: "Easy PDF Studio" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Easy PDF Studio",
    title: "Easy PDF Studio — Free Online Image & PDF Tools",
    description:
      "Free online tools for images and PDFs. Compress JPEG, PNG, WebP and AVIF files without quality loss.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Easy PDF Studio — Free Online Image & PDF Tools",
    description:
      "Compress images and work with PDFs online. Free, fast, no sign-up required.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: BASE_URL },
  verification: {
    google: "nxkzM0PDGBbgXmWRyanSikl_1qlUeK6JbI2eTOUgGfU", // Optional: Add your Google Search Console verification code
  },
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
