'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, RotateCcw, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ErrorNote, FileDrop, Panel, Segmented, Stat } from '@/components/tool/ui';
import { useNumberFormat } from '@/lib/tool-helpers';
import { computeStats, formatDuration, parseChat, type ChatMessage, type ChatStats, type PersonStats } from '@/lib/whatsapp';
import { isZip, listZip, readZipText } from '@/lib/zip';
import { canvasToBlob, downloadBlob } from '@/lib/image';
import { canShareFiles, fitText, fontsReady, pageFont, roundRect, shareImage } from '@/lib/share';

const BAR = ['bg-brand-600', 'bg-amber-500', 'bg-emerald-600', 'bg-rose-500', 'bg-yellow-400', 'bg-slate-500', 'bg-brand-300', 'bg-emerald-300'];
const HEX = ['#cf440d', '#f59e0b', '#059669', '#f43f5e', '#facc15', '#a8a29e', '#fdaa7e', '#6ee7b7'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hourLabel(h: number) {
  const ampm = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}${ampm}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function readChatFile(file: File): Promise<string> {
  if (!isZip(file)) return file.text();
  const entries = await listZip(file);
  const txt = entries
    .filter(e => /\.txt$/i.test(e.name) && !e.name.startsWith('__MACOSX'))
    .sort((a, b) => Number(/_chat\.txt$|whatsapp/i.test(b.name)) - Number(/_chat\.txt$|whatsapp/i.test(a.name)) || b.size - a.size);
  if (!txt.length) throw new Error('No chat text file found in this ZIP. Export the chat again and choose “Without media”.');
  return readZipText(file, txt[0]);
}

interface Award { title: string; who: string; detail: string }

function awards(s: ChatStats): Award[] {
  const ppl = s.people.slice(0, 8);
  if (ppl.length < 2) return [];
  const best = (key: (p: PersonStats) => number, min = 1) => {
    const p = [...ppl].sort((a, b) => key(b) - key(a))[0];
    return key(p) >= min ? p : null;
  };
  const out: Award[] = [];
  const replies = ppl.filter(p => p.medianReplyMs != null).sort((a, b) => a.medianReplyMs! - b.medianReplyMs!);
  if (replies.length >= 2) out.push({ title: 'Fastest replier', who: replies[0].name, detail: `replies in ${formatDuration(replies[0].medianReplyMs)} on average (median)` });
  const starter = best(p => p.starts);
  if (starter) out.push({ title: 'Texts first', who: starter.name, detail: `started ${starter.starts} conversations` });
  const owl = best(p => p.nightMessages, 5);
  if (owl) out.push({ title: 'Night owl', who: owl.name, detail: `${owl.nightMessages} messages between midnight and 5am` });
  const laugh = best(p => p.laughs, 3);
  if (laugh) out.push({ title: 'Laughs the most', who: laugh.name, detail: `${laugh.laughs} hahas, lols and 😂` });
  const love = best(p => p.love, 3);
  if (love) out.push({ title: 'Most affectionate', who: love.name, detail: `${love.love} “love you”s, “miss you”s and ❤️` });
  const essay = best(p => p.words / Math.max(1, p.messages - p.media));
  if (essay) out.push({ title: 'Writes essays', who: essay.name, detail: `${(essay.words / Math.max(1, essay.messages - essay.media)).toFixed(1)} words per message` });
  const emoji = best(p => p.emojis, 5);
  if (emoji) out.push({ title: 'Emoji champion', who: emoji.name, detail: `${emoji.emojis} emojis${emoji.topEmojis[0] ? `, mostly ${emoji.topEmojis[0][0]}` : ''}` });
  const sorry = best(p => p.sorry, 3);
  if (sorry) out.push({ title: 'Says sorry most', who: sorry.name, detail: `${sorry.sorry} sorrys` });
  const ghost = best(p => p.deleted, 3);
  if (ghost) out.push({ title: 'Deletes the evidence', who: ghost.name, detail: `${ghost.deleted} deleted messages` });
  return out;
}

// ───────────────────────────── Share card ─────────────────────────────

async function renderCard(s: ChatStats, periodLabel: string): Promise<HTMLCanvasElement> {
  await fontsReady();
  const W = 1080, H = 1920, P = 84;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const font = pageFont();
  const f = (weight: number, size: number) => `${weight} ${size}px ${font}`;

  // Background: warm graphite with an ember glow at the top.
  ctx.fillStyle = '#1a1715';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.8, 120, 40, W * 0.8, 120, 1100);
  glow.addColorStop(0, 'rgba(242,95,28,0.55)');
  glow.addColorStop(1, 'rgba(242,95,28,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const ppl = s.people;
  const names = ppl.length === 2 ? `${ppl[0].name} & ${ppl[1].name}` : `${ppl.length} people`;

  ctx.fillStyle = '#fb7f45';
  ctx.font = f(700, 40);
  ctx.fillText('Chat Wrapped', P, 170);
  ctx.fillStyle = '#ffffff';
  ctx.font = f(800, 72);
  ctx.fillText(fitText(ctx, names, W - P * 2), P, 260);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = f(500, 36);
  ctx.fillText(periodLabel, P, 318);

  // Hero number
  ctx.fillStyle = '#ffffff';
  ctx.font = f(900, 200);
  ctx.fillText(s.total.toLocaleString('en-IN'), P - 6, 540);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = f(600, 44);
  ctx.fillText('messages sent', P, 610);

  // Stat tiles
  const hours = s.byHour.indexOf(Math.max(...s.byHour));
  const tiles: [string, string][] = [
    [String(s.activeDays), 'days talked'],
    [`${s.longestStreak} days`, 'longest streak'],
    [s.topEmojis[0]?.[0] ?? '—', 'top emoji'],
    [hourLabel(hours), 'busiest hour'],
  ];
  const tw = (W - P * 2 - 30) / 2, th = 190;
  tiles.forEach(([v, l], i) => {
    const x = P + (i % 2) * (tw + 30), y = 690 + Math.floor(i / 2) * (th + 30);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(ctx, x, y, tw, th, 32); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = f(800, 72);
    ctx.fillText(fitText(ctx, v, tw - 60), x + 36, y + 100);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = f(500, 34);
    ctx.fillText(l, x + 36, y + 152);
  });

  // Who texts more
  let y = 1180;
  ctx.fillStyle = '#ffffff';
  ctx.font = f(700, 44);
  ctx.fillText('Who texts more', P, y);
  y += 36;
  const shown = ppl.slice(0, ppl.length === 2 ? 2 : 4);
  const total = shown.reduce((a, p) => a + p.messages, 0) || 1;
  let x = P;
  const bw = W - P * 2;
  shown.forEach((p, i) => {
    const w = (p.messages / total) * bw;
    ctx.fillStyle = HEX[i % HEX.length];
    roundRect(ctx, x, y, Math.max(8, w - 6), 44, 14); ctx.fill();
    x += w;
  });
  y += 100;
  ctx.font = f(600, 36);
  shown.forEach((p, i) => {
    ctx.fillStyle = HEX[i % HEX.length];
    ctx.beginPath(); ctx.arc(P + 14, y - 12, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    const pct = `${Math.round((p.messages / s.total) * 100)}%`;
    ctx.fillText(fitText(ctx, p.name, bw - 200), P + 46, y);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(pct, W - P, y);
    ctx.textAlign = 'left';
    y += 58;
  });

  // Awards
  const aw = awards(s).slice(0, Math.max(0, Math.floor((1760 - y - 30) / 70)));
  y += 30;
  for (const a of aw) {
    ctx.fillStyle = '#fb7f45';
    ctx.font = f(600, 32);
    ctx.fillText(a.title, P, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = f(700, 34);
    ctx.textAlign = 'right';
    ctx.fillText(fitText(ctx, a.who, 540), W - P, y);
    ctx.textAlign = 'left';
    y += 70;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = f(500, 30);
  ctx.fillText('vyooom.com/whatsapp-chat-analyzer · analysed on-device', P, H - 80);
  return c;
}

// ───────────────────────────── UI ─────────────────────────────

function Bars({ values, labels, highlightMax = true, height = 120 }: { values: number[]; labels: string[]; highlightMax?: boolean; height?: number }) {
  const max = Math.max(1, ...values);
  const maxIdx = values.indexOf(max);
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {values.map((v, i) => (
          <div key={i} className="flex-1 h-full flex items-end" title={`${labels[i]}: ${v}`}>
            <div
              className={cn('w-full rounded-t', highlightMax && i === maxIdx ? 'bg-brand-600' : 'bg-brand-200')}
              style={{ height: `${Math.max(v ? 3 : 0, (v / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 truncate">{l}</div>
        ))}
      </div>
    </div>
  );
}

export default function WhatsAppChatAnalyzer() {
  const { fmt } = useNumberFormat();
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState('all');
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null);
  const [cardBusy, setCardBusy] = useState(false);
  const cardRef = useRef(card);
  cardRef.current = card;
  useEffect(() => () => { if (cardRef.current) URL.revokeObjectURL(cardRef.current.url); }, []);

  async function onFile(f: File) {
    setFile(f); setError(''); setBusy(true); setMessages(null); setPeriod('all');
    try {
      const text = await readChatFile(f);
      const msgs = parseChat(text);
      if (msgs.length < 2) throw new Error('No messages found. Make sure this is a WhatsApp “Export chat” file (.txt or .zip).');
      setMessages(msgs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
    } finally {
      setBusy(false);
    }
  }

  const years = useMemo(() => {
    if (!messages) return [];
    return [...new Set(messages.map(m => m.at.getFullYear()))].sort((a, b) => b - a);
  }, [messages]);

  const stats = useMemo(() => {
    if (!messages) return null;
    if (period === 'all') return computeStats(messages);
    const y = Number(period);
    return computeStats(messages, { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59) });
  }, [messages, period]);

  const periodLabel = stats ? (period === 'all' ? `${fmtDate(stats.first)} – ${fmtDate(stats.last)}` : `${period} in messages`) : '';

  useEffect(() => {
    if (!stats) return;
    let cancelled = false;
    setCardBusy(true);
    renderCard(stats, periodLabel)
      .then(c => canvasToBlob(c, 'image/png'))
      .then(blob => {
        if (cancelled) return;
        setCard(old => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob) }; });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCardBusy(false); });
    return () => { cancelled = true; };
  }, [stats, periodLabel]);

  function reset() {
    setFile(null); setMessages(null); setError('');
  }

  if (!messages || !stats) {
    return (
      <div className="space-y-5">
        <FileDrop
          onFile={onFile} file={file} accept=".txt,.zip,text/plain,application/zip"
          label="Choose chat export" hint="WhatsApp .txt or .zip export · read on your device, never uploaded"
        />
        {busy && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Reading your chat…</p>}
        {error && <ErrorNote>{error}</ErrorNote>}
        <Panel>
          <h2 className="font-semibold text-slate-900 mb-3">How to export a WhatsApp chat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 mb-1.5">Android</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open the chat and tap <b>⋮</b> (top right).</li>
                <li>Tap <b>More → Export chat</b>.</li>
                <li>Choose <b>Without media</b> and save the file.</li>
                <li>Pick that file above.</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1.5">iPhone</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open the chat and tap the contact or group name.</li>
                <li>Scroll down and tap <b>Export Chat</b>.</li>
                <li>Choose <b>Without Media</b>, then <b>Save to Files</b>.</li>
                <li>Pick the .zip file above. No need to unzip it.</li>
              </ol>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  const ppl = stats.people;
  const head = ppl.slice(0, 6);
  const maxMsgs = ppl[0]?.messages || 1;
  const aw = awards(stats);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          size="sm" value={period} onChange={setPeriod}
          options={[{ value: 'all', label: 'All time' }, ...years.map(y => ({ value: String(y), label: String(y) }))]}
        />
        <Button variant="ghost" onClick={reset} className="ml-auto"><RotateCcw className="w-4 h-4" /> Another chat</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat highlight label="Messages" value={fmt(stats.total)} sub={periodLabel} />
        <Stat label="Days talked" value={fmt(stats.activeDays)} sub={`of ${fmt(stats.daySpan)} days`} />
        <Stat label="Longest streak" value={`${fmt(stats.longestStreak)} days`} sub={stats.longestSilenceDays ? `longest silence: ${fmt(stats.longestSilenceDays)} days` : 'never went silent'} />
        <Stat label="Busiest day" value={fmt(stats.busiestDay.count)} sub={fmtDate(stats.busiestDay.date)} />
      </div>

      <Panel>
        <h2 className="font-semibold text-slate-900 mb-4">Who texts more</h2>
        <div className="space-y-3">
          {ppl.slice(0, 12).map((p, i) => (
            <div key={p.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-800 truncate">{p.name}</span>
                <span className="text-slate-500 tabular-nums shrink-0 ml-3">{fmt(p.messages)} · {Math.round((p.messages / stats.total) * 100)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={cn('h-full rounded-full', BAR[i % BAR.length])} style={{ width: `${(p.messages / maxMsgs) * 100}%` }} />
              </div>
            </div>
          ))}
          {ppl.length > 12 && <p className="text-xs text-slate-400">+ {ppl.length - 12} more people</p>}
        </div>
      </Panel>

      {aw.length > 0 && (
        <Panel>
          <h2 className="font-semibold text-slate-900 mb-4">Awards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aw.map(a => (
              <div key={a.title} className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-brand-700">{a.title}</div>
                <div className="font-bold text-slate-900 mt-1 truncate">{a.who}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <Panel>
            <h2 className="font-semibold text-slate-900 mb-4">When you talk</h2>
            <Bars values={stats.byHour} labels={stats.byHour.map((_, h) => (h % 3 === 0 ? hourLabel(h) : ''))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">By weekday</h3>
                <Bars values={stats.byWeekday} labels={WEEKDAYS} height={90} />
              </div>
              {stats.byMonth.length > 1 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">By month</h3>
                  <Bars values={stats.byMonth.slice(-12).map(m => m.count)} labels={stats.byMonth.slice(-12).map(m => m.label.split(' ')[0])} height={90} />
                </div>
              )}
            </div>
          </Panel>

          <Panel className="overflow-x-auto">
            <h2 className="font-semibold text-slate-900 mb-4">Head to head</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="font-medium pb-2 pr-3" />
                  {head.map((p, i) => (
                    <th key={p.name} className="font-semibold pb-2 px-2 text-slate-800 max-w-[9rem] truncate">
                      <span className={cn('inline-block w-2 h-2 rounded-full mr-1.5', BAR[i % BAR.length])} />{p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {([
                  ['Messages', p => fmt(p.messages)],
                  ['Words', p => fmt(p.words)],
                  ['Words per message', p => (p.words / Math.max(1, p.messages - p.media)).toFixed(1)],
                  ['Photos & media', p => fmt(p.media)],
                  ['Emojis', p => fmt(p.emojis)],
                  ['Started chats', p => fmt(p.starts)],
                  ['Typical reply time', p => formatDuration(p.medianReplyMs)],
                  ['Late-night messages', p => fmt(p.nightMessages)],
                  ['Laughs', p => fmt(p.laughs)],
                  ['Love you / miss you', p => fmt(p.love)],
                  ['Deleted messages', p => fmt(p.deleted)],
                  ['Favourite emojis', p => p.topEmojis.slice(0, 3).map(e => e[0]).join(' ') || '—'],
                ] as [string, (p: PersonStats) => string][]).map(([label, get]) => (
                  <tr key={label} className="border-t border-slate-100">
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{label}</td>
                    {head.map(p => <td key={p.name} className="py-2 px-2 text-slate-900 font-medium whitespace-nowrap">{get(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Panel>
              <h2 className="font-semibold text-slate-900 mb-3">Top emojis</h2>
              {stats.topEmojis.length ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topEmojis.map(([e, n]) => (
                    <span key={e} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                      <span className="text-xl leading-none">{e}</span><span className="text-xs text-slate-500 tabular-nums">{fmt(n)}</span>
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No emojis. Very serious chat.</p>}
            </Panel>
            <Panel>
              <h2 className="font-semibold text-slate-900 mb-3">Most used words</h2>
              <div className="flex flex-wrap gap-1.5">
                {stats.topWords.map(([w, n]) => (
                  <span key={w} className="rounded-lg bg-brand-50 text-brand-800 px-2.5 py-1 text-sm">
                    {w} <span className="text-brand-600/70 text-xs tabular-nums">{fmt(n)}</span>
                  </span>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="lg:sticky lg:top-20">
          <h2 className="font-semibold text-slate-900 mb-3">Your Chat Wrapped card</h2>
          <div className="aspect-[9/16] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
            {card
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={card.url} alt="Chat Wrapped summary card" className={cn('w-full h-full object-contain transition-opacity', cardBusy && 'opacity-60')} />
              : <Loader2 className="w-6 h-6 animate-spin text-slate-400" />}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button disabled={!card} onClick={() => card && downloadBlob(card.blob, 'chat-wrapped.png')}>
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button variant="secondary" disabled={!card} onClick={() => card && shareImage(card.blob, 'chat-wrapped.png', 'Our WhatsApp Chat Wrapped — made on vyooom.com')}>
              <Share2 className="w-4 h-4" /> {canShareFiles() ? 'Share' : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Story size (1080×1920). Shows names, counts and emojis only, never message text.</p>
        </Panel>
      </div>
    </div>
  );
}
