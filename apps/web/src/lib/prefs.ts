'use client';

/**
 * Tiny localStorage-backed stores (no dependencies):
 *  - prefs: recently used tools and pinned (favourite) tools
 *  - theme: 'light' | 'dark' | 'system'
 *  - ui:    which overlay is open (command palette / dock menu)
 *
 * Built on useSyncExternalStore so the server render and the first client
 * render agree (empty lists, system theme) and the stored values appear right
 * after hydration without a mismatch warning.
 */
import { useSyncExternalStore } from 'react';
import { THEME_KEY } from './theme-script';

function createStore<T>(initial: T, load?: () => T, persist?: (v: T) => void) {
  let state = initial;
  let loaded = !load;
  const listeners = new Set<() => void>();
  const ensure = () => {
    if (!loaded && typeof window !== 'undefined') { loaded = true; try { state = load!(); } catch { /* keep initial */ } }
  };
  return {
    get: () => { ensure(); return state; },
    set(next: T | ((prev: T) => T)) {
      ensure();
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      try { persist?.(state); } catch { /* storage full or blocked */ }
      listeners.forEach(l => l());
    },
    reload() { if (load) { loaded = false; ensure(); listeners.forEach(l => l()); } },
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    initial,
  };
}

function useStore<T>(store: ReturnType<typeof createStore<T>>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}

// ── Recent + favourite tools ────────────────────────────────────────────────

export interface Prefs { recent: string[]; favorites: string[] }
const PREFS_KEY = 'vyooom:prefs:v1';
const MAX_RECENT = 8;
const EMPTY: Prefs = { recent: [], favorites: [] };
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const prefsStore = createStore<Prefs>(
  EMPTY,
  () => {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return { recent: strings(raw.recent).slice(0, MAX_RECENT), favorites: strings(raw.favorites) };
  },
  v => localStorage.setItem(PREFS_KEY, JSON.stringify(v)),
);

if (typeof window !== 'undefined') {
  // Keep tabs in sync.
  window.addEventListener('storage', e => { if (e.key === PREFS_KEY) prefsStore.reload(); });
}

export const usePrefs = () => useStore(prefsStore);

export function recordVisit(slug: string) {
  prefsStore.set(p => (p.recent[0] === slug ? p : { ...p, recent: [slug, ...p.recent.filter(s => s !== slug)].slice(0, MAX_RECENT) }));
}

export function toggleFavorite(slug: string) {
  prefsStore.set(p => ({
    ...p,
    favorites: p.favorites.includes(slug) ? p.favorites.filter(s => s !== slug) : [...p.favorites, slug],
  }));
}

export function clearRecent() {
  prefsStore.set(p => ({ ...p, recent: [] }));
}

// ── Theme ───────────────────────────────────────────────────────────────────

export type ThemeChoice = 'light' | 'dark' | 'system';

const themeStore = createStore<ThemeChoice>(
  'system',
  () => {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  },
  v => { if (v === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, v); },
);

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(choice: ThemeChoice) {
  const dark = choice === 'dark' || (choice === 'system' && systemDark());
  document.documentElement.classList.toggle('dark', dark);
}

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeStore.get() === 'system') applyTheme('system');
  });
}

export const useThemeChoice = () => useStore(themeStore);

export function setTheme(choice: ThemeChoice) {
  themeStore.set(choice);
  applyTheme(choice);
}

/** Flip between light and dark based on what is currently shown. */
export function toggleTheme() {
  setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
}

// ── Overlays ────────────────────────────────────────────────────────────────

export type Overlay = 'palette' | 'menu' | null;
const overlayStore = createStore<Overlay>(null);
export const useOverlay = () => useStore(overlayStore);
export const openOverlay = (o: Overlay) => overlayStore.set(o);
export const closeOverlay = () => overlayStore.set(null);
export const toggleOverlay = (o: Exclude<Overlay, null>) => overlayStore.set(cur => (cur === o ? null : o));
