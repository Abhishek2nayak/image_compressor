'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Divider,
  GoogleButton,
  fieldClass,
  labelClass,
  submitClass,
} from '@/components/auth/GoogleButton';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-black text-blue-950 mb-1.5">Welcome back</h1>
      <p className="text-slate-500 text-sm mb-7">
        Sign in to raise your compressor limits and manage API keys.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={fieldClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={fieldClass}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className={submitClass}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Sign in
        </button>
      </form>

      <Divider />
      <GoogleButton label="Continue with Google" />

      <p className="text-center text-sm text-slate-500 mt-7">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-red-500 hover:underline font-semibold">
          Sign up free
        </Link>
      </p>
    </>
  );
}
