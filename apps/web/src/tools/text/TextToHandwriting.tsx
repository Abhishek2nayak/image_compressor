'use client';

import { useEffect, useRef, useState } from 'react';
import { Caveat, Homemade_Apple, Indie_Flower, Kalam, Shadows_Into_Light } from 'next/font/google';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { Button, Label, Panel, Segmented, Select, SliderField, TextArea } from '@/components/tool/ui';
import { downloadBlob, canvasToBlob } from '@/lib/image';

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '500'] });
const indie = Indie_Flower({ subsets: ['latin'], weight: '400' });
const kalam = Kalam({ subsets: ['latin', 'devanagari'], weight: ['300', '400'] });
const shadows = Shadows_Into_Light({ subsets: ['latin'], weight: '400' });
const apple = Homemade_Apple({ subsets: ['latin'], weight: '400' });

const FONTS = [
  { id: 'caveat', label: 'Neat (Caveat)', family: caveat.style.fontFamily, scale: 1.15 },
  { id: 'kalam', label: 'Student (Kalam · हिन्दी)', family: kalam.style.fontFamily, scale: 0.95 },
  { id: 'indie', label: 'Rounded (Indie Flower)', family: indie.style.fontFamily, scale: 1 },
  { id: 'shadows', label: 'Quick (Shadows)', family: shadows.style.fontFamily, scale: 1.05 },
  { id: 'apple', label: 'Cursive (Homemade Apple)', family: apple.style.fontFamily, scale: 0.78 },
];
const INKS = [
  { id: 'blue', label: 'Blue ink', color: '#1f3a93' },
  { id: 'black', label: 'Black ink', color: '#1b1b1f' },
  { id: 'darkblue', label: 'Royal blue', color: '#0b2a6f' },
  { id: 'red', label: 'Red ink', color: '#b3261e' },
  { id: 'green', label: 'Green ink', color: '#1e6b3a' },
];
type Paper = 'ruled' | 'plain' | 'grid';

const W = 1240, H = 1754;          // A4 at 150 dpi
const LEFT = 170, RIGHT = 90, TOP = 190, LINE = 62;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function drawPaper(ctx: CanvasRenderingContext2D, paper: Paper) {
  ctx.fillStyle = '#fdfcf7';
  ctx.fillRect(0, 0, W, H);
  if (paper === 'ruled') {
    ctx.strokeStyle = '#a9c4e3'; ctx.lineWidth = 2;
    for (let y = TOP; y < H - 60; y += LINE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = '#e39a9a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(LEFT - 30, 0); ctx.lineTo(LEFT - 30, H); ctx.stroke();
  } else if (paper === 'grid') {
    ctx.strokeStyle = '#d6e2ef'; ctx.lineWidth = 1.5;
    for (let y = TOP % (LINE / 2); y < H; y += LINE / 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += LINE / 2) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  }
}

/** Lay out and draw text across as many pages as needed. */
function render(text: string, fontFamily: string, size: number, ink: string, paper: Paper, mess: number): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  let ctx: CanvasRenderingContext2D | null = null;
  let y = 0;
  const newPage = () => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    ctx = c.getContext('2d')!;
    drawPaper(ctx, paper);
    ctx.font = `${size}px ${fontFamily}`;
    ctx.fillStyle = ink;
    ctx.textBaseline = 'alphabetic';
    pages.push(c);
    y = TOP - 10;
  };
  newPage();
  const rand = rng(1234);
  const maxX = W - RIGHT;
  const paragraphs = text.replace(/\r/g, '').split('\n');
  for (const para of paragraphs) {
    const words = para.split(/(\s+)/).filter(w => w.length);
    let x = LEFT + (rand() - 0.5) * 6 * mess;
    for (const w of words) {
      const c = ctx!;
      if (/^\s+$/.test(w)) { x += c.measureText(' ').width * (0.9 + rand() * 0.3 * mess); continue; }
      const width = c.measureText(w).width;
      if (x + width > maxX && x > LEFT + 20) {
        y += LINE;
        if (y > H - 80) newPage();
        x = LEFT + (rand() - 0.5) * 6 * mess;
      }
      const cc = ctx!;
      cc.save();
      cc.translate(x, y + (rand() - 0.5) * 5 * mess);
      cc.rotate((rand() - 0.5) * 0.035 * mess);
      cc.globalAlpha = 0.86 + rand() * 0.14;
      cc.fillText(w, 0, 0);
      cc.restore();
      x += width;
    }
    y += LINE;
    if (y > H - 80) newPage();
  }
  return pages;
}

