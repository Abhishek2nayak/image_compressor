'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Check, Zap, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    price: { monthly: '$0', annual: '$0' },
    description: 'Perfect for personal projects and occasional use.',
    features: [
      '10 images per day',
      '25 MB max file size',
      'JPEG, PNG, WebP, AVIF',
      'Quality slider (1–100)',
      'API access (20 req / hr)',
      'Files deleted after 24h',
    ],
    cta: 'Get started free',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: { monthly: '$12', annual: '$9' },
    description: 'For professionals, teams, and high-volume workflows.',
    features: [
      '500 images per day',
      '25 MB max file size',
      'All formats supported',
      'Batch processing + ZIP',
      'API access (500 req / hr)',
      'Full compression history',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    href: null,
    highlight: true,
  },
];

const FAQ_PRICING = [
  { q: 'Can I cancel my subscription at any time?', a: 'Yes — cancel anytime from your billing portal. Your Pro access continues until the end of the current billing period.' },
  { q: 'What happens to my data when I cancel?', a: 'Your account and compression history are preserved. You simply revert to the Free plan limits.' },
  { q: 'Do you offer refunds?', a: 'Yes. If you are not satisfied within the first 7 days of a new subscription, contact us for a full refund.' },
  { q: 'Is there a free trial for Pro?', a: 'The Free plan lets you evaluate the core compression quality with no time limit. Upgrade only when you need higher volume or API access.' },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [annual, setAnnual]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleUpgrade() {
    if (!session) return;
    setLoading(true);
    try {
      const res = await api.post('/api/v1/billing/checkout');
      window.location.href = res.data.data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between" style={{ height: '3.75rem' }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">ImagePress</span>
          </Link>
          <div className="flex items-center gap-2.5 text-sm">
            {session ? (
              <Link href="/dashboard" className="border border-slate-200 rounded-lg px-3.5 py-1.5 font-semibold hover:bg-slate-50 transition-colors text-slate-700">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login"    className="font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Sign in</Link>
                <Link href="/register" className="bg-indigo-600 text-white rounded-lg px-4 py-1.5 font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="relative overflow-hidden py-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-indigo-100/40 via-violet-100/40 to-purple-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-slate-500 mb-8">
              Start free. Upgrade only when you need more volume or API access.
            </p>
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setAnnual(false)}
                className={cn('px-4 py-1.5 rounded-lg text-sm font-bold transition-all', !annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn('px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5', annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
              >
                Annual
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">−25%</span>
              </button>
            </div>
          </div>
        </section>

        {/* Plan cards */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {PLANS.map(plan => (
                <div
                  key={plan.name}
                  className={cn(
                    'rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md',
                    plan.highlight && 'border-indigo-300 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-100',
                  )}
                >
                  {plan.highlight && (
                    <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold mb-4 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 w-fit">
                      <Zap className="w-3 h-3" /> Most popular
                    </div>
                  )}
                  <h2 className="text-xl font-black text-slate-900">{plan.name}</h2>
                  <p className="text-sm text-slate-500 mt-1 mb-5">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-7">
                    <span className="text-5xl font-black text-slate-900">
                      {annual ? plan.price.annual : plan.price.monthly}
                    </span>
                    {plan.name !== 'Free' && (
                      <span className="text-slate-400 text-sm font-medium">/ month{annual ? ', billed annually' : ''}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.highlight ? (
                    session ? (
                      <button
                        onClick={handleUpgrade} disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-3.5 font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        {plan.cta}
                      </button>
                    ) : (
                      <Link href="/register" className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white rounded-xl py-3.5 font-bold text-center hover:bg-indigo-700 transition-colors shadow-sm">
                        <ArrowRight className="w-4 h-4" /> {plan.cta}
                      </Link>
                    )
                  ) : (
                    <Link href={plan.href ?? '/register'} className="flex items-center justify-center gap-2 w-full border border-slate-200 rounded-xl py-3.5 font-bold text-center hover:bg-slate-50 transition-colors text-slate-700">
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-400 mt-6">
              No credit card required for Free plan · Cancel Pro anytime · 7-day money-back guarantee
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">Pricing questions</h2>
            <div className="space-y-2.5">
              {FAQ_PRICING.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-slate-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-bold text-slate-800 text-sm">{faq.q}</span>
                    <span className={cn('text-slate-400 text-lg leading-none transition-transform duration-200 shrink-0', openFaq === i && 'rotate-45')}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white">ImagePress</span>
          </Link>
          <div className="flex gap-6">
            <Link href="/"      className="hover:text-white transition-colors">Compress</Link>
            <Link href="/docs"  className="hover:text-white transition-colors">API Docs</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <span className="text-xs">© {new Date().getFullYear()} ImagePress</span>
        </div>
      </footer>

    </div>
  );
}
