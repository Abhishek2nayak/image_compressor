'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import {
  Divider,
  GoogleButton,
  fieldClass,
  labelClass,
  submitClass,
} from '@/components/auth/GoogleButton';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', form);
      // Auto login after register
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-black text-blue-950 mb-1.5">Create an account</h1>
      <p className="text-slate-500 text-sm mb-7">
        Free. It raises your daily limit on the two compressors — every other
        tool already works without signing in.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className={fieldClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
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
            autoComplete="new-password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            required
            minLength={8}
            className={fieldClass}
            placeholder="Min. 8 characters"
          />
        </div>
        <button type="submit" disabled={loading} className={submitClass}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Create account
        </button>
      </form>

      <Divider />
      <GoogleButton label="Continue with Google" />

      <p className="text-center text-sm text-slate-500 mt-7">
        Already have an account?{' '}
        <Link href="/login" className="text-red-500 hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </>
  );
}
