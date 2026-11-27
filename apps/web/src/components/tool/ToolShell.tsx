import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { CATEGORIES, SISTER_SITES, getCategory, relatedTools, toolsInCategory, type Tool } from '@/lib/tools';
import { Logo } from '@/components/shell/Logo';
import { toolContent } from '@/content/tool-content';
import { FavoriteButton, SearchTrigger, ThemeToggle } from '@/components/shell/controls';

const BASE_URL = 'https://vyooom.com';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Logo />
        <nav aria-label="Categories" className="hidden lg:flex items-center gap-1 ml-4 text-sm">
          {CATEGORIES.map(c => (
            <Link key={c.id} href={`/#${c.id}`} className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              {c.label.replace(' Tools', '').replace('Everyday ', '')}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchTrigger className="hidden sm:flex w-56" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-slate-200 print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">Everyday tools that run in your browser. Nothing is uploaded.</p>
        </div>
        {CATEGORIES.map(c => (
          <div key={c.id}>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">{c.label}</h2>
            <ul className="space-y-2 text-sm">
              {toolsInCategory(c.id).slice(0, 6).map(t => (
                <li key={t.slug}><Link href={`/${t.slug}`} className="text-slate-500 hover:text-slate-900 transition-colors">{t.name}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} VYOOOM · Free, private, no sign-up</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            Also from us:
            {SISTER_SITES.map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 text-slate-600 hover:text-slate-900">
                {s.name}<ArrowUpRight className="w-3 h-3" />
              </a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function ToolShell({ tool, children }: { tool: Tool; children: ReactNode }) {
  const category = getCategory(tool.category);
  const related = relatedTools(tool, 6);
  const url = `${BASE_URL}/${tool.slug}`;
  const article = toolContent(tool.slug);
  const faqs = [...(tool.faqs ?? []), ...(article?.faqs ?? [])].filter((f, i, all) => all.findIndex(g => g.q === f.q) === i);

  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      url,
      description: tool.description,
      applicationCategory: tool.category === 'calculator' ? 'FinanceApplication' : 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: category.label, item: `${BASE_URL}/#${category.id}` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: url },
      ],
    },
  ];
  if (faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-400 mb-5">
          <Link href="/" className="hover:text-slate-700">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/#${category.id}`} className="hover:text-slate-700">{category.label}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600" aria-current="page">{tool.name}</span>
        </nav>

        <div className="mb-7 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <span className="hidden sm:flex w-12 h-12 rounded-2xl bg-white border border-slate-200 items-center justify-center shrink-0 text-brand-600 shadow-sm">
              <tool.icon className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-[28px] md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{tool.name}</h1>
              <p className="text-slate-500 mt-1.5 max-w-2xl leading-relaxed">{tool.description}</p>
            </div>
          </div>
          <FavoriteButton slug={tool.slug} name={tool.name} className="self-start shrink-0" />
        </div>

        {children}

        <p className="mt-5 flex items-start gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 mt-px shrink-0 text-emerald-600" />
          {tool.privacyNote ?? 'Runs entirely in your browser. Nothing you add is uploaded or stored.'}
        </p>

        {article && (
          <section className="mt-16 max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{article.heading}</h2>
            <div className="space-y-4 text-[15px] text-slate-600 leading-relaxed">
              {article.intro.map(p => <p key={p}>{p}</p>)}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-8 mb-4">How to use it</h3>
            <ol className="space-y-4">
              {article.steps.map((step, i) => (
                <li key={step.title} className="flex gap-3.5">
                  <span aria-hidden="true" className="shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900">{step.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <h3 className="text-base font-bold text-slate-900 mt-8 mb-3">Limits</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600 leading-relaxed">
              {article.limits.map(l => <li key={l}>{l}</li>)}
            </ul>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map(f => (
                <details key={f.q} className="group">
                  <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none font-medium text-[15px] text-slate-800 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 -mt-1 text-sm text-slate-600 leading-relaxed max-w-3xl">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-slate-900 mb-4">More in {category.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map(t => (
                <Link key={t.slug} href={`/${t.slug}`}
                  className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all">
                  <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:text-brand-600 flex items-center justify-center shrink-0 transition-colors">
                    <t.icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-sm text-slate-900">{t.name}</span>
                    <span className="block text-xs text-slate-500 truncate">{t.short}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
