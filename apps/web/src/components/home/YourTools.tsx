'use client';

import Link from 'next/link';
import { History, Star } from 'lucide-react';
import { getTool, popularTools, type Tool } from '@/lib/tools';
import { clearRecent, usePrefs } from '@/lib/prefs';

function Chip({ t }: { t: Tool }) {
  return (
    <Link
      href={`/${t.slug}`}
      className="inline-flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors"
    >
      <t.icon className="w-4 h-4 text-slate-400" />
      {t.name}
    </Link>
  );
}

/**
 * First visit: "Popular" chips. Returning visitors: their pinned and recent
 * tools instead, so the thing they came for is one click away.
 */
export function YourTools() {
  const { recent, favorites } = usePrefs();
  const pinned = favorites.map(getTool).filter((t): t is Tool => !!t);
  const recents = recent.map(getTool).filter((t): t is Tool => !!t && !favorites.includes(t.slug)).slice(0, 6);

  if (!pinned.length && !recents.length) {
    return (
      <div className="flex flex-wrap justify-center items-center gap-2">
        <span className="text-sm text-slate-400 mr-1">Popular:</span>
        {popularTools().slice(0, 5).map(t => <Chip key={t.slug} t={t} />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {pinned.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-slate-400 mr-1"><Star className="w-3.5 h-3.5" />Pinned</span>
          {pinned.map(t => <Chip key={t.slug} t={t} />)}
        </div>
      )}
      {recents.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-slate-400 mr-1"><History className="w-3.5 h-3.5" />Recent</span>
          {recents.map(t => <Chip key={t.slug} t={t} />)}
          <button type="button" onClick={clearRecent} className="text-xs text-slate-400 hover:text-slate-700 underline-offset-2 hover:underline ml-1">Clear</button>
        </div>
      )}
    </div>
  );
}
