'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { CornerDownLeft, House, Moon, Search, Star, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, getTool, searchTools, TOOLS, type Tool } from '@/lib/tools';
import { closeOverlay, toggleTheme, useOverlay, usePrefs } from '@/lib/prefs';
import { Kbd, useModKey } from './controls';

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  run: () => void;
  starred?: boolean;
}

const MAX_RECENT = 4;

export function CommandPalette() {
  const open = useOverlay() === 'palette';
  if (!open) return null;
  return <Palette />;
}

function Palette() {
  const router = useRouter();
  const mod = useModKey();
  const { recent, favorites } = usePrefs();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Lock page scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const items = useMemo<Item[]>(() => {
    const go = (t: Tool) => () => { closeOverlay(); router.push(`/${t.slug}`); };
    const toolItem = (t: Tool, group: string): Item => ({
      id: `${group}:${t.slug}`, label: t.name, hint: t.short, icon: t.icon, group, run: go(t), starred: favorites.includes(t.slug),
    });
    const actions: Item[] = [
      { id: 'a:home', label: 'Go to home page', icon: House, group: 'Actions', run: () => { closeOverlay(); router.push('/'); } },
      { id: 'a:theme', label: 'Switch light / dark theme', icon: Moon, group: 'Actions', run: () => { toggleTheme(); closeOverlay(); } },
    ];

    const q = query.trim().toLowerCase();
    if (q) {
      const matches = searchTools(q).map(t => toolItem(t, 'Tools'));
      const acts = actions.filter(a => a.label.toLowerCase().includes(q) || (q.includes('dark') || q.includes('light') || q.includes('theme') ? a.id === 'a:theme' : false));
      return [...matches, ...acts];
    }

    const pinned = favorites.map(getTool).filter((t): t is Tool => !!t);
    const recents = recent.map(getTool).filter((t): t is Tool => !!t && !favorites.includes(t.slug)).slice(0, MAX_RECENT);
    const list: Item[] = [
      ...pinned.map(t => toolItem(t, 'Pinned')),
      ...recents.map(t => toolItem(t, 'Recent')),
    ];
    for (const c of CATEGORIES) {
      for (const t of TOOLS) if (t.category === c.id) list.push(toolItem(t, c.label));
    }
    list.push(...actions);
    return list;
  }, [query, recent, favorites, router]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % Math.max(items.length, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + items.length) % Math.max(items.length, 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); }
  }

  let lastGroup = '';
  const groupIcon = (g: string) => (g === 'Pinned' ? Star : g === 'Recent' ? History : null);

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-start px-3 pt-[10vh] sm:pt-[14vh]" role="presentation">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in" onClick={closeOverlay} aria-hidden="true" />
      <div
        role="dialog" aria-modal="true" aria-label="Search tools"
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl animate-pop-in overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search tools or actions…" aria-label="Search tools or actions"
            role="combobox" aria-expanded="true" aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-${active}` : undefined}
            className="flex-1 h-14 bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div ref={listRef} id="palette-list" role="listbox" aria-label="Results" className="max-h-[min(60vh,460px)] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-slate-500">No tools match “{query}”.</p>
          )}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const GIcon = header ? groupIcon(header) : null;
            const isActive = i === active;
            return (
              <div key={item.id}>
                {header && (
                  <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5 text-xs font-medium text-slate-400">
                    {GIcon && <GIcon className="w-3.5 h-3.5" />}{header}
                  </div>
                )}
                <div
                  id={`palette-${i}`} data-index={i} role="option" aria-selected={isActive}
                  onMouseMove={() => { if (!isActive) setActive(i); }} onClick={item.run}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer', isActive ? 'bg-slate-100' : '')}
                >
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', isActive ? 'bg-white border-slate-200 text-brand-600' : 'bg-slate-50 border-slate-100 text-slate-500')}>
                    <item.icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      {item.label}
                      {item.starred && item.group !== 'Pinned' && <Star className="w-3 h-3 fill-brand-500 text-brand-500" aria-label="Pinned" />}
                    </span>
                    {item.hint && <span className="block text-xs text-slate-500 truncate">{item.hint}</span>}
                  </span>
                  {isActive && <CornerDownLeft className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="flex items-center gap-1 ml-auto"><Kbd>{mod}</Kbd><Kbd>K</Kbd> or <Kbd>/</Kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
}

