'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, getTool, toolsInCategory } from '@/lib/tools';
import { toggleFavorite, usePrefs } from '@/lib/prefs';

/** Category sections with tool cards. Search lives in the command palette (hero, header, ⌘K). */
export function ToolsDirectory() {
  const { favorites } = usePrefs();
  return (
    <div className="space-y-14">
      {CATEGORIES.map(c => {
        const tools = toolsInCategory(c.id);
        if (!tools.length) return null;
        return (
          <section key={c.id} id={c.id} aria-labelledby={`h-${c.id}`} className="scroll-mt-32">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <div>
                <h2 id={`h-${c.id}`} className="text-xl font-bold text-slate-900 tracking-tight">{c.label}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{c.blurb}</p>
              </div>
              <span className="text-sm text-slate-400 tabular-nums shrink-0">{tools.length} tools</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tools.map(t => <ToolCard key={t.slug} slug={t.slug} pinned={favorites.includes(t.slug)} />)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ToolCard({ slug, pinned }: { slug: string; pinned: boolean }) {
  const t = getTool(slug)!;
  return (
    <li className="relative group">
      <Link
        href={`/${t.slug}`}
        className="flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 pr-11 transition-all duration-150 hover:border-slate-300 hover:shadow-[0_4px_16px_-6px_rgb(0_0_0/0.12)] hover:-translate-y-px"
      >
        <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
          <t.icon className="w-5 h-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-[15px] text-slate-900 leading-snug">{t.name}</span>
          <span className="block text-[13px] text-slate-500 mt-0.5 leading-relaxed">{t.short}</span>
        </span>
      </Link>
      <button
        type="button" onClick={() => toggleFavorite(t.slug)} aria-pressed={pinned}
        aria-label={pinned ? `Unpin ${t.name}` : `Pin ${t.name} to your dock`}
        className={cn(
          'absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
          pinned ? 'text-brand-500 opacity-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <Star className={cn('w-4 h-4', pinned && 'fill-current')} />
      </button>
    </li>
  );
}
