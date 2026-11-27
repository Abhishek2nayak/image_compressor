'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2 } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

type Position = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'top-left',     label: 'Top Left' },
  { value: 'top-right',    label: 'Top Right' },
  { value: 'center',       label: 'Center' },
  { value: 'bottom-left',  label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

async function applyWatermark(
  file: File,
  text: string,
  fontSize: number,
  opacity: number,
  color: string,
  position: Position,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const scaledFontSize = Math.max(12, (fontSize / 100) * Math.min(canvas.width, canvas.height));
      ctx.font = `bold ${scaledFontSize}px sans-serif`;
      ctx.globalAlpha = opacity / 100;

      const hex = color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = `rgba(${r < 128 ? 255 : 0},${r < 128 ? 255 : 0},${r < 128 ? 255 : 0},0.4)`;
      ctx.lineWidth = scaledFontSize / 20;

      const measured = ctx.measureText(text);
      const tw = measured.width;
      const th = scaledFontSize;
      const pad = scaledFontSize * 0.8;

      let x = 0, y = 0;
      if (position === 'top-left')     { x = pad; y = th + pad; }
      if (position === 'top-right')    { x = canvas.width - tw - pad; y = th + pad; }
      if (position === 'center')       { x = (canvas.width - tw) / 2; y = (canvas.height + th) / 2; }
      if (position === 'bottom-left')  { x = pad; y = canvas.height - pad; }
      if (position === 'bottom-right') { x = canvas.width - tw - pad; y = canvas.height - pad; }

      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);

      const mime = file.type || 'image/jpeg';
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), mime, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Failed to load image')); };
    img.src = src;
  });
}

export default function WatermarkImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('© VYOOOM');
  const [fontSize, setFontSize] = useState(5);
  const [opacity, setOpacity] = useState(70);
  const [color, setColor] = useState('#ffffff');
  const [position, setPosition] = useState<Position>('bottom-right');
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [preview, resultUrl]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
    onDropRejected: () => toast.error('Image files only, max 50 MB'),
  });

  async function handleWatermark() {
    if (!file || status === 'processing' || !text.trim()) return;
    setStatus('processing');
    try {
      const blob = await applyWatermark(file, text, fontSize, opacity, color, position);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      setStatus('done');
    } catch {
      toast.error('Watermark failed');
      setStatus('idle');
    }
  }

  function downloadResult() {
    if (!resultUrl || !file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, '') + `-watermarked.${ext}`;
    a.click();
  }

  function clearAll() {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPreview(null); setResultUrl(null); setStatus('idle');
  }

  return (
    <div>

      <div className="max-w-3xl">

        {!file && (
          <div {...getRootProps()} className="flex flex-col items-center justify-center min-h-[36vh] cursor-pointer">
            <input {...getInputProps()} />
            <div className={cn('w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all', isDragActive ? 'bg-brand-100 scale-110 border-2 border-brand-300' : 'bg-white border-2 border-dashed border-slate-200')}>
              <Upload className={cn('w-10 h-10', isDragActive ? 'text-brand-500' : 'text-slate-300')} />
            </div>
            <p className="text-slate-400 text-sm mb-4">{isDragActive ? 'Drop image here' : 'Drag & drop an image or click to select'}</p>
            <input id="wm-pick" type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
            <label htmlFor="wm-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm shadow-lg cursor-pointer inline-block">Select Image</label>
          </div>
        )}

        {file && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={status === 'done' && resultUrl ? resultUrl : preview} alt="Preview" className="w-full max-h-56 object-contain rounded-xl bg-slate-50 mb-6" />
            )}
            <p className="text-xs text-slate-500 mb-5">{file.name} · {formatBytes(file.size)}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Watermark Text</label>
                <input value={text} onChange={e => { setText(e.target.value); setStatus('idle'); }}
                  disabled={status === 'processing'}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Font size: {fontSize}%</label>
                  <input type="range" min={2} max={20} value={fontSize}
                    onChange={e => { setFontSize(Number(e.target.value)); setStatus('idle'); }}
                    disabled={status === 'processing'} className="w-full accent-brand-600" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Opacity: {opacity}%</label>
                  <input type="range" min={10} max={100} step={5} value={opacity}
                    onChange={e => { setOpacity(Number(e.target.value)); setStatus('idle'); }}
                    disabled={status === 'processing'} className="w-full accent-brand-600" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Color</label>
                  <input type="color" value={color} onChange={e => { setColor(e.target.value); setStatus('idle'); }}
                    disabled={status === 'processing'} className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Position</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {POSITIONS.map(p => (
                      <button key={p.value} onClick={() => { setPosition(p.value); setStatus('idle'); }}
                        className={cn('rounded-lg py-1.5 text-xs font-medium border transition-all', position === p.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300')}>
                        {p.label.split(' ')[0]}<br />{p.label.split(' ')[1] || ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {status !== 'done' && (
              <button onClick={handleWatermark} disabled={status === 'processing' || !text.trim()}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-sm shadow-md flex items-center justify-center gap-2">
                {status === 'processing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</> : 'Apply Watermark'}
              </button>
            )}

            {status === 'done' && resultUrl && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-green-700">Watermark applied! {formatBytes(resultSize)}</p>
                </div>
                <button onClick={downloadResult}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                  <Download className="w-4 h-4" /> Download Image
                </button>
                <button onClick={() => setStatus('idle')} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">
                  Adjust Settings
                </button>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-500 rounded-xl py-2.5 text-sm hover:bg-slate-50">
                  Watermark Another
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-5">100% in-browser · Files never uploaded to any server</p>
          </div>
        )}
      </div>
    </div>
  );
}
