'use client';

import { Fragment, useDeferredValue, useMemo, useState } from 'react';
import { Checkbox, ErrorNote, Label, Panel, TextArea } from '@/components/tool/ui';
import { diffLines, type DiffLine } from '@/lib/diff';
import { cn } from '@/lib/utils';

const CONTEXT = 3;

type Row = DiffLine | { type: 'skip'; count: number };

function collapse(lines: DiffLine[]): Row[] {
  const keep = new Array(lines.length).fill(false);
  lines.forEach((l, i) => {
    if (l.type !== 'equal') for (let j = Math.max(0, i - CONTEXT); j <= Math.min(lines.length - 1, i + CONTEXT); j++) keep[j] = true;
  });
  const rows: Row[] = [];
  let skipped = 0;
  lines.forEach((l, i) => {
    if (keep[i]) {
      if (skipped) { rows.push({ type: 'skip', count: skipped }); skipped = 0; }
      rows.push(l);
    } else skipped++;
  });
  if (skipped) rows.push({ type: 'skip', count: skipped });
  return rows;
}

export default function DiffChecker() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(true);
  const da = useDeferredValue(a);
  const db = useDeferredValue(b);

  const result = useMemo<null | { tooBig: true } | { lines: DiffLine[]; added: number; removed: number; same: boolean }>(() => {
    if (!da && !db) return null;
    const lines = diffLines(da, db, { ignoreCase, ignoreWhitespace: ignoreWs });
    if (!lines) return { tooBig: true };
    const added = lines.filter(l => l.type === 'insert').length;
    const removed = lines.filter(l => l.type === 'delete').length;
    return { lines, added, removed, same: added === 0 && removed === 0 };
  }, [da, db, ignoreCase, ignoreWs]);

  const rows: Row[] = result && 'lines' in result ? (onlyChanges ? collapse(result.lines) : result.lines) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="a">Original text</Label>
          <TextArea id="a" rows={12} mono value={a} onChange={e => setA(e.target.value)} placeholder="Paste the original version…" />
        </div>
        <div>
          <Label htmlFor="b">Changed text</Label>
          <TextArea id="b" rows={12} mono value={b} onChange={e => setB(e.target.value)} placeholder="Paste the new version…" />
        </div>
      </div>

      <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <Checkbox checked={ignoreCase} onChange={setIgnoreCase} label="Ignore case" />
        <Checkbox checked={ignoreWs} onChange={setIgnoreWs} label="Ignore whitespace" />
        <Checkbox checked={onlyChanges} onChange={setOnlyChanges} label="Hide unchanged lines" />
        {result && 'lines' in result && (
          <div className="ml-auto flex gap-2 text-sm font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">+{result.added} added</span>
            <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700">−{result.removed} removed</span>
          </div>
        )}
      </Panel>

      {result && 'tooBig' in result && <ErrorNote>These texts differ in too many places to compare line by line. Try comparing smaller sections.</ErrorNote>}
      {result && 'same' in result && result.same && <Panel className="text-center text-sm font-semibold text-emerald-700 bg-emerald-50 border-emerald-100">The two texts are identical{(ignoreCase || ignoreWs) && ' (with the selected options)'}.</Panel>}

      {result && 'lines' in result && !result.same && (
        <Panel className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[13px] leading-6">
              <tbody>
                {rows.map((r, i) => (
                  <Fragment key={i}>
                    {r.type === 'skip' ? (
                      <tr className="bg-slate-50 text-slate-400">
                        <td colSpan={4} className="px-4 py-1 text-xs font-sans">⋯ {r.count} unchanged line{r.count > 1 && 's'}</td>
                      </tr>
                    ) : (
                      <tr className={cn(r.type === 'insert' && 'bg-emerald-50', r.type === 'delete' && 'bg-red-50')}>
                        <td className="w-12 px-2 text-right text-slate-400 select-none border-r border-slate-100">{'aLine' in r ? r.aLine : ''}</td>
                        <td className="w-12 px-2 text-right text-slate-400 select-none border-r border-slate-100">{'bLine' in r ? r.bLine : ''}</td>
                        <td className={cn('w-6 text-center select-none font-bold', r.type === 'insert' ? 'text-emerald-600' : r.type === 'delete' ? 'text-red-600' : 'text-slate-300')}>
                          {r.type === 'insert' ? '+' : r.type === 'delete' ? '−' : ''}
                        </td>
                        <td className={cn('pr-4 whitespace-pre-wrap break-all', r.type === 'insert' ? 'text-emerald-900' : r.type === 'delete' ? 'text-red-900' : 'text-slate-700')}>
                          {r.text || ' '}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
