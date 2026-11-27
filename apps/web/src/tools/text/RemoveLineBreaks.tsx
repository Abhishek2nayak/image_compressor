'use client';

import { useMemo, useState } from 'react';
import { Checkbox, CopyButton, Label, Panel, Segmented, TextArea } from '@/components/tool/ui';

type Mode = 'all' | 'paragraphs' | 'keep';

export default function RemoveLineBreaks() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('paragraphs');
  const [fixHyphens, setFixHyphens] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(false);

  const output = useMemo(() => {
    let t = text.replace(/\r\n?/g, '\n');
    // "exam-\nple" → "example" (common when copying from PDFs)
    if (fixHyphens && mode !== 'keep') t = t.replace(/(\p{L})-\n[ \t]*(\p{Ll})/gu, '$1$2');

    if (mode === 'all') {
      t = t.replace(/\s*\n\s*/g, ' ');
    } else if (mode === 'paragraphs') {
      t = t.split(/\n[ \t]*\n+/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).join('\n\n');
    } else {
      t = t.split('\n').map(l => l.trim()).filter(l => !removeEmpty || l !== '').join('\n');
    }
    if (collapseSpaces) t = t.replace(/[ \t ]{2,}/g, ' ');
    return t.trim();
  }, [text, mode, fixHyphens, collapseSpaces, removeEmpty]);

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Segmented value={mode} onChange={setMode} options={[
          { value: 'paragraphs', label: 'Keep paragraphs' },
          { value: 'all', label: 'Remove all breaks' },
          { value: 'keep', label: 'Keep line breaks' },
        ]} />
        {mode !== 'keep' && <Checkbox checked={fixHyphens} onChange={setFixHyphens} label="Rejoin hyphenated words" />}
        <Checkbox checked={collapseSpaces} onChange={setCollapseSpaces} label="Collapse extra spaces" />
        {mode === 'keep' && <Checkbox checked={removeEmpty} onChange={setRemoveEmpty} label="Remove empty lines" />}
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="in">Input</Label>
          <TextArea id="in" rows={16} value={text} onChange={e => setText(e.target.value)} placeholder="Paste text copied from a PDF, email or website…" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="out" className="mb-0">Result</Label>
            <CopyButton text={output} />
          </div>
          <TextArea id="out" rows={16} value={output} readOnly className="bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
