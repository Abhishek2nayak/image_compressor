'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Checkbox, ErrorNote, FileDrop, Label, Panel, Segmented, Select, TextInput } from '@/components/tool/ui';
import { baseName, canvasToBlob, downloadBlob, loadImage } from '@/lib/image';
import { parseDateInput, toDateInput } from '@/lib/tool-helpers';

interface Settings {
  flash: number;      // 0..1  centre exposure boost
  warmth: number;     // -1..1 cool ↔ warm
  saturation: number; // 0.6..1.6
  grain: number;      // 0..1
  vignette: number;   // 0..1  background falloff
  fringe: number;     // 0..1  chromatic aberration
}

const PRESETS: Record<string, { label: string; s: Settings }> = {
  flash:      { label: 'Night flash', s: { flash: 0.7, warmth: 0.1, saturation: 1.12, grain: 0.35, vignette: 0.55, fringe: 0.4 } },
  y2k:        { label: 'Y2K cool',    s: { flash: 0.5, warmth: -0.35, saturation: 1.0, grain: 0.3, vignette: 0.4, fringe: 0.5 } },
  warm:       { label: 'Warm 2016',   s: { flash: 0.3, warmth: 0.45, saturation: 1.25, grain: 0.25, vignette: 0.3, fringe: 0.2 } },
  disposable: { label: 'Disposable',  s: { flash: 0.45, warmth: 0.25, saturation: 1.05, grain: 0.6, vignette: 0.65, fringe: 0.3 } },
};

type StampFormat = 'ymd' | 'dmy' | 'mdy';
type Res = '3' | '5' | 'full';
const RES_EDGE: Record<Res, number> = { '3': 2048, '5': 2592, full: 4096 };

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 7-segment date stamp ──
const SEGMENTS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcfgd', '-': 'g',
};

function drawSevenSeg(ctx: CanvasRenderingContext2D, text: string, right: number, bottom: number, h: number) {
  const w = h * 0.5, t = h * 0.11, gap = h * 0.18;
  const widthOf = (ch: string) => (ch === ' ' ? w * 0.7 : ch === "'" || ch === ':' || ch === '.' ? t * 2.2 : w) + gap;
  const total = Array.from(text).reduce((s, ch) => s + widthOf(ch), 0) - gap;
  let x = right - total;
  const top = bottom - h;
  ctx.save();
  ctx.fillStyle = '#ff9a2e';
  ctx.shadowColor = 'rgba(255,120,20,0.9)';
  ctx.shadowBlur = h * 0.35;
  const seg = (sx: number, sy: number, sw: number, sh: number) => {
    ctx.beginPath();
    const r = Math.min(sw, sh) / 2;
    ctx.moveTo(sx + r, sy);
    ctx.arcTo(sx + sw, sy, sx + sw, sy + sh, r);
    ctx.arcTo(sx + sw, sy + sh, sx, sy + sh, r);
    ctx.arcTo(sx, sy + sh, sx, sy, r);
    ctx.arcTo(sx, sy, sx + sw, sy, r);
    ctx.fill();
  };
  for (const ch of Array.from(text)) {
    const s = SEGMENTS[ch];
    if (s) {
      const half = h / 2;
      // slight italic like real LCD stamps
      ctx.setTransform(1, 0, -0.08, 1, (top + h) * 0.08, 0);
      if (s.includes('a')) seg(x + t * 0.6, top, w - t * 1.2, t);
      if (s.includes('g')) seg(x + t * 0.6, top + half - t / 2, w - t * 1.2, t);
      if (s.includes('d')) seg(x + t * 0.6, top + h - t, w - t * 1.2, t);
      if (s.includes('f')) seg(x, top + t * 0.6, t, half - t * 0.9);
      if (s.includes('b')) seg(x + w - t, top + t * 0.6, t, half - t * 0.9);
      if (s.includes('e')) seg(x, top + half + t * 0.3, t, half - t * 0.9);
      if (s.includes('c')) seg(x + w - t, top + half + t * 0.3, t, half - t * 0.9);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else if (ch === "'") {
      seg(x + t * 0.4, top, t, h * 0.28);
    } else if (ch === ':') {
      seg(x + t * 0.4, top + h * 0.25, t, t);
      seg(x + t * 0.4, top + h * 0.65, t, t);
    } else if (ch === '.') {
      seg(x + t * 0.4, top + h - t, t, t);
    }
    x += widthOf(ch);
  }
  ctx.restore();
}

function stampText(d: Date, f: StampFormat) {
  const yy = `'${String(d.getFullYear()).slice(-2)}`;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return f === 'ymd' ? `${yy} ${mm} ${dd}` : f === 'dmy' ? `${dd} ${mm} ${yy}` : `${mm} ${dd} ${yy}`;
}

/** Apply the digicam look to an image, returning a new canvas of at most `maxEdge` px. */
function render(img: HTMLImageElement, s: Settings, maxEdge: number, stamp: string | null, seed: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.max(1, Math.round(img.naturalWidth * scale));
  const H = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, W, H);

  const src = ctx.getImageData(0, 0, W, H);
  const out = ctx.createImageData(W, H);
  const a = src.data, o = out.data;
  const rand = mulberry32(seed);
  const cx = W / 2, cy = H * 0.42;
  const maxD = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const contrast = 1 + s.flash * 0.28;
  const warmR = s.warmth * 22, warmB = -s.warmth * 26, warmG = s.warmth * 4;
  const fringePx = s.fringe * Math.max(1, W / 700);
  const grainAmt = s.grain * 46;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) / maxD;  // 0 centre … 1 corner
      const d2 = d * d;

      // Chromatic aberration: red pushed outward, blue pulled inward, more toward the edges.
      const shift = fringePx * d;
      const ux = d > 0 ? dx / (d * maxD) : 0, uy = d > 0 ? dy / (d * maxD) : 0;
      const rx = Math.min(W - 1, Math.max(0, Math.round(x + ux * shift)));
      const ry = Math.min(H - 1, Math.max(0, Math.round(y + uy * shift)));
      const bx = Math.min(W - 1, Math.max(0, Math.round(x - ux * shift)));
      const by = Math.min(H - 1, Math.max(0, Math.round(y - uy * shift)));
      let r = a[(ry * W + rx) * 4];
      let g = a[i + 1];
      let b = a[(by * W + bx) * 4 + 2];

      // Flash: strong exposure boost in the middle, fast falloff into a dark background.
      const gain = (1 + s.flash * 0.75 * Math.max(0, 1 - d2 * 1.6)) * (1 - s.vignette * Math.min(1, d2 * 1.15));
      r *= gain; g *= gain; b *= gain;

      // Contrast + warmth
      r = (r - 128) * contrast + 128 + warmR;
      g = (g - 128) * contrast + 128 + warmG;
      b = (b - 128) * contrast + 128 + warmB;

      // Saturation
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      r = l + (r - l) * s.saturation;
      g = l + (g - l) * s.saturation;
      b = l + (b - l) * s.saturation;

      // Sensor noise: mostly luminance, a little colour, stronger in shadows.
      if (grainAmt) {
        const shadow = 1.3 - Math.min(1, l / 255);
        const n = (rand() - 0.5) * grainAmt * shadow;
        r += n + (rand() - 0.5) * grainAmt * 0.25;
        g += n;
        b += n + (rand() - 0.5) * grainAmt * 0.3;
      }

      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255; // Uint8ClampedArray clamps
    }
  }
  ctx.putImageData(out, 0, 0);

  if (stamp) {
    const h = Math.round(Math.min(W, H) * 0.045);
    drawSevenSeg(ctx, stamp, W - h * 1.4, H - h * 1.1, h);
  }
  return c;
}

