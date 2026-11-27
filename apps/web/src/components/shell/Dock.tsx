'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { House, LayoutGrid, Moon, Search, Star, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, getTool, popularTools, searchTools, TOOLS, type CategoryId, type Tool } from '@/lib/tools';
import { closeOverlay, openOverlay, toggleOverlay, toggleTheme, useOverlay, usePrefs } from '@/lib/prefs';
import { useModKey } from './controls';

/** How many tool shortcuts the dock shows (phones show the first 3). */
const SLOTS = 5;
const MOBILE_SLOTS = 3;

/**
 * Floating bottom dock, on every page.
 * Shortcuts = pinned tools, then recently used, then popular — so it fills up
 * with "your" tools as you use the site. The current tool is always present
 * and highlighted. "All tools" opens a categorised menu above the dock.
 */
export function Dock() {
  const pathname = usePathname();
  const overlay = useOverlay();
  const { recent, favorites } = usePrefs();
  const mod = useModKey();
  const current = getTool(pathname.replace(/^\//, ''));

  const slots = useMemo(() => {
    const seen = new Set<string>();
    const out: Tool[] = [];
    const add = (t: Tool | undefined) => { if (t && !seen.has(t.slug)) { seen.add(t.slug); out.push(t); } };
    favorites.forEach(s => add(getTool(s)));
    recent.forEach(s => add(getTool(s)));
    popularTools().forEach(add);
    let list = out.slice(0, SLOTS);
    // Keep the current tool visible without reshuffling the others.
    if (current && !list.some(t => t.slug === current.slug)) list = [current, ...list.slice(0, SLOTS - 1)];
    // On phones only the first MOBILE_SLOTS show, so make sure the current tool is among them.
    const ci = current ? list.findIndex(t => t.slug === current.slug) : -1;
    if (ci >= MOBILE_SLOTS) list = [list[ci], ...list.filter((_, i) => i !== ci)];
    return list;
  }, [favorites, recent, current]);

  // Close the menu when navigating.
  useEffect(() => { closeOverlay(); }, [pathname]);

  return (
    <>
      {overlay === 'menu' && <DockMenu currentSlug={current?.slug} />}
      <nav aria-label="Quick tool access" className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-3 pointer-events-none print:hidden">
        <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 rounded-2xl border border-slate-200 bg-white/85 backdrop-blur-xl backdrop-saturate-150 shadow-dock p-1.5">
          <DockLink href="/" label="Home" icon={House} active={pathname === '/'} />
          <Divider />
          {slots.map((t, i) => (
            <DockLink
              key={t.slug} href={`/${t.slug}`} label={t.name} icon={t.icon}
              active={current?.slug === t.slug} pinned={favorites.includes(t.slug)}
              className={i >= MOBILE_SLOTS ? 'hidden sm:flex' : undefined}
            />
          ))}
          <Divider />
          <DockButton label="All tools" icon={LayoutGrid} active={overlay === 'menu'} onClick={() => toggleOverlay('menu')} expanded={overlay === 'menu'} />
          <DockButton label={`Search (${mod} K)`} icon={Search} onClick={() => openOverlay('palette')} />
          <DockButton label="Light / dark theme" icon={Moon} iconDark={Sun} onClick={toggleTheme} className="hidden sm:flex" />
        </div>
      </nav>
    </>
  );
}

function Divider() {
  return <span className="w-px h-6 bg-slate-200 mx-0.5 sm:mx-1" aria-hidden="true" />;
}

const itemCls = (active?: boolean) => cn(
  'group relative flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-150',
  active ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
);

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 translate-y-1 transition-all duration-150 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0"
    >
      {label}
    </span>
  );
}

function DockLink({ href, label, icon: Icon, active, pinned, className }: {
  href: string; label: string; icon: LucideIcon; active?: boolean; pinned?: boolean; className?: string;
}) {
  return (
    <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className={cn(itemCls(active), className)}>
      <Icon className="w-5 h-5" />
      {pinned && !active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />}
      <Tooltip label={pinned ? `${label} · pinned` : label} />
    </Link>
  );
}

function DockButton({ label, icon: Icon, iconDark: IconDark, onClick, active, expanded, className }: {
  label: string; icon: LucideIcon; iconDark?: LucideIcon; onClick: () => void; active?: boolean; expanded?: boolean; className?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-expanded={expanded} className={cn(itemCls(active), className)}>
      <Icon className={cn('w-5 h-5', IconDark && 'dark:hidden')} />
      {IconDark && <IconDark className="w-5 h-5 hidden dark:block" />}
      <Tooltip label={label} />
    </button>
  );
}

// ── "All tools" menu ────────────────────────────────────────────────────────

function DockMenu({ currentSlug }: { currentSlug?: string }) {
  const { favorites } = usePrefs();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on desktop only — on phones it would pop the keyboard over the menu.
  useEffect(() => { if (window.matchMedia('(hover: hover)').matches) inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const base = cat === 'all' ? TOOLS : TOOLS.filter(t => t.category === cat);
    return searchTools(query, base);
  }, [query, cat]);

  const grouped = query
    ? [{ id: 'results', label: `${results.length} result${results.length === 1 ? '' : 's'}`, tools: results }]
    : CATEGORIES.filter(c => cat === 'all' || c.id === cat).map(c => ({ id: c.id, label: c.label, tools: results.filter(t => t.category === c.id) }));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 animate-fade-in print:hidden" onClick={closeOverlay} aria-hidden="true" />
      <div
        role="dialog" aria-label="All tools"
        className="fixed z-50 left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(92px+env(safe-area-inset-bottom,0px))] w-[min(760px,calc(100vw-24px))] max-h-[min(72vh,640px)] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-pop-in print:hidden"
      >
        <div className="shrink-0 flex items-center gap-2 p-3 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Filter ${TOOLS.length} tools`} aria-label="Filter tools"
              className="w-full h-10 rounded-xl bg-slate-100 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
          <button type="button" onClick={closeOverlay} aria-label="Close menu" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="shrink-0 flex gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-100" role="tablist" aria-label="Categories">
          {([{ id: 'all', label: 'All' }, ...CATEGORIES] as { id: CategoryId | 'all'; label: string }[]).map(c => (
            <button
              key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
              className={cn(
                'shrink-0 h-8 px-3 rounded-lg text-sm font-medium transition-colors',
                cat === c.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-4">
          {results.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No tools match “{query}”.</p>}
          {grouped.filter(g => g.tools.length).map(g => (
            <section key={g.id}>
              <h3 className="px-1 mb-1.5 text-xs font-medium text-slate-400">{g.label}</h3>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {g.tools.map(t => {
                  const active = t.slug === currentSlug;
                  return (
                    <li key={t.slug}>
                      <Link
                        href={`/${t.slug}`} aria-current={active ? 'page' : undefined}
                        className={cn('flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors', active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-100')}
                      >
                        <t.icon className={cn('w-4 h-4 shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
                        <span className="truncate">{t.name}</span>
                        {favorites.includes(t.slug) && <Star className="w-3 h-3 ml-auto shrink-0 fill-brand-500 text-brand-500" aria-label="Pinned" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
