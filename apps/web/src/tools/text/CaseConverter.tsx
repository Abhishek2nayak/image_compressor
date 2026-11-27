'use client';

import { useState } from 'react';
import { Button, CopyButton, Panel } from '@/components/tool/ui';
import { downloadText } from '@/lib/tool-helpers';

const splitWords = (s: string) =>
  s.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const perLine = (fn: (line: string) => string) => (s: string) => s.split('\n').map(fn).join('\n');

const CASES: { id: string; label: string; fn: (s: string) => string }[] = [
  { id: 'upper', label: 'UPPERCASE', fn: s => s.toUpperCase() },
  { id: 'lower', label: 'lowercase', fn: s => s.toLowerCase() },
  { id: 'title', label: 'Title Case', fn: s => s.toLowerCase().replace(/(^|[\s\-/(\[{"“'‘])(\p{L})/gu, (_, p, c) => p + c.toUpperCase()) },
  {
    id: 'sentence', label: 'Sentence case',
    fn: s => s.toLowerCase()
      .replace(/(^\s*|[.!?…]\s+|\n\s*)(\p{L})/gu, (_, p, c) => p + c.toUpperCase())
      .replace(/(^|\s)i(?=[\s'’.,!?]|$)/g, '$1I'),
  },
  { id: 'camel', label: 'camelCase', fn: perLine(l => splitWords(l).map((w, i) => (i ? cap(w) : w.toLowerCase())).join('')) },
  { id: 'pascal', label: 'PascalCase', fn: perLine(l => splitWords(l).map(cap).join('')) },
  { id: 'snake', label: 'snake_case', fn: perLine(l => splitWords(l).map(w => w.toLowerCase()).join('_')) },
  { id: 'constant', label: 'CONSTANT_CASE', fn: perLine(l => splitWords(l).map(w => w.toUpperCase()).join('_')) },
  { id: 'kebab', label: 'kebab-case', fn: perLine(l => splitWords(l).map(w => w.toLowerCase()).join('-')) },
  { id: 'dot', label: 'dot.case', fn: perLine(l => splitWords(l).map(w => w.toLowerCase()).join('.')) },
  { id: 'alternating', label: 'aLtErNaTiNg', fn: s => { let i = 0; return Array.from(s).map(c => (/\p{L}/u.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c)).join(''); } },
  { id: 'inverse', label: 'InVeRsE', fn: s => Array.from(s).map(c => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('') },
];

export default function CaseConverter() {
  const [text, setText] = useState('');
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CASES.map(c => (
          <button key={c.id} type="button" onClick={() => { setText(c.fn(text)); setLast(c.id); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${last === c.id ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <Panel className="p-0 overflow-hidden">
        <textarea
          value={text} onChange={e => { setText(e.target.value); setLast(null); }}
          placeholder="Type or paste your text, then pick a case above."
          aria-label="Text"
          className="w-full min-h-[320px] resize-y p-5 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="border-t border-slate-100 px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 bg-slate-50/50">
          <span className="text-xs text-slate-400 tabular-nums">{Array.from(text).length} characters</span>
          <div className="flex gap-2">
            <CopyButton text={text} />
            <Button variant="secondary" onClick={() => downloadText('text.txt', text)} disabled={!text}>Download</Button>
            <Button variant="ghost" onClick={() => setText('')} disabled={!text}>Clear</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
