'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Download, ImagePlus, RotateCcw, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ErrorNote, Label, Panel, Segmented, TextInput } from '@/components/tool/ui';
import { canvasToBlob, downloadBlob, loadImage } from '@/lib/image';
import { canShareFiles, fitText, fontsReady, pageFont, shareImage } from '@/lib/share';
import { useMounted } from '@/lib/tool-helpers';

type Layout = 'strip4' | 'strip3' | 'grid' | 'double';
type Filter = 'none' | 'bw' | 'warm' | 'flash';

const LAYOUTS: Record<Layout, { label: string; shots: number }> = {
  strip4: { label: 'Strip of 4', shots: 4 },
  strip3: { label: 'Strip of 3', shots: 3 },
  grid:   { label: '2×2 grid', shots: 4 },
  double: { label: 'Double strip', shots: 4 },
};

const FRAMES = [
  { name: 'White', bg: '#ffffff', ink: '#1a1715' },
  { name: 'Black', bg: '#141210', ink: '#f5f3f0' },
  { name: 'Cream', bg: '#f3ead8', ink: '#3b3633' },
  { name: 'Ember', bg: '#cf440d', ink: '#fff5ef' },
  { name: 'Blush', bg: '#f6d3d8', ink: '#5a2430' },
  { name: 'Mint',  bg: '#d4eedf', ink: '#1f4a35' },
];

type Shot = HTMLImageElement | HTMLCanvasElement;
const dims = (s: Shot) => (s instanceof HTMLImageElement ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height]);

function drawCover(ctx: CanvasRenderingContext2D, src: Shot, x: number, y: number, w: number, h: number) {
  const [sw, sh] = dims(src);
  const s = Math.max(w / sw, h / sh);
  const cw = w / s, ch = h / s;
  ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h);
}

function applyFilter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: Filter) {
  if (f === 'none') return;
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const cx = w / 2, cy = h / 2, maxD = Math.hypot(cx, cy);
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    if (f === 'bw') {
      const v = (l - 128) * 1.18 + 128;
      r = g = b = v;
    } else if (f === 'warm') {
      r = l + (r - l) * 0.8 + 18; g = l + (g - l) * 0.8 + 6; b = l + (b - l) * 0.8 - 14;
    } else if (f === 'flash') {
      const p = i / 4, px = p % w, py = (p / w) | 0;
      const dd = Math.hypot(px - cx, py - cy * 0.85) / maxD;
      const gain = (1 + 0.45 * Math.max(0, 1 - dd * dd * 1.8)) * (1 - 0.45 * dd * dd);
      r = (r * gain - 128) * 1.15 + 134; g = (g * gain - 128) * 1.15 + 128; b = (b * gain - 128) * 1.15 + 124;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, x, y);
}

async function compose(shots: Shot[], layout: Layout, frame: typeof FRAMES[number], filter: Filter, caption: string, showDate: boolean): Promise<HTMLCanvasElement> {
  await fontsReady();
  const font = pageFont();
  const n = LAYOUTS[layout].shots;
  const pad = 40, gap = 24, footer = caption || showDate ? 170 : 60;
  let W: number, H: number;
  const cells: { x: number; y: number; w: number; h: number }[] = [];

  if (layout === 'grid') {
    const cw = 560, chh = 700;
    W = pad * 2 + cw * 2 + gap; H = pad * 2 + chh * 2 + gap + footer;
    for (let i = 0; i < 4; i++) cells.push({ x: pad + (i % 2) * (cw + gap), y: pad + Math.floor(i / 2) * (chh + gap), w: cw, h: chh });
  } else {
    const cw = 600, chh = 450;
    const cols = layout === 'double' ? 2 : 1;
    const stripW = pad * 2 + cw;
    W = stripW * cols; H = pad + n * chh + (n - 1) * gap + footer;
    for (let c = 0; c < cols; c++) for (let i = 0; i < n; i++) cells.push({ x: c * stripW + pad, y: pad + i * (chh + gap), w: cw, h: chh });
  }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';

  cells.forEach((c, i) => {
    const shot = shots[i % n];
    if (shot) {
      drawCover(ctx, shot, c.x, c.y, c.w, c.h);
      applyFilter(ctx, c.x, c.y, c.w, c.h, filter);
    } else {
      ctx.fillStyle = 'rgba(128,128,128,0.18)';
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }
  });

  if (layout === 'double') {
    ctx.strokeStyle = 'rgba(128,128,128,0.35)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);
  }

  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const groups = layout === 'double' ? [0, W / 2] : [0];
  const gw = layout === 'double' ? W / 2 : W;
  for (const gx of groups) {
    ctx.fillStyle = frame.ink;
    ctx.textAlign = 'center';
    const mid = gx + gw / 2;
    if (caption) {
      ctx.font = `700 54px ${font}`;
      ctx.fillText(fitText(ctx, caption, gw - pad * 2), mid, H - footer + 92);
    }
    if (showDate) {
      ctx.globalAlpha = 0.7;
      ctx.font = `500 32px ${font}`;
      ctx.fillText(date, mid, H - footer + (caption ? 140 : 100));
      ctx.globalAlpha = 1;
    }
  }
  ctx.textAlign = 'left';
  return canvas;
}

