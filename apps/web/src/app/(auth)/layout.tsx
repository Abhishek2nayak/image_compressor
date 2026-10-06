import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/site';

export const metadata: Metadata = {
  // Gated/private area: never index, never follow into it.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Link href="/" className="text-2xl font-bold text-primary mb-8">{BRAND}</Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
