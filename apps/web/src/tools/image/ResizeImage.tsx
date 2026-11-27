'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2, Lock, Unlock } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

export default function ResizeImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [mode, setMode] = useState<'px' | 'pct'>('px');
  const [percent, setPercent] = useState(50);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const resultRef = useRef<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setStatus('idle');
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    setResultUrl(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setOrigW(img.naturalWidth);
      setOrigH(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
    onDropRejected: () => toast.error('Image files only, max 50 MB'),
  });

  function handleWidthChange(val: number) {
    setWidth(val);
    if (lockAspect && origW > 0) setHeight(Math.round((val / origW) * origH));
  }

  function handleHeightChange(val: number) {
    setHeight(val);
    if (lockAspect && origH > 0) setWidth(Math.round((val / origH) * origW));
  }

  async function handleResize() {
    if (!file || status === 'processing') return;
    setStatus('processing');

    try {
      const targetW = mode === 'pct' ? Math.round(origW * percent / 100) : width;
      const targetH = mode === 'pct' ? Math.round(origH * percent / 100) : height;

      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = URL.createObjectURL(file);
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const mime = file.type || 'image/jpeg';
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), mime, 0.92)
      );

      if (resultRef.current) URL.revokeObjectURL(resultRef.current);
      const url = URL.createObjectURL(blob);
      resultRef.current = url;
      setResultUrl(url);
      setResultSize(blob.size);
      setStatus('done');
    } catch {
      toast.error('Failed to resize image');
      setStatus('idle');
    }
  }

  function downloadResult() {
    if (!resultUrl || !file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, '') + `-resized.${ext}`;
    a.click();
  }

  function clearAll() {
    if (preview) URL.revokeObjectURL(preview);
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
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
            <input id="ri-pick" type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
            <label htmlFor="ri-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm shadow-lg cursor-pointer inline-block">Select Image</label>
            <span className="text-xs text-slate-400 mt-3">Any image format · Max 50 MB · 100% In-Browser</span>
          </div>
        )}

        {file && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="w-full max-h-56 object-contain rounded-xl bg-slate-50 mb-6" />
            )}

            <p className="text-xs text-slate-500 mb-5">Original: {origW} × {origH} px · {formatBytes(file.size)}</p>

            <div className="flex gap-2 mb-6">
              {(['px', 'pct'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} disabled={status === 'processing'}
                  className={cn('rounded-xl px-5 py-2.5 text-sm font-bold border transition-all', mode === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300')}>
                  {m === 'px' ? 'Pixels' : 'Percentage'}
                </button>
              ))}
            </div>

            {mode === 'px' ? (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Width (px)</label>
                  <input type="number" value={width} min={1} max={10000}
                    onChange={e => handleWidthChange(Number(e.target.value))}
                    disabled={status === 'processing'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <button onClick={() => setLockAspect(!lockAspect)} className="mt-5 text-slate-400 hover:text-brand-600 p-2">
                  {lockAspect ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Height (px)</label>
                  <input type="number" value={height} min={1} max={10000}
                    onChange={e => handleHeightChange(Number(e.target.value))}
                    disabled={status === 'processing'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-700">Scale: {percent}%</label>
                  <span className="text-xs text-slate-400">{Math.round(origW * percent / 100)} × {Math.round(origH * percent / 100)} px</span>
                </div>
                <input type="range" min={5} max={200} step={5} value={percent}
                  onChange={e => setPercent(Number(e.target.value))}
                  disabled={status === 'processing'}
                  className="w-full accent-brand-600" />
              </div>
            )}

            {status !== 'done' && (
              <button onClick={handleResize} disabled={status === 'processing'}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-sm shadow-md flex items-center justify-center gap-2">
                {status === 'processing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Resizing…</> : 'Resize Image'}
              </button>
            )}

            {status === 'done' && resultUrl && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-green-700">Done! {formatBytes(resultSize)}</p>
                </div>
                <button onClick={downloadResult}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                  <Download className="w-4 h-4" /> Download Resized Image
                </button>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">
                  Resize Another
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
