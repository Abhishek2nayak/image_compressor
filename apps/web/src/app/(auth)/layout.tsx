import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthShowcase } from '@/components/auth/AuthShowcase';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = {
  // Gated/private area: never index, never follow into it.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/**
 * Split screen: the form on the left, the product showcase on the right.
 * Below lg the showcase is dropped and the form becomes a normal centred
 * column, so the page stays usable on a phone.
 *
 * The tracks are minmax(0,Nfr) rather than plain Nfr: a bare `fr` resolves to
 * minmax(auto, Nfr), so a wide piece of content in one column can refuse to
 * shrink and squeeze the other one down to nothing.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex flex-col min-w-0 min-h-screen lg:min-h-0 bg-white">
        <div className="flex items-center justify-between px-6 sm:px-10 py-6">
          <Link href="/" aria-label="My PDF Hub home">
            <Logo size={30} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to tools
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <AuthShowcase />
    </div>
  );
}
