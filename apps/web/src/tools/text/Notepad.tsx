'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button, CopyButton, Panel } from '@/components/tool/ui';
import { downloadText } from '@/lib/tool-helpers';

const KEY = 'vyooom:notepad';

export default function Notepad() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading');
  const [ready, setReady] = useState(false);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    let saved = '';
    try { saved = localStorage.getItem(KEY) ?? ''; } catch { /* storage blocked */ }
    lastSaved.current = saved;
    setText(saved);
    setReady(true);
    setStatus('saved');
  }, []);

  useEffect(() => {
    // Never write before the stored note has been loaded, or we'd overwrite it.
    if (!ready) return;
    if (text === lastSaved.current) { setStatus('saved'); return; }
    setStatus('saving');
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY, text); lastSaved.current = text; setStatus('saved'); } catch { setStatus('error'); }
    }, 400);
    return () => clearTimeout(t);
  }, [text, ready]);

  const words = text.match(/\S+/g)?.length ?? 0;

  function clear() {
    if (text && !window.confirm('Delete this note? This cannot be undone.')) return;
    setText('');
  }

  return (
    <Panel className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <span className={`text-xs font-medium ${status === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
          {status === 'loading' ? 'Loading…' : status === 'saving' ? 'Saving…' : status === 'error' ? 'Could not save — storage is full or blocked' : 'Saved in this browser'}
        </span>
        <div className="flex gap-2">
          <CopyButton text={text} />
          <Button variant="secondary" onClick={() => downloadText(`note-${new Date().toISOString().slice(0, 10)}.txt`, text)} disabled={!text}><Download className="w-4 h-4" /> Download</Button>
          <Button variant="ghost" onClick={clear} disabled={!text}><Trash2 className="w-4 h-4" /> Clear</Button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Start writing… your note is saved automatically."
        aria-label="Note"
        autoFocus
        className="w-full min-h-[460px] resize-y p-5 text-[15px] leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
      />
      <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 tabular-nums">{words} words · {Array.from(text).length} characters</div>
    </Panel>
  );
}
