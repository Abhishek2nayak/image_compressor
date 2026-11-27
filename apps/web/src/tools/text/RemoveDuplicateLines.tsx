'use client';

import { useMemo, useState } from 'react';
import { Checkbox, CopyButton, Label, Panel, Select, TextArea } from '@/components/tool/ui';
import { downloadText } from '@/lib/tool-helpers';
import { Button } from '@/components/tool/ui';

type Sort = 'none' | 'az' | 'za' | 'short' | 'long' | 'reverse';
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export default function RemoveDuplicateLines() {
  const [text, setText] = useState('');
  const [dedupe, setDedupe] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sort, setSort] = useState<Sort>('none');

  const r = useMemo(() => {
    const input = text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n');
    let lines = input.map(l => (trim ? l.trim() : l));
    if (removeEmpty) lines = lines.filter(l => l.trim() !== '');
    let dupes = 0;
    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter(l => {
        const key = ignoreCase ? l.toLowerCase() : l;
        if (seen.has(key)) { dupes++; return false; }
        seen.add(key);
        return true;
      });
    }
    if (sort === 'az') lines.sort(collator.compare);
    else if (sort === 'za') lines.sort((a, b) => collator.compare(b, a));
    else if (sort === 'short') lines.sort((a, b) => a.length - b.length);
    else if (sort === 'long') lines.sort((a, b) => b.length - a.length);
    else if (sort === 'reverse') lines.reverse();
    return { output: lines.join('\n'), inCount: input.length, outCount: lines.length, dupes };
  }, [text, dedupe, ignoreCase, trim, removeEmpty, sort]);

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Checkbox checked={dedupe} onChange={setDedupe} label="Remove duplicates" />
        <Checkbox checked={ignoreCase} onChange={setIgnoreCase} label="Ignore case" />
        <Checkbox checked={trim} onChange={setTrim} label="Trim spaces" />
        <Checkbox checked={removeEmpty} onChange={setRemoveEmpty} label="Remove empty lines" />
        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="mb-0">Sort</Label>
          <Select id="sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="w-44 py-1.5">
            <option value="none">Keep original order</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="short">Shortest first</option>
            <option value="long">Longest first</option>
            <option value="reverse">Reverse order</option>
          </Select>
        </div>
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="in">Input <span className="font-normal text-slate-400">· {r.inCount} lines</span></Label>
          <TextArea id="in" rows={16} value={text} onChange={e => setText(e.target.value)} placeholder="One item per line…" mono />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="out" className="mb-0">
              Result <span className="font-normal text-slate-400">· {r.outCount} lines{r.dupes > 0 && <>, <span className="text-brand-600 font-semibold">{r.dupes} duplicates removed</span></>}</span>
            </Label>
            <div className="flex gap-2">
              <CopyButton text={r.output} />
              <Button variant="secondary" onClick={() => downloadText('lines.txt', r.output)} disabled={!r.output}>Download</Button>
            </div>
          </div>
          <TextArea id="out" rows={16} value={r.output} readOnly mono className="bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