interface Item { file: File; img: HTMLImageElement; thumb: string; date: Date }

export default function DigicamFilter() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const [preset, setPreset] = useState('flash');
  const [s, setS] = useState<Settings>(PRESETS.flash.s);
  const [stampOn, setStampOn] = useState(true);
  const [stampFmt, setStampFmt] = useState<StampFormat>('ymd');
  const [customDate, setCustomDate] = useState('');
  const [res, setRes] = useState<Res>('3');
  const [crunch, setCrunch] = useState(0.72);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach(i => URL.revokeObjectURL(i.thumb)), []);

  async function addFiles(files: File[]) {
    setError('');
    const added: Item[] = [];
    for (const f of files) {
      try {
        const img = await loadImage(f);
        added.push({ file: f, img, thumb: URL.createObjectURL(f), date: new Date(f.lastModified || Date.now()) });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open one of the images.');
      }
    }
    if (added.length) {
      setActive(itemsRef.current.length);
      setItems(prev => [...prev, ...added]);
    }
  }

  function removeItem(idx: number) {
    const prev = itemsRef.current;
    URL.revokeObjectURL(prev[idx].thumb);
    const next = prev.filter((_, i) => i !== idx);
    setItems(next);
    setActive(a => Math.max(0, Math.min(a > idx || a === next.length ? a - 1 : a, next.length - 1)));
  }

  const current = items[active];
  const stampFor = (it: Item) => {
    if (!stampOn) return null;
    const d = parseDateInput(customDate) ?? it.date;
    return stampText(d, stampFmt);
  };

  // Live preview at screen size.
  const settingsKey = useMemo(() => JSON.stringify({ s, stampOn, stampFmt, customDate }), [s, stampOn, stampFmt, customDate]);
  useEffect(() => {
    if (!current || !previewRef.current) return;
    const id = requestAnimationFrame(() => {
      const c = render(current.img, s, 1000, stampFor(current), 7);
      const p = previewRef.current;
      if (!p) return;
      p.width = c.width; p.height = c.height;
      p.getContext('2d')!.drawImage(c, 0, 0);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, settingsKey]);

  async function exportItem(it: Item) {
    const c = render(it.img, s, RES_EDGE[res], stampFor(it), 7);
    const blob = await canvasToBlob(c, 'image/jpeg', crunch);
    downloadBlob(blob, `${baseName(it.file.name)}-digicam.jpg`);
  }

  async function exportAll(list: Item[]) {
    setBusy(true);
    try {
      for (const it of list) {
        await exportItem(it);
        await new Promise(r => setTimeout(r, 350)); // browsers block rapid-fire downloads
      }
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof Settings) => (v: number) => { setS(p => ({ ...p, [k]: v })); setPreset('custom'); };

  if (!items.length) {
    return (
      <div className="space-y-4">
        <FileDrop onFiles={addFiles} multiple paste accept="image/*" label="Choose photos" hint="One photo or a whole photo dump · edited on your device" />
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    );
  }

  // A plain render helper (not a component) so the range inputs keep focus while dragging.
  const slider = (label: string, k: keyof Settings, min: number, max: number, fmt?: (v: number) => string, step = 0.01) => (
    <div key={k}>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500 tabular-nums">{fmt ? fmt(s[k]) : `${Math.round(s[k] * 100)}%`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={s[k]} onChange={e => set(k)(Number(e.target.value))} className="w-full accent-brand-600" aria-label={label} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="space-y-3 min-w-0">
        <div className="rounded-2xl bg-slate-900 p-2 sm:p-3 flex items-center justify-center min-h-[300px]">
          <canvas ref={previewRef} className="max-w-full max-h-[70vh] h-auto rounded-lg" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <div key={it.thumb} className="relative shrink-0">
              <button type="button" onClick={() => setActive(i)}
                className={cn('block w-16 h-16 rounded-lg overflow-hidden border-2', i === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.thumb} alt="" className="w-full h-full object-cover" />
              </button>
              <button type="button" onClick={() => removeItem(i)} aria-label="Remove photo"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <label className="shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-600 cursor-pointer" aria-label="Add photos">
            <Plus className="w-5 h-5" />
            <input type="file" accept="image/*" multiple className="sr-only" onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
          </label>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>

      <Panel className="space-y-5 lg:sticky lg:top-20">
        <div>
          <Label>Look</Label>
          <Segmented size="sm" value={preset} onChange={v => { setPreset(v); if (PRESETS[v]) setS(PRESETS[v].s); }}
            options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))} />
        </div>
        <div className="space-y-3">
          {slider('Flash', 'flash', 0, 1)}
          {slider('Dark edges', 'vignette', 0, 1)}
          {slider('Warmth', 'warmth', -1, 1, v => (Math.round(v * 100) === 0 ? '0' : v > 0 ? `+${Math.round(v * 100)}` : `${Math.round(v * 100)}`))}
          {slider('Colour', 'saturation', 0.6, 1.6, v => `${Math.round(v * 100)}%`)}
          {slider('Grain', 'grain', 0, 1)}
          {slider('Colour fringing', 'fringe', 0, 1)}
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <Checkbox checked={stampOn} onChange={setStampOn} label="Orange date stamp" />
          {stampOn && (
            <div className="grid grid-cols-2 gap-2">
              <Select value={stampFmt} onChange={e => setStampFmt(e.target.value as StampFormat)} aria-label="Date format">
                <option value="ymd">&apos;YY MM DD</option>
                <option value="dmy">DD MM &apos;YY</option>
                <option value="mdy">MM DD &apos;YY</option>
              </Select>
              <TextInput type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} aria-label="Stamp date"
                placeholder={current ? toDateInput(current.date) : ''} />
            </div>
          )}
          {stampOn && <p className="text-xs text-slate-500">Leave the date empty to use each photo’s own date.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <Label>Camera size</Label>
            <Select value={res} onChange={e => setRes(e.target.value as Res)}>
              <option value="3">3 MP (authentic)</option>
              <option value="5">5 MP</option>
              <option value="full">Full size</option>
            </Select>
          </div>
          <div>
            <Label>JPEG crunch</Label>
            <Select value={String(crunch)} onChange={e => setCrunch(Number(e.target.value))}>
              <option value="0.9">Clean</option>
              <option value="0.72">Normal</option>
              <option value="0.45">Crunchy</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full" disabled={busy || !current} onClick={() => current && exportAll([current])}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download this photo
          </Button>
          {items.length > 1 && (
            <Button variant="secondary" className="w-full" disabled={busy} onClick={() => exportAll(items)}>
              Download all {items.length}
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
