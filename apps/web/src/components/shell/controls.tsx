'use client';

import { useEffect, useState } from 'react';
import { Moon, Search, Star, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openOverlay, toggleFavorite, toggleTheme, usePrefs } from '@/lib/prefs';

/** "⌘" on Apple devices, "Ctrl" elsewhere. Resolved after mount to avoid a hydration mismatch. */
export function useModKey() {
  const [mod, setMod] = useState('Ctrl');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod('⌘');
  }, []);
  return mod;
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn('inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-md border border-slate-200 bg-slate-50 font-sans text-[11px] font-medium text-slate-500', className)}>
      {children}
    </kbd>
  );
}

/** Sun/moon button. Icons swap with CSS so the first paint is already correct. */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button" onClick={toggleTheme} aria-label="Switch between light and dark theme"
      className={cn('w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors', className)}
    >
      <Moon className="w-[18px] h-[18px] dark:hidden" />
      <Sun className="w-[18px] h-[18px] hidden dark:block" />
    </button>
  );
}

/** Looks like a search field; opens the command palette. */
export function SearchTrigger({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const mod = useModKey();
  return (
    <button
      type="button" onClick={() => openOverlay('palette')} aria-label="Search tools"
      className={cn(
        'group flex items-center gap-2.5 w-full rounded-xl border border-slate-200 bg-white text-left text-slate-400 hover:border-slate-300 transition-colors',
        size === 'lg' ? 'h-14 px-5 text-base shadow-sm' : 'h-9 px-3 text-sm',
        className,
      )}
    >
      <Search className={cn('shrink-0 text-slate-400 group-hover:text-slate-600', size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
      <span className="flex-1 truncate">{size === 'lg' ? 'Search tools — “merge pdf”, “emi”, “resize”…' : 'Search tools…'}</span>
      <span className="hidden sm:flex items-center gap-1"><Kbd>{mod}</Kbd><Kbd>K</Kbd></span>
    </button>
  );
}

export function FavoriteButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { favorites } = usePrefs();
  const on = favorites.includes(slug);
  return (
    <button
      type="button" onClick={() => toggleFavorite(slug)} aria-pressed={on}
      aria-label={on ? `Unpin ${name}` : `Pin ${name} to your dock`}
      title={on ? 'Pinned to your dock — click to unpin' : 'Pin to your dock'}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors',
        on ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300',
        className,
      )}
    >
      <Star className={cn('w-4 h-4 transition-transform', on && 'fill-current scale-110')} />
      {on ? 'Pinned' : 'Pin'}
    </button>
  );
}
