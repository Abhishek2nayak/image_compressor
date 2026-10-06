import type { Metadata } from 'next';

export const metadata: Metadata = {
  // OAuth callback plumbing — must never be indexed.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
