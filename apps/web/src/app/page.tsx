import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Command, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { CATEGORIES, SISTER_SITES, TOOLS, toolsInCategory } from '@/lib/tools';
import { SiteFooter, SiteHeader } from '@/components/tool/ToolShell';
import { SearchTrigger } from '@/components/shell/controls';
import { ToolsDirectory } from '@/components/home/ToolsDirectory';
import { YourTools } from '@/components/home/YourTools';

export const metadata = {
  alternates: { canonical: '/' },
};

const VALUES = [
  { icon: ShieldCheck, title: 'Private by design', desc: 'Files and text are processed on your device. There is no server to upload to.' },
  { icon: Zap, title: 'Instant', desc: 'No upload queue and no waiting. Most results appear as you type.' },
  { icon: Sparkles, title: 'Free, no sign-up', desc: 'No account, no watermark and no daily limits.' },
  { icon: Command, title: 'Built for speed', desc: 'Press ⌘K or / anywhere to jump to a tool. Pin favourites to your dock.' },
];

const FAQS = [
  { q: 'Are my files uploaded to a server?', a: 'No. All processing happens in your browser using JavaScript, the Canvas API and WebAssembly. Your files and text never leave your device — nothing is uploaded or stored.' },
  { q: 'Is VYOOOM really free?', a: 'Yes. Every tool is free to use with no account, no watermark and no daily limit.' },
  { q: 'How do I find a tool quickly?', a: 'Press Ctrl + K (⌘ + K on Mac) or the / key on any page and start typing. Tools you pin with the star, and tools you use often, appear in the dock at the bottom of the screen.' },
  { q: 'Do the tools work offline?', a: 'Once a tool page has loaded, most tools keep working even if your connection drops, because the work happens on your device.' },
];

export default function HomePage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'WebSite', name: 'VYOOOM', url: 'https://vyooom.com',
      description: 'Free online tools for PDFs, images, text and everyday calculations — all in your browser.',
    },
    {
      '@context': 'https://schema.org', '@type': 'Organization', name: 'VYOOOM', url: 'https://vyooom.com',
      logo: 'https://vyooom.com/icon-512.png',
    },
    {
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: TOOLS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `https://vyooom.com/${t.slug}` })),
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative isolate overflow-hidden">
          {/* quiet grid texture that fades out — no gradients or glows */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 [background-image:linear-gradient(rgb(var(--n-200)/0.7)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--n-200)/0.7)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-24 pb-14 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {TOOLS.length} free tools · nothing leaves your device
            </p>
            <h1 className="mt-7 text-[40px] leading-[1.05] sm:text-6xl sm:leading-[1.02] font-extrabold tracking-[-0.035em] text-slate-900">
              Everyday tools for<br className="hidden sm:block" /> daily hustlers.
            </h1>
            <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              PDFs, images, text and calculators — fast, free and private, running entirely in your browser.
            </p>
            <div className="mt-9 max-w-xl mx-auto">
              <SearchTrigger size="lg" />
            </div>
            <div className="mt-5 min-h-9">
              <YourTools />
            </div>
          </div>
        </section>

        {/* ── Category jump bar ── */}
        <nav aria-label="Tool categories" className="sticky top-14 z-30 border-y border-slate-200/70 bg-slate-50/85 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none py-2">
            {CATEGORIES.map(c => (
              <a key={c.id} href={`#${c.id}`} className="shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white transition-colors">
                {c.label}
                <span className="text-xs text-slate-400 tabular-nums">{toolsInCategory(c.id).length}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* ── Tools ── */}
        <section id="tools" className="max-w-6xl mx-auto px-4 pt-12 scroll-mt-28">
          <ToolsDirectory />
        </section>

        {/* ── Why ── */}
        <section className="max-w-6xl mx-auto px-4 mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
            {VALUES.map(v => (
              <div key={v.title} className="bg-white p-6">
                <v.icon className="w-5 h-5 text-brand-600" />
                <h3 className="mt-4 font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sister sites ── */}
        <section className="max-w-6xl mx-auto px-4 mt-16">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">Also from us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SISTER_SITES.map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener"
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
                <span>
                  <span className="block font-semibold text-slate-900">{s.name}</span>
                  <span className="block text-sm text-slate-500 mt-0.5">{s.short}</span>
                </span>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-4 mt-24">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6 text-center">Questions</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map(f => (
              <details key={f.q} className="group">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Can’t find what you need? <Link href="#tools" className="font-medium text-brand-700 hover:underline underline-offset-2">Browse every tool</Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