export default function PhotoBoothStrip() {
  const [layout, setLayout] = useState<Layout>('strip4');
  const [shots, setShots] = useState<Shot[]>([]);
  const [frame, setFrame] = useState(0);
  const [filter, setFilter] = useState<Filter>('none');
  const [caption, setCaption] = useState('');
  const [showDate, setShowDate] = useState(true);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState('');

  // camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const shootingRef = useRef(false);

  const need = LAYOUTS[layout].shots;
  const mounted = useMounted();

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  useEffect(() => {
    let cancelled = false;
    compose(shots, layout, FRAMES[frame], filter, caption.trim(), showDate)
      .then(c => canvasToBlob(c, 'image/jpeg', 0.92))
      .then(blob => {
        if (cancelled) return;
        setResult(old => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob) }; });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [shots, layout, frame, filter, caption, showDate]);

  async function addFiles(files: FileList | null) {
    setError('');
    const imgs: Shot[] = [];
    for (const f of Array.from(files ?? [])) {
      try { imgs.push(await loadImage(f)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not open an image.'); }
    }
    setShots(prev => [...prev, ...imgs].slice(-need));
  }

  // Attach the stream once the <video> has actually rendered. (Setting it in the
  // same tick as setCamOn raced the render on phones and left a black box.)
  useEffect(() => {
    const v = videoRef.current;
    const stream = streamRef.current;
    if (!camOn || !v || !stream) return;
    v.srcObject = stream;
    const play = () => { v.play().catch(() => {}); };
    if (v.readyState >= 1) play(); else v.addEventListener('loadedmetadata', play, { once: true });
    return () => v.removeEventListener('loadedmetadata', play);
  }, [camOn]);

  async function startCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser can’t open the camera here. Make sure the page is on https, or upload photos instead.');
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      } catch (e) {
        // Some phones reject the size hints; retry with any camera.
        if ((e as DOMException)?.name === 'NotAllowedError') throw e;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setCamOn(true);
    } catch (e) {
      setError((e as DOMException)?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access for this site in your browser settings, or upload photos instead.'
        : 'No camera was found or it’s in use by another app. You can upload photos instead.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamOn(false); setCount(null);
    shootingRef.current = false;
  }

  function snap(): HTMLCanvasElement | null {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    ctx.translate(c.width, 0); ctx.scale(-1, 1); // mirror, like the preview
    ctx.drawImage(v, 0, 0);
    return c;
  }

  async function shootSequence() {
    if (shootingRef.current) return;
    shootingRef.current = true;
    setShots([]);
    const taken: Shot[] = [];
    for (let i = 0; i < need && shootingRef.current; i++) {
      for (let s = 3; s > 0 && shootingRef.current; s--) { setCount(s); await new Promise(r => setTimeout(r, 800)); }
      if (!shootingRef.current) break;
      setCount(0);
      const shot = snap();
      setFlash(true); setTimeout(() => setFlash(false), 180);
      if (shot) { taken.push(shot); setShots([...taken]); }
      await new Promise(r => setTimeout(r, 700));
    }
    setCount(null);
    shootingRef.current = false;
    if (taken.length >= need) stopCamera();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
      <div className="space-y-4 min-w-0">
        <Panel className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!camOn ? (
              <Button onClick={startCamera}><Camera className="w-4 h-4" /> Use camera</Button>
            ) : (
              <>
                <Button onClick={shootSequence} disabled={count !== null}><Camera className="w-4 h-4" /> {count !== null ? 'Shooting…' : `Take ${need} photos`}</Button>
                <Button variant="secondary" onClick={stopCamera}><X className="w-4 h-4" /> Close camera</Button>
              </>
            )}
            <label className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 min-h-11 sm:min-h-10 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
              <ImagePlus className="w-4 h-4" /> Upload photos
              <input type="file" accept="image/*" multiple className="sr-only" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </label>
            {shots.length > 0 && <Button variant="ghost" onClick={() => setShots([])}><RotateCcw className="w-4 h-4" /> Start over</Button>}
          </div>

          {camOn && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
              <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover -scale-x-100" />
              {count !== null && count > 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-8xl font-black drop-shadow-lg">{count}</div>
              )}
              <div className={cn('absolute inset-0 bg-white pointer-events-none transition-opacity duration-150', flash ? 'opacity-90' : 'opacity-0')} />
              <div className="absolute bottom-2 left-2 text-xs font-semibold text-white bg-black/50 rounded-md px-2 py-1">{shots.length}/{need}</div>
            </div>
          )}

          <div className="flex gap-2">
            {Array.from({ length: need }).map((_, i) => (
              <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                {shots[i] && <ShotThumb shot={shots[i]} />}
                {shots[i] && (
                  <button type="button" aria-label="Remove photo" onClick={() => setShots(s => s.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                )}
              </div>
            ))}
            <span className="text-xs text-slate-500 self-center ml-1">{shots.length < need ? `${need - shots.length} more` : 'Ready'}</span>
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
        </Panel>

        <Panel className="space-y-4">
          <div>
            <Label>Layout</Label>
            <Segmented size="sm" value={layout} onChange={v => { setLayout(v); setShots(s => s.slice(0, LAYOUTS[v].shots)); }}
              options={(Object.keys(LAYOUTS) as Layout[]).map(k => ({ value: k, label: LAYOUTS[k].label }))} />
          </div>
          <div>
            <Label>Filter</Label>
            <Segmented size="sm" value={filter} onChange={setFilter}
              options={[{ value: 'none', label: 'Original' }, { value: 'bw', label: 'Black & white' }, { value: 'warm', label: 'Vintage' }, { value: 'flash', label: 'Flash' }]} />
          </div>
          <div>
            <Label>Frame</Label>
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f, i) => (
                <button key={f.name} type="button" onClick={() => setFrame(i)} aria-label={f.name} title={f.name}
                  className={cn('w-9 h-9 rounded-full border-2', i === frame ? 'border-brand-600 ring-2 ring-brand-200' : 'border-slate-200')}
                  style={{ background: f.bg }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <Label htmlFor="pb-caption">Caption</Label>
              <TextInput id="pb-caption" value={caption} maxLength={40} onChange={e => setCaption(e.target.value)} placeholder="Goa trip ’26" />
            </div>
            <label className="inline-flex items-center gap-2 min-h-10 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={showDate} onChange={e => setShowDate(e.target.checked)} className="w-4 h-4 accent-brand-600" /> Date
            </label>
          </div>
        </Panel>
      </div>

      <Panel className="lg:sticky lg:top-20">
        <div className="rounded-xl bg-slate-100 p-3 flex items-center justify-center min-h-[320px]">
          {result
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={result.url} alt="Photo booth strip preview" className="max-h-[65vh] w-auto shadow-lg" />
            : null}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button disabled={!result || shots.length === 0} onClick={() => result && downloadBlob(result.blob, 'photo-booth.jpg')}>
            <Download className="w-4 h-4" /> Download
          </Button>
          <Button variant="secondary" disabled={!result || shots.length === 0} onClick={() => result && shareImage(result.blob, 'photo-booth.jpg')}>
            <Share2 className="w-4 h-4" /> {mounted && canShareFiles() ? 'Share' : 'Save'}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Strips print at 2×6 inches. Double strip prints on a 4×6 photo.</p>
      </Panel>
    </div>
  );
}

function ShotThumb({ shot }: { shot: Shot }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = 128; c.height = 96;
    drawCover(c.getContext('2d')!, shot, 0, 0, 128, 96);
  }, [shot]);
  return <canvas ref={ref} className="w-full h-full" />;
}
