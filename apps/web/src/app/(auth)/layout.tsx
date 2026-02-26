import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Link href="/" className="text-2xl font-bold text-primary mb-8">ImagePress</Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
