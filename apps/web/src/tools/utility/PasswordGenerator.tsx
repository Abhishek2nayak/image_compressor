'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Checkbox, CopyButton, Panel, SliderField } from '@/components/tool/ui';
import { cn } from '@/lib/utils';

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};
const AMBIGUOUS = /[Il1O0o|`'"]/g;

/** Unbiased random integer in [0, max) using rejection sampling. */
function randInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % max;
}

function generate(length: number, sets: string[]): string {
  const pool = sets.join('');
  // At least one character from every selected set, then fill and shuffle.
  const chars = sets.map(s => s[randInt(s.length)]);
  while (chars.length < length) chars.push(pool[randInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join('');
}

function strength(bits: number) {
  if (bits < 40) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600', pct: 20 };
  if (bits < 60) return { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-600', pct: 45 };
  if (bits < 80) return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', pct: 72 };
  return { label: 'Very strong', color: 'bg-emerald-600', text: 'text-emerald-700', pct: 100 };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState('16');
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const len = Math.min(128, Math.max(4, Math.floor(Number(length)) || 16));
  const sets = useMemo(
    () => (Object.keys(SETS) as (keyof typeof SETS)[]).filter(k => opts[k]).map(k => (noAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k])),
    [opts, noAmbiguous],
  );
  const poolSize = sets.join('').length;
  const bits = poolSize ? len * Math.log2(poolSize) : 0;
  const s = strength(bits);

  const regen = useCallback(() => {
    if (!sets.length) { setPassword(''); return; }
    const p = generate(len, sets);
    setPassword(p);
    setHistory(h => [p, ...h].slice(0, 5));
  }, [len, sets]);

  useEffect(regen, [regen]);

  const toggle = (k: keyof typeof opts) => (v: boolean) => {
    const next = { ...opts, [k]: v };
    if (Object.values(next).some(Boolean)) setOpts(next); // keep at least one set
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-4">
        <Panel>
          <div className="font-mono text-xl md:text-2xl text-slate-900 break-all min-h-[2.5rem] select-all" aria-live="polite">{password}</div>
          <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={cn('h-full transition-all', s.color)} style={{ width: `${s.pct}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <span className={cn('text-sm font-bold', s.text)}>{s.label} <span className="font-normal text-slate-400">· ~{Math.round(bits)} bits of entropy</span></span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={regen}><RefreshCw className="w-4 h-4" /> New</Button>
              <CopyButton text={password} variant="primary" />
            </div>
          </div>
        </Panel>
        {history.length > 1 && (
          <Panel className="p-4">
            <h2 className="text-xs font-semibold text-slate-400 mb-2">Recent (this session only)</h2>
            <ul className="space-y-1">
              {history.slice(1).map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm text-slate-600 truncate">{h}</code>
                  <CopyButton text={h} label="" variant="ghost" className="px-2 py-1" />
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
      <Panel className="space-y-5 h-fit">
        <SliderField id="len" label="Length" value={length} onChange={setLength} min={4} max={64} />
        <div className="space-y-2.5">
          <Checkbox checked={opts.upper} onChange={toggle('upper')} label="Uppercase (A–Z)" />
          <Checkbox checked={opts.lower} onChange={toggle('lower')} label="Lowercase (a–z)" />
          <Checkbox checked={opts.digits} onChange={toggle('digits')} label="Numbers (0–9)" />
          <Checkbox checked={opts.symbols} onChange={toggle('symbols')} label="Symbols (!@#$…)" />
          <Checkbox checked={noAmbiguous} onChange={setNoAmbiguous} label="Avoid look-alikes (I l 1 O 0)" />
        </div>
      </Panel>
    </div>
  );
}
