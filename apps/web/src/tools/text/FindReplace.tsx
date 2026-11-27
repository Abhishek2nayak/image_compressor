'use client';

import { useEffect, useState } from 'react';
import { Checkbox, CopyButton, ErrorNote, Label, Panel, TextArea, TextInput } from '@/components/tool/ui';
import { escapeRegExp, useRegexRunner } from '@/lib/regex-worker';

export default function FindReplace() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [state, setState] = useState<{ output: string; count: number; error?: string }>({ output: '', count: 0 });
  const runner = useRegexRunner();

  useEffect(() => {
    if (!find) { setState({ output: text, count: 0 }); return; }
    let cancelled = false;
    let pattern = useRegex ? find : escapeRegExp(find);
    if (wholeWord) pattern = `\\b(?:${pattern})\\b`;
    const flags = `gm${caseSensitive ? '' : 'i'}`;
    // In literal mode "$" in the replacement must not be treated as a group reference.
    const replacement = useRegex ? replace : replace.replace(/\$/g, '$$$$');
    const t = setTimeout(() => {
      runner().replace(pattern, flags, text, replacement)
        .then(r => { if (!cancelled) setState({ output: r.result, count: r.count }); })
        .catch((e: Error) => { if (!cancelled) setState({ output: text, count: 0, error: e.message }); });
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [text, find, replace, caseSensitive, wholeWord, useRegex, runner]);

  return (
    <div className="space-y-4">
      <Panel className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="find">Find</Label>
            <TextInput id="find" value={find} onChange={e => setFind(e.target.value)} placeholder={useRegex ? 'e.g. (\\d{3})-(\\d{4})' : 'Text to find'} className={useRegex ? 'font-mono' : ''} />
          </div>
          <div>
            <Label htmlFor="replace">Replace with</Label>
            <TextInput id="replace" value={replace} onChange={e => setReplace(e.target.value)} placeholder={useRegex ? 'e.g. $1 $2' : 'Leave empty to delete'} className={useRegex ? 'font-mono' : ''} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Checkbox checked={caseSensitive} onChange={setCaseSensitive} label="Match case" />
          <Checkbox checked={wholeWord} onChange={setWholeWord} label="Whole words" />
          <Checkbox checked={useRegex} onChange={setUseRegex} label="Regex" />
          {find && !state.error && <span className="ml-auto text-sm font-semibold text-brand-700">{state.count} {state.count === 1 ? 'match' : 'matches'} replaced</span>}
        </div>
        {state.error && <ErrorNote>{state.error}</ErrorNote>}
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="in">Text</Label>
          <TextArea id="in" rows={14} value={text} onChange={e => setText(e.target.value)} placeholder="Paste your text here…" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="out" className="mb-0">Result</Label>
            <CopyButton text={state.output} />
          </div>
          <TextArea id="out" rows={14} value={state.output} readOnly className="bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
