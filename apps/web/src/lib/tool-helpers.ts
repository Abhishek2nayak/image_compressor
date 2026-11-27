'use client';

import { useEffect, useMemo, useState } from 'react';

/** True after the first client render. Use it to avoid hydration mismatches
 *  for anything that depends on time, randomness, locale or browser APIs. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Number formatting that is identical on server and first client render
 * (en-US), then switches to the visitor's locale after hydration.
 */
export function useNumberFormat() {
  const mounted = useMounted();
  return useMemo(() => {
    const locale = mounted ? navigator.language || 'en-US' : 'en-US';
    const cache = new Map<number, Intl.NumberFormat>();
    const fmt = (n: number, maxDigits = 2) => {
      if (!Number.isFinite(n)) return '—';
      let f = cache.get(maxDigits);
      if (!f) {
        f = new Intl.NumberFormat(locale, { maximumFractionDigits: maxDigits });
        cache.set(maxDigits, f);
      }
      return f.format(n);
    };
    return { fmt, money: (n: number) => fmt(Math.round(n), 0) };
  }, [mounted]);
}

/** Parse a user-typed number; returns NaN for empty/invalid input. */
export function num(v: string): number {
  if (v.trim() === '') return NaN;
  return Number(v.replace(/,/g, ''));
}

export function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse "YYYY-MM-DD" from <input type="date"> as a local date (not UTC). */
export function parseDateInput(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Whole calendar days between two local dates (DST-safe). */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86_400_000);
}

/** Calendar difference as years / months / days (from ≤ to). */
export function ymdDiff(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); // days in previous month
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { years: y, months: m, days: d };
}
