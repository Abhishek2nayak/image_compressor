'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Button, CopyButton, Panel, Stat } from '@/components/tool/ui';
import { useNumberFormat } from '@/lib/tool-helpers';

const STOP_WORDS = new Set(
  'a an and are as at be been but by for from had has have he her hers him his i if in into is it its me my no not of on or our ours she so than that the their them then there these they this those to too was we were what when which who will with would you your yours'.split(' '),
);

function duration(min: number) {
  if (min === 0) return '0 sec';
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} sec`;
  const m = Math.floor(min);
  const s = Math.round((min - m) * 60);
  return s ? `${m} min ${s} sec` : `${m} min`;
}

function analyze(text: string) {
  const words = text.match(/\S+/g)?.length ?? 0;
  const chars = Array.from(text).length;
  const charsNoSpaces = Array.from(text.replace(/\s/g, '')).length;
  const sentences = (text.match(/[^.!?…]+(?:[.!?…]+|$)/g) ?? []).filter(s => /[\p{L}\p{N}]/u.test(s)).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
  const lines = text ? text.split('\n').length : 0;

  const freq = new Map<string, number>();
  let counted = 0;
  for (const w of text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []) {
    counted++;
    if (w.length < 3 || STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return { words, chars, charsNoSpaces, sentences, paragraphs, lines, keywords, counted };
}

export default function WordCounter() {
  const [text, setText] = useState('');
  const deferred = useDeferredValue(text);
  const s = useMemo(() => analyze(deferred), [deferred]);
  const { fmt } = useNumberFormat();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <Panel className="p-0 overflow-hidden flex flex-col">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start typing, or paste your text here…"
          aria-label="Text to count"
          className="flex-1 min-h-[380px] w-full resize-y p-5 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2 bg-slate-50/50">
          <span className="text-sm text-slate-500 tabular-nums"><b className="text-slate-900">{fmt(s.words)}</b> words · <b className="text-slate-900">{fmt(s.chars)}</b> characters</span>
          <div className="flex gap-2">
            <CopyButton text={text} />
            <Button variant="ghost" onClick={() => setText('')} disabled={!text}>Clear</Button>
          </div>
        </div>
      </Panel>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Stat highlight label="Words" value={fmt(s.words)} />
          <Stat label="Characters" value={fmt(s.chars)} />
          <Stat label="No spaces" value={fmt(s.charsNoSpaces)} />
          <Stat label="Sentences" value={fmt(s.sentences)} />
          <Stat label="Paragraphs" value={fmt(s.paragraphs)} />
          <Stat label="Lines" value={fmt(s.lines)} />
        </div>
        <Panel className="p-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-slate-500">Reading time</span><b className="text-slate-900">{duration(s.words / 238)}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Speaking time</span><b className="text-slate-900">{duration(s.words / 130)}</b></div>
        </Panel>
        <Panel className="p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Keyword density</h2>
          {s.keywords.length === 0 ? <p className="text-sm text-slate-400">Top keywords appear here.</p> : (
            <ul className="space-y-1.5">
              {s.keywords.map(([w, c]) => (
                <li key={w} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate text-slate-700">{w}</span>
                  <span className="tabular-nums text-slate-500">{c}</span>
                  <span className="w-12 text-right tabular-nums text-slate-400 text-xs">{((c / s.counted) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
