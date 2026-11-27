'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Label, Panel, Segmented, Select, TextArea, TextInput } from '@/components/tool/ui';

type Style = 'apa' | 'mla' | 'chicago';
type Kind = 'website' | 'book' | 'journal';
type Seg = { t: string; i?: boolean };

interface Source {
  kind: Kind; authors: string; title: string; container: string; publisher: string;
  year: string; month: string; day: string; url: string; doi: string; edition: string;
  volume: string; issue: string; pages: string; accessed: string;
}
const EMPTY: Source = { kind: 'website', authors: '', title: '', container: '', publisher: '', year: '', month: '', day: '', url: '', doi: '', edition: '', volume: '', issue: '', pages: '', accessed: '' };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MLA_MON = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

interface Name { first: string; last: string; org: boolean }
function parseAuthors(raw: string): Name[] {
  return raw.split(/\n|;/).map(s => s.trim()).filter(Boolean).map(s => {
    if (s.includes(',')) { const [last, first] = s.split(',').map(x => x.trim()); return { first, last, org: false }; }
    const parts = s.split(/\s+/);
    if (parts.length === 1) return { first: '', last: s, org: true };
    return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1], org: false };
  });
}
const initials = (first: string) => first.split(/[\s-]+/).filter(Boolean).map(p => `${p[0].toUpperCase()}.`).join(' ');
const ordinal = (n: string) => { const v = parseInt(n, 10); if (!v) return n; const s = ['th', 'st', 'nd', 'rd'], m = v % 100; return v + (s[(m - 20) % 10] || s[m] || s[0]); };
const end = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);
const doiUrl = (d: string) => (d ? (d.startsWith('http') ? d : `https://doi.org/${d.replace(/^doi:\s*/i, '')}`) : '');

function apaAuthors(names: Name[]) {
  const f = names.map(n => (n.org ? n.last : `${n.last}, ${initials(n.first)}`));
  if (f.length <= 1) return f[0] ?? '';
  if (f.length <= 20) return `${f.slice(0, -1).join(', ')}, & ${f[f.length - 1]}`;
  return `${f.slice(0, 19).join(', ')}, … ${f[f.length - 1]}`;
}
function mlaAuthors(names: Name[]) {
  const inv = (n: Name) => (n.org ? n.last : `${n.last}, ${n.first}`);
  const std = (n: Name) => (n.org ? n.last : `${n.first} ${n.last}`);
  if (!names.length) return '';
  if (names.length === 1) return inv(names[0]);
  if (names.length === 2) return `${inv(names[0])}, and ${std(names[1])}`;
  return `${inv(names[0])}, et al`;
}
function chicagoAuthors(names: Name[]) {
  const inv = (n: Name) => (n.org ? n.last : `${n.last}, ${n.first}`);
  const std = (n: Name) => (n.org ? n.last : `${n.first} ${n.last}`);
  if (!names.length) return '';
  if (names.length === 1) return inv(names[0]);
  const rest = names.slice(1, 10).map(std);
  return `${inv(names[0])}, ${rest.length > 1 ? rest.slice(0, -1).join(', ') + ', and ' + rest[rest.length - 1] : 'and ' + rest[0]}${names.length > 10 ? ', et al' : ''}`;
}

