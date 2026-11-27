'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton, Label, Panel, Stat, TextArea } from '@/components/tool/ui';
import { useNumberFormat } from '@/lib/tool-helpers';

interface Limit { name: string; max: number; preview?: number; previewLabel?: string; count?: 'x' | 'sms' }

const GROUPS: { title: string; limits: Limit[] }[] = [
  { title: 'Social posts', limits: [
    { name: 'X (Twitter) post', max: 280, count: 'x' },
    { name: 'Threads post', max: 500 },
    { name: 'Instagram caption', max: 2200, preview: 125, previewLabel: 'shown before “more”' },
    { name: 'LinkedIn post', max: 3000, preview: 210, previewLabel: 'shown before “see more”' },
    { name: 'Facebook post', max: 63206, preview: 125, previewLabel: 'shown before “see more”' },
    { name: 'TikTok caption', max: 4000 },
  ] },
  { title: 'Profiles & video', limits: [
    { name: 'Instagram bio', max: 150 },
    { name: 'LinkedIn headline', max: 220 },
    { name: 'X bio', max: 160 },
    { name: 'YouTube title', max: 100, preview: 70, previewLabel: 'visible in search' },
    { name: 'YouTube description', max: 5000, preview: 157, previewLabel: 'shown above the fold' },
  ] },
  { title: 'SEO & messaging', limits: [
    { name: 'Google title tag', max: 60 },
    { name: 'Meta description', max: 160 },
    { name: 'SMS (1 message)', max: 160, count: 'sms' },
    { name: 'WhatsApp status', max: 700 },
  ] },
];

const graphemes = (s: string) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let n = 0;
    for (const _ of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)) n++;
    return n;
  }
  return Array.from(s).length;
};

/** X counts every URL as 23 and most emoji / CJK as 2. */
function xLength(s: string) {
  const noUrls = s.replace(/https?:\/\/\S+/g, '');
  const urls = (s.match(/https?:\/\/\S+/g) ?? []).length;
  let n = urls * 23;
  for (const ch of Array.from(noUrls)) {
    const cp = ch.codePointAt(0)!;
    n += cp <= 0x10ff || (cp >= 0x2000 && cp <= 0x200d) || (cp >= 0x2010 && cp <= 0x201f) || (cp >= 0x2032 && cp <= 0x2037) ? 1 : 2;
  }
  return n;
}

/** GSM-7 messages hold 160 characters; anything else (emoji, Hindi) drops to 70. */
const GSM = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/;

export default function CharacterCounter() {
  const [text, setText] = useState('');
  const { fmt } = useNumberFormat();

  const s = useMemo(() => {
    const chars = graphemes(text);
    const gsm = GSM.test(text);
    return {
      chars, x: xLength(text), gsm,
      sms: gsm ? 160 : 70,
      noSpaces: graphemes(text.replace(/\s/g, '')),
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      lines: text ? text.split('\n').length : 0,
      hashtags: (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length,
      mentions: (text.match(/(^|\s)@[\w.]+/g) ?? []).length,
    };
  }, [text]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
      <div className="space-y-4 lg:sticky lg:top-20">
        <Panel>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="txt" className="mb-0">Your text</Label>
            <CopyButton text={text} variant="ghost" />
          </div>
          <TextArea id="txt" rows={9} value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste your post, caption, bio or meta description…" />
        </Panel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Characters" value={fmt(s.chars, 0)} highlight />
          <Stat label="No spaces" value={fmt(s.noSpaces, 0)} />
          <Stat label="Words" value={fmt(s.words, 0)} />
          <Stat label="Hashtags · @" value={`${s.hashtags} · ${s.mentions}`} />
        </div>
      </div>

      <div className="space-y-4">
        {GROUPS.map(g => (
          <Panel key={g.title} className="p-4 md:p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">{g.title}</h2>
            <ul className="space-y-3">
              {g.limits.map(l => {
                const max = l.count === 'sms' ? s.sms : l.max;
                const used = l.count === 'x' ? s.x : s.chars;
                const pct = Math.min(100, (used / max) * 100);
                const over = used > max;
                const near = !over && pct >= 90;
                return (
                  <li key={l.name}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-slate-700">{l.name}</span>
                      <span className={cn('tabular-nums font-semibold', over ? 'text-red-600' : near ? 'text-amber-700' : 'text-slate-900')}>
                        {fmt(used, 0)}<span className="text-slate-400 font-normal"> / {fmt(max, 0)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 mt-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-[width]', over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {over ? `${fmt(used - max, 0)} over the limit` : `${fmt(max - used, 0)} left`}
                      {l.preview && used > l.preview && ` · first ${l.preview} ${l.previewLabel}`}
                      {l.count === 'sms' && !s.gsm && text && ' · emoji or non-Latin text limits SMS to 70'}
                      {l.count === 'x' && /https?:\/\//.test(text) && ' · links count as 23'}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
