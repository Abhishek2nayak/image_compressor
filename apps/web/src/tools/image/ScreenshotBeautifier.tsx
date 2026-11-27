'use client';

import { useEffect, useRef, useState } from 'react';
import { ClipboardCopy, Download, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ErrorNote, FileDrop, Label, Panel, Segmented, TextInput } from '@/components/tool/ui';
import { baseName, canvasToBlob, downloadBlob, loadImage } from '@/lib/image';
import { fitText, fontsReady, pageFont, roundRect } from '@/lib/share';

const BACKGROUNDS: { name: string; stops: string[] }[] = [
  { name: 'Ember',    stops: ['#fb7f45', '#cf440d', '#742b10'] },
  { name: 'Sunset',   stops: ['#fecdb2', '#f25f1c', '#be123c'] },
  { name: 'Peach',    stops: ['#fff5ef', '#fdaa7e'] },
  { name: 'Sand',     stops: ['#f3ead8', '#d6c3a1'] },
  { name: 'Rose',     stops: ['#ffe4e6', '#fb7185', '#9f1239'] },
  { name: 'Forest',   stops: ['#d1fae5', '#059669', '#064e3b'] },
  { name: 'Lime',     stops: ['#fef9c3', '#a3e635', '#3f6212'] },
  { name: 'Graphite', stops: ['#4d4743', '#1a1715'] },
  { name: 'Paper',    stops: ['#fafaf9', '#e8e6e3'] },
];

type Frame = 'none' | 'mac' | 'browser';
type Ratio = 'auto' | '1:1' | '4:5' | '16:9' | '9:16';
const RATIOS: Record<Exclude<Ratio, 'auto'>, number> = { '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9, '9:16': 9 / 16 };

interface Opts {
  bg: number | 'custom' | 'none';
  custom: string;
  padding: number;   // % of the shot's longer side
  radius: number;    // px at 1×
  shadow: number;    // 0..1
  frame: Frame;
  url: string;
  ratio: Ratio;
  dark: boolean;
}

async function render(img: HTMLImageElement, o: Opts, scale: number): Promise<HTMLCanvasElement> {
  await fontsReady();
  const font = pageFont();
  // Work in "1×" units based on the screenshot, capped so huge screenshots stay manageable.
  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)) * scale;
  const sw = img.naturalWidth * k, sh = img.naturalHeight * k;
  const bar = o.frame === 'none' ? 0 : Math.round(Math.max(28, sw * 0.035) * (o.frame === 'browser' ? 1.25 : 1));
  const cardW = sw, cardH = sh + bar;
  const pad = Math.round(Math.max(cardW, cardH) * (o.padding / 100));
  let W = cardW + pad * 2, H = cardH + pad * 2;
  if (o.ratio !== 'auto') {
    const r = RATIOS[o.ratio];
    if (W / H > r) H = W / r; else W = H * r;
  }
  W = Math.round(W); H = Math.round(H);

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  if (o.bg === 'custom') { ctx.fillStyle = o.custom; ctx.fillRect(0, 0, W, H); }
  else if (o.bg !== 'none') {
    const stops = BACKGROUNDS[o.bg].stops;
    const g = ctx.createLinearGradient(0, 0, W, H);
    stops.forEach((s, i) => g.addColorStop(i / Math.max(1, stops.length - 1), s));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  const x = (W - cardW) / 2, y = (H - cardH) / 2;
  const r = o.radius * scale;

  // Shadow
  if (o.shadow > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.15 + o.shadow * 0.35})`;
    ctx.shadowBlur = (20 + o.shadow * 70) * scale;
    ctx.shadowOffsetY = (8 + o.shadow * 24) * scale;
    ctx.fillStyle = o.dark ? '#1f1d1b' : '#ffffff';
    roundRect(ctx, x, y, cardW, cardH, r); ctx.fill();
    ctx.restore();
  }

  // Card clip
  ctx.save();
  roundRect(ctx, x, y, cardW, cardH, r);
  ctx.clip();
  if (bar) {
    ctx.fillStyle = o.dark ? '#2e2b28' : '#f4f3f1';
    ctx.fillRect(x, y, cardW, bar);
    const dot = bar * 0.22, cy = y + bar / 2;
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x + bar * 0.6 + i * dot * 3.2, cy, dot, 0, Math.PI * 2); ctx.fill();
    });
    if (o.frame === 'browser') {
      const ux = x + bar * 0.6 + dot * 10, uw = cardW - (ux - x) - bar * 0.6, uh = bar * 0.56;
      ctx.fillStyle = o.dark ? '#423e3a' : '#ffffff';
      roundRect(ctx, ux, cy - uh / 2, uw, uh, uh / 2); ctx.fill();
      if (o.url) {
        ctx.fillStyle = o.dark ? '#c3bdb7' : '#635c57';
        ctx.font = `500 ${Math.round(uh * 0.5)}px ${font}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(fitText(ctx, o.url, uw - uh), ux + uw / 2, cy);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y + bar, sw, sh);
  ctx.restore();
  return c;
}