function cite(src: Source, style: Style): Seg[] {
  const names = parseAuthors(src.authors);
  const m = parseInt(src.month, 10) - 1;
  const y = src.year.trim();
  const out: Seg[] = [];
  const add = (t: string, i = false) => { if (t) out.push({ t, i }); };
  const link = src.kind === 'website' ? src.url : doiUrl(src.doi) || src.url;

  if (style === 'apa') {
    const date = y ? (src.kind === 'website' && m >= 0 ? `${y}, ${MONTHS[m]}${src.day ? ` ${src.day}` : ''}` : y) : 'n.d.';
    const who = apaAuthors(names);
    if (who) add(`${end(who)} (${date}). `); else { add(src.title, src.kind !== 'journal'); add(`. (${date}). `); }
    if (src.kind === 'journal') {
      if (who) add(`${end(src.title)} `);
      if (src.container) { add(src.container, true); if (src.volume) { add(', '); add(src.volume, true); } if (src.issue) add(`(${src.issue})`); if (src.pages) add(`, ${src.pages}`); add('. '); }
    } else {
      if (who) { add(src.title, true); add(src.kind === 'book' && src.edition ? ` (${ordinal(src.edition)} ed.). ` : '. '); }
      if (src.kind === 'book' && src.publisher) add(`${end(src.publisher)} `);
      if (src.kind === 'website' && src.container && src.container !== who) add(`${end(src.container)} `);
    }
    add(link);
  } else if (style === 'mla') {
    const who = mlaAuthors(names);
    if (who) add(`${end(who)} `);
    if (src.kind === 'book') {
      add(src.title, true); add('. ');
      if (src.edition) add(`${ordinal(src.edition)} ed., `);
      add([src.publisher, y].filter(Boolean).join(', ')); add('.');
    } else {
      add(`“${end(src.title)}” `);
      if (src.container) { add(src.container, true); add(', '); }
      if (src.kind === 'journal') {
        add([src.volume && `vol. ${src.volume}`, src.issue && `no. ${src.issue}`, y, src.pages && `pp. ${src.pages}`].filter(Boolean).join(', '));
        add(link ? `, ${link.replace(/^https?:\/\//, '')}.` : '.');
      } else {
        const date = [src.day, m >= 0 ? MLA_MON[m] : '', y].filter(Boolean).join(' ');
        add([src.publisher && src.publisher !== src.container ? src.publisher : '', date, src.url.replace(/^https?:\/\//, '')].filter(Boolean).join(', '));
        add('.');
        if (src.accessed) { const a = new Date(src.accessed); if (!isNaN(a.getTime())) add(` Accessed ${a.getUTCDate()} ${MLA_MON[a.getUTCMonth()]} ${a.getUTCFullYear()}.`); }
      }
    }
  } else {
    const who = chicagoAuthors(names);
    if (who) add(`${end(who)} `);
    if (src.kind === 'book') {
      add(src.title, true); add('. ');
      if (src.edition) add(`${ordinal(src.edition)} ed. `);
      add([src.publisher, y].filter(Boolean).join(', ')); add('.');
      if (link) add(` ${link}.`);
    } else if (src.kind === 'journal') {
      add(`“${end(src.title)}” `);
      if (src.container) add(src.container, true);
      add(`${src.volume ? ` ${src.volume}` : ''}${src.issue ? `, no. ${src.issue}` : ''}${y ? ` (${y})` : ''}${src.pages ? `: ${src.pages}` : ''}.`);
      if (link) add(` ${link}.`);
    } else {
      add(`“${end(src.title)}” `);
      if (src.container) add(`${end(src.container)} `);
      const date = m >= 0 ? `${MONTHS[m]}${src.day ? ` ${src.day}` : ''}, ${y}` : y;
      if (date) add(`${end(date)} `);
      if (src.url) add(`${src.url}.`);
    }
  }
  return out.map(s => ({ ...s, t: s.t.replace(/\.\./g, '.').replace(/\s{2,}/g, ' ') })).filter(s => s.t);
}

const toPlain = (segs: Seg[]) => segs.map(s => s.t).join('').trim();
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const toHtml = (segs: Seg[]) => segs.map(s => (s.i ? `<i>${escHtml(s.t)}</i>` : escHtml(s.t))).join('').trim();

const STORE = 'vyooom:citations:v1';

export default function CitationGenerator() {
  const [style, setStyle] = useState<Style>('apa');
  const [src, setSrc] = useState<Source>(EMPTY);
  const [list, setList] = useState<Source[]>([]);
  const [copied, setCopied] = useState('');
  const set = (k: keyof Source, v: string) => setSrc(p => ({ ...p, [k]: v }));

  useEffect(() => { try { setList(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch { /* ignore */ } }, []);
  const saveList = (l: Source[]) => { setList(l); try { localStorage.setItem(STORE, JSON.stringify(l)); } catch { /* ignore */ } };

  const current = useMemo(() => cite(src, style), [src, style]);
  const sorted = useMemo(() => [...list].map(s => cite(s, style)).sort((a, b) => toPlain(a).localeCompare(toPlain(b))), [list, style]);

  async function copySegs(key: string, segsList: Seg[][]) {
    const html = segsList.map(s => `<p style="padding-left:0.5in;text-indent:-0.5in">${toHtml(s)}</p>`).join('');
    const plain = segsList.map(toPlain).join('\n\n');
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]);
    } catch { await navigator.clipboard.writeText(plain); }
    setCopied(key); setTimeout(() => setCopied(''), 1500);
  }

  const field = (k: keyof Source, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <Label htmlFor={`c-${k}`}>{label}</Label>
      <TextInput id={`c-${k}`} value={src[k]} onChange={e => set(k, e.target.value)} {...props} />
    </div>
  );
  const ready = !!src.title.trim();

  return (
    <div className="space-y-4">
      <Panel className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Segmented value={style} onChange={setStyle} options={[{ value: 'apa', label: 'APA 7' }, { value: 'mla', label: 'MLA 9' }, { value: 'chicago', label: 'Chicago' }]} />
          <Segmented value={src.kind} onChange={k => set('kind', k)} options={[{ value: 'website', label: 'Website' }, { value: 'book', label: 'Book' }, { value: 'journal', label: 'Journal article' }]} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="c-authors">Authors <span className="font-normal text-slate-500">— one per line, e.g. “Priya Sharma” or an organisation</span></Label>
            <TextArea id="c-authors" rows={2} value={src.authors} onChange={e => set('authors', e.target.value)} placeholder={'Priya Sharma\nJohn A. Smith'} />
          </div>
          <div className="sm:col-span-2">{field('title', src.kind === 'website' ? 'Page title' : src.kind === 'book' ? 'Book title' : 'Article title')}</div>
          {src.kind !== 'book' && field('container', src.kind === 'website' ? 'Website name' : 'Journal name')}
          {src.kind !== 'journal' && field('publisher', 'Publisher')}
          {src.kind === 'book' && field('edition', 'Edition (number)', { inputMode: 'numeric', placeholder: 'e.g. 2' })}
          {src.kind === 'journal' && (
            <div className="grid grid-cols-3 gap-2">
              {field('volume', 'Volume', { inputMode: 'numeric' })}
              {field('issue', 'Issue', { inputMode: 'numeric' })}
              {field('pages', 'Pages', { placeholder: '12–34' })}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {field('year', 'Year', { inputMode: 'numeric', placeholder: '2025' })}
            <div>
              <Label htmlFor="c-month">Month</Label>
              <Select id="c-month" value={src.month} onChange={e => set('month', e.target.value)}>
                <option value="">—</option>
                {MONTHS.map((mo, i) => <option key={mo} value={i + 1}>{mo.slice(0, 3)}</option>)}
              </Select>
            </div>
            {field('day', 'Day', { inputMode: 'numeric' })}
          </div>
          {src.kind === 'website' ? field('url', 'URL', { type: 'url', inputMode: 'url', placeholder: 'https://' }) : field('doi', 'DOI or URL', { placeholder: '10.1000/xyz123' })}
          {src.kind === 'website' && style === 'mla' && field('accessed', 'Date accessed', { type: 'date' })}
        </div>
      </Panel>

      <Panel>
        <Label>Citation</Label>
        <p className="min-h-[3rem] rounded-xl bg-slate-50 border border-slate-200 p-4 text-[15px] leading-relaxed text-slate-900 break-words" style={{ paddingLeft: '2.5rem', textIndent: '-1.5rem' }}>
          {ready ? current.map((s, i) => (s.i ? <i key={i}>{s.t}</i> : <span key={i}>{s.t}</span>)) : <span className="text-slate-400">Fill in at least a title to see your citation.</span>}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={() => copySegs('one', [current])} disabled={!ready}>{copied === 'one' ? 'Copied' : 'Copy citation'}</Button>
          <Button variant="secondary" onClick={() => { saveList([...list, src]); setSrc({ ...EMPTY, kind: src.kind }); }} disabled={!ready}><Plus className="w-4 h-4" />Add to bibliography</Button>
          <Button variant="ghost" onClick={() => setSrc({ ...EMPTY, kind: src.kind })}>Clear form</Button>
        </div>
      </Panel>

      {list.length > 0 && (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-900">Bibliography ({list.length})</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => copySegs('all', sorted)}>{copied === 'all' ? 'Copied' : 'Copy all'}</Button>
              <Button variant="ghost" onClick={() => saveList([])}>Clear</Button>
            </div>
          </div>
          <ul className="space-y-3">
            {list.map((s, idx) => (
              <li key={idx} className="flex gap-2 items-start">
                <p className="flex-1 text-sm leading-relaxed text-slate-800 break-words" style={{ paddingLeft: '1.5rem', textIndent: '-1.5rem' }}>
                  {cite(s, style).map((seg, i) => (seg.i ? <i key={i}>{seg.t}</i> : <span key={i}>{seg.t}</span>))}
                </p>
                <button type="button" onClick={() => saveList(list.filter((_, i) => i !== idx))} aria-label="Remove citation" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-3">“Copy all” sorts entries alphabetically with hanging indents, ready to paste into Word or Google Docs.</p>
        </Panel>
      )}
    </div>
  );
}
