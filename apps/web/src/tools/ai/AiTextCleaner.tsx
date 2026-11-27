'use client';

import { useMemo, useState } from 'react';
import { ClipboardPaste, Download, FileText } from 'lucide-react';
import { Button, Checkbox, CopyButton, Label, Panel, Select, TextArea } from '@/components/tool/ui';
import { downloadText } from '@/lib/tool-helpers';
import { markdownToHtml, markdownToPlain } from '@/lib/markdown';

const SAMPLE = `## Why this matters

Here's the **short version** — it's *simpler* than it looks:

1. **Speed:** results appear instantly.
2. **Privacy:** nothing is uploaded​ to a server.
   - Works offline
   - No sign‑up needed

> “Good tools get out of your way.” 🚀`;

type Dash = 'comma' | 'hyphen' | 'keep';

const HIDDEN = /[​-‍⁠﻿­‪-‮⁦-⁩]/g;
const ODD_SPACES = /[  -   　]/g;
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;

interface Opts {
  markdown: boolean; dashes: Dash; hidden: boolean; quotes: boolean; emoji: boolean; blankLines: boolean; keepUrls: boolean; bullet: string;
}

function clean(input: string, o: Opts) {
  let s = input;
  const counts = { hidden: 0, dashes: 0, emoji: 0 };
  if (o.hidden) {
    counts.hidden = (s.match(HIDDEN)?.length ?? 0) + (s.match(ODD_SPACES)?.length ?? 0);
    s = s.replace(HIDDEN, '').replace(ODD_SPACES, ' ').replace(/[‐‑]/g, '-');
  }
  if (o.markdown) s = markdownToPlain(s, { bullet: o.bullet, keepUrls: o.keepUrls });
  if (o.dashes !== 'keep') {
    counts.dashes = s.match(/[—–]/g)?.length ?? 0;
    s = o.dashes === 'comma'
      ? s.replace(/\s*—\s*/g, ', ').replace(/(\d)\s*–\s*(\d)/g, '$1-$2').replace(/\s*–\s*/g, ', ').replace(/,\s*([.,;:!?])/g, '$1')
      : s.replace(/\s*[—–]\s*/g, ' - ');
  }
  if (o.quotes) s = s.replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"').replace(/…/g, '...');
  if (o.emoji) { counts.emoji = s.match(EMOJI)?.length ?? 0; s = s.replace(EMOJI, '').replace(/[ \t]+$/gm, ''); }
  if (o.blankLines) s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return { text: s.trim(), counts };
}

export default function AiTextCleaner() {
  const [input, setInput] = useState('');
  const [o, setO] = useState<Opts>({ markdown: true, dashes: 'comma', hidden: true, quotes: false, emoji: false, blankLines: true, keepUrls: true, bullet: '•' });
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO(p => ({ ...p, [k]: v }));
  const { text, counts } = useMemo(() => clean(input, o), [input, o]);
  const [richCopied, setRichCopied] = useState(false);

  async function paste() {
    try { setInput(await navigator.clipboard.readText()); } catch { /* permission denied — user can paste manually */ }
  }

  /** Copy with formatting (bold, lists, headings) for Word / Google Docs / Gmail. */
  async function copyRich() {
    const html = markdownToHtml(input.replace(HIDDEN, ''));
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setRichCopied(true);
    setTimeout(() => setRichCopied(false), 1500);
  }

  const removed = input.length - text.length;

  return (
    <div className="space-y-4">
      <Panel className="space-y-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <Checkbox checked={o.markdown} onChange={v => set('markdown', v)} label="Remove **, ##, ` and other markdown" />
          <Checkbox checked={o.hidden} onChange={v => set('hidden', v)} label="Remove hidden characters" />
          <Checkbox checked={o.blankLines} onChange={v => set('blankLines', v)} label="Tidy blank lines" />
          <Checkbox checked={o.quotes} onChange={v => set('quotes', v)} label="Straight quotes (“ ” → &quot;)" />
          <Checkbox checked={o.emoji} onChange={v => set('emoji', v)} label="Remove emoji" />
          {o.markdown && <Checkbox checked={o.keepUrls} onChange={v => set('keepUrls', v)} label="Keep link URLs" />}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <div>
            <Label htmlFor="dash">Em dashes (—)</Label>
            <Select id="dash" value={o.dashes} onChange={e => set('dashes', e.target.value as Dash)}>
              <option value="comma">Replace with commas</option>
              <option value="hyphen">Replace with a hyphen ( - )</option>
              <option value="keep">Keep</option>
            </Select>
          </div>
          {o.markdown && (
            <div>
              <Label htmlFor="bullet">List bullets</Label>
              <Select id="bullet" value={o.bullet} onChange={e => set('bullet', e.target.value)}>
                <option value="•">• Dot</option>
                <option value="-">- Hyphen</option>
                <option value="">None</option>
              </Select>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Label htmlFor="in" className="mb-0">AI text</Label>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={paste}><ClipboardPaste className="w-4 h-4" />Paste</Button>
              {!input && <Button variant="ghost" onClick={() => setInput(SAMPLE)}>Example</Button>}
              {input && <Button variant="ghost" onClick={() => setInput('')}>Clear</Button>}
            </div>
          </div>
          <TextArea id="in" rows={12} value={input} onChange={e => setInput(e.target.value)} placeholder="Paste a ChatGPT, Claude or Gemini answer here…" />
        </Panel>
        <Panel>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Label htmlFor="out" className="mb-0">Clean text</Label>
            {input && (
              <span className="text-xs text-slate-500 text-right">
                {removed > 0 ? `${removed} characters removed` : 'Nothing to remove'}
                {counts.hidden > 0 && ` · ${counts.hidden} hidden`}
                {counts.dashes > 0 && ` · ${counts.dashes} dashes`}
              </span>
            )}
          </div>
          <TextArea id="out" rows={12} value={text} readOnly placeholder="Clean text appears here as you type." className="bg-slate-50" />
          <div className="flex flex-wrap gap-2 mt-3">
            <CopyButton text={text} label="Copy plain text" variant="primary" />
            <Button variant="secondary" onClick={copyRich} disabled={!input}><FileText className="w-4 h-4" />{richCopied ? 'Copied' : 'Copy for Word / Docs'}</Button>
            <Button variant="secondary" onClick={() => downloadText('clean-text.txt', text)} disabled={!text}><Download className="w-4 h-4" />.txt</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