export default function ScreenshotBeautifier() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState('');
  const [o, setO] = useState<Opts>({ bg: 0, custom: '#cf440d', padding: 8, radius: 14, shadow: 0.6, frame: 'mac', url: 'vyooom.com', ratio: 'auto', dark: false });
  const [preview, setPreview] = useState('');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(preview);
  previewRef.current = preview;
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  async function onFile(f: File) {
    setError('');
    try { setImg(await loadImage(f)); setFile(f); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not open this image.'); }
  }

  useEffect(() => {
    if (!img) return;
    let cancelled = false;
    render(img, o, 0.6).then(c => canvasToBlob(c, 'image/png')).then(b => {
      if (cancelled) return;
      setPreview(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [img, o]);

  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO(p => ({ ...p, [k]: v }));

  async function exportBlob() {
    if (!img) return null;
    return canvasToBlob(await render(img, o, 2), 'image/png');
  }

  async function copy() {
    const b = await exportBlob();
    if (!b) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Your browser blocked copying images. Use Download instead.');
    }
  }

  if (!img) {
    return (
      <div className="space-y-4">
        <FileDrop onFile={onFile} paste accept="image/*" label="Choose a screenshot" hint="Or paste one with Ctrl+V · stays on your device" />
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    );
  }

  const range = (label: string, k: 'padding' | 'radius' | 'shadow', min: number, max: number, step: number, show: (v: number) => string) => (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500 tabular-nums">{show(o[k])}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={o[k]} onChange={e => set(k, Number(e.target.value))} className="w-full accent-brand-600" aria-label={label} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="space-y-3 min-w-0">
        <div className="rounded-2xl border border-slate-200 bg-[repeating-conic-gradient(rgb(var(--n-100))_0%_25%,transparent_0%_50%)] [background-size:20px_20px] p-3 flex items-center justify-center min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Beautified screenshot preview" className="max-w-full max-h-[70vh] h-auto" />}
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>

      <Panel className="space-y-5 lg:sticky lg:top-20">
        <div>
          <Label>Background</Label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUNDS.map((b, i) => (
              <button key={b.name} type="button" title={b.name} aria-label={b.name} onClick={() => set('bg', i)}
                className={cn('w-9 h-9 rounded-full border-2', o.bg === i ? 'border-brand-600 ring-2 ring-brand-200' : 'border-slate-200')}
                style={{ background: `linear-gradient(135deg, ${b.stops.join(', ')})` }} />
            ))}
            <label title="Custom colour" className={cn('w-9 h-9 rounded-full border-2 overflow-hidden cursor-pointer', o.bg === 'custom' ? 'border-brand-600 ring-2 ring-brand-200' : 'border-slate-200')}
              style={{ background: o.custom }}>
              <input type="color" value={o.custom} onChange={e => { set('custom', e.target.value); set('bg', 'custom'); }} className="opacity-0 w-full h-full cursor-pointer" aria-label="Custom colour" />
            </label>
            <button type="button" title="Transparent" aria-label="Transparent" onClick={() => set('bg', 'none')}
              className={cn('w-9 h-9 rounded-full border-2 bg-[repeating-conic-gradient(rgb(var(--n-200))_0%_25%,transparent_0%_50%)] [background-size:10px_10px]', o.bg === 'none' ? 'border-brand-600 ring-2 ring-brand-200' : 'border-slate-200')} />
          </div>
        </div>

        <div>
          <Label>Window</Label>
          <Segmented size="sm" value={o.frame} onChange={v => set('frame', v)}
            options={[{ value: 'none', label: 'None' }, { value: 'mac', label: 'Window' }, { value: 'browser', label: 'Browser' }]} />
          {o.frame === 'browser' && (
            <TextInput className="mt-2" value={o.url} onChange={e => set('url', e.target.value)} placeholder="example.com" aria-label="Address bar text" />
          )}
          {o.frame !== 'none' && (
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={o.dark} onChange={e => set('dark', e.target.checked)} className="w-4 h-4 accent-brand-600" /> Dark window
            </label>
          )}
        </div>

        <div className="space-y-3">
          {range('Padding', 'padding', 0, 25, 1, v => `${v}%`)}
          {range('Corner radius', 'radius', 0, 40, 1, v => `${v}px`)}
          {range('Shadow', 'shadow', 0, 1, 0.05, v => `${Math.round(v * 100)}%`)}
        </div>

        <div>
          <Label>Size</Label>
          <Segmented size="sm" value={o.ratio} onChange={v => set('ratio', v)}
            options={[{ value: 'auto', label: 'Auto' }, { value: '1:1', label: '1:1' }, { value: '4:5', label: '4:5' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }]} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={async () => { const b = await exportBlob(); if (b && file) downloadBlob(b, `${baseName(file.name)}-framed.png`); }}>
            <Download className="w-4 h-4" /> Download
          </Button>
          <Button variant="secondary" onClick={copy}><ClipboardCopy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}</Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={() => { setImg(null); setFile(null); }}><RotateCcw className="w-4 h-4" /> Another screenshot</Button>
      </Panel>
    </div>
  );
}
