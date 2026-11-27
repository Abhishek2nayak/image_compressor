'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getTool } from '@/lib/tools';
import { closeOverlay, openOverlay, recordVisit, toggleOverlay } from '@/lib/prefs';
import { CommandPalette } from './CommandPalette';
import { Dock } from './Dock';

function isTyping(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node) return false;
  return node.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName);
}

/**
 * Site-wide client layer, mounted once in the root layout:
 * dock, command palette, keyboard shortcuts and "recently used" tracking.
 */
export function AppChrome() {
  const pathname = usePathname();

  useEffect(() => {
    const slug = pathname.replace(/^\//, '');
    if (getTool(slug)) recordVisit(slug);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); toggleOverlay('palette'); return; }
      if (e.key === 'Escape') { closeOverlay(); return; }
      if (isTyping(e.target) || mod || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); openOverlay('palette'); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Dock />
      <CommandPalette />
    </>
  );
}