const SAMPLE = 'The water cycle\n\nWater evaporates from oceans, lakes and rivers when the sun heats it. The vapour rises, cools and condenses into clouds. When the droplets grow heavy, they fall back to the earth as rain, snow or hail. This process repeats again and again, which is why we call it a cycle.';

export default function TextToHandwriting() {
  const [text, setText] = useState(SAMPLE);
  const [font, setFont] = useState(FONTS[0].id);
  const [ink, setInk] = useState(INKS[0].id);
  const [paper, setPaper] = useState<Paper>('ruled');
  const [size, setSize] = useState('40');
  const [mess, setMess] = useState('1');
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const canvases = useRef<HTMLCanvasElement[]>([]);

  useEffect(() => {
    let cancelled = false;
    const f = FONTS.find(x => x.id === font)!;
    const px = Math.round(Number(size) * f.scale);
    const t = setTimeout(async () => {
      try { await document.fonts.load(`${px}px ${f.family}`, text.slice(0, 50) || 'a'); } catch { /* draw with fallback */ }
      if (cancelled) return;
      const list = render(text, f.family, px, INKS.find(i => i.id === ink)!.color, paper, Number(mess));
      canvases.current = list;
      setPages(list.map(c => c.toDataURL('image/jpeg', 0.8)));
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [text, font, ink, paper, size, mess]);

  async function downloadPng() {
    for (let i = 0; i < canvases.current.length; i++) {
      downloadBlob(await canvasToBlob(canvases.current[i], 'image/png'), `handwriting-page-${i + 1}.png`);
    }
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      canvases.current.forEach((c, i) => {
        if (i) pdf.addPage();
        pdf.addImage(c.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297);
      });
      pdf.save('handwriting.pdf');
    } finally { setBusy(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4 items-start">
      <Panel className="space-y-4 lg:sticky lg:top-20">
        <div>
          <Label htmlFor="hw-text">Your text</Label>
          <TextArea id="hw-text" rows={8} value={text} onChange={e => setText(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hw-font">Handwriting</Label>
            <Select id="hw-font" value={font} onChange={e => setFont(e.target.value)}>
              {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="hw-ink">Ink</Label>
            <Select id="hw-ink" value={ink} onChange={e => setInk(e.target.value)}>
              {INKS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label>Paper</Label>
          <Segmented value={paper} onChange={setPaper} options={[{ value: 'ruled', label: 'Ruled' }, { value: 'plain', label: 'Plain' }, { value: 'grid', label: 'Grid' }]} />
        </div>
        <SliderField id="hw-size" label="Text size" value={size} onChange={setSize} min={28} max={56} />
        <SliderField id="hw-mess" label="Natural wobble" value={mess} onChange={setMess} min={0} max={2.5} step={0.1} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadPdf} disabled={busy || !pages.length}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}PDF</Button>
          <Button variant="secondary" onClick={downloadPng} disabled={!pages.length}><Download className="w-4 h-4" />PNG{pages.length > 1 ? ` (${pages.length})` : ''}</Button>
        </div>
      </Panel>

      <div className="space-y-4">
        {pages.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt={`Handwritten page ${i + 1}`} className="w-full rounded-xl border border-slate-200 shadow-sm bg-white" />
        ))}
        {pages.length > 1 && <p className="text-sm text-slate-500 text-center">{pages.length} pages</p>}
      </div>
    </div>
  );
}
