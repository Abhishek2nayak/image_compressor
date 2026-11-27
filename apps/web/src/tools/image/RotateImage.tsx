'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2, RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

type Transform = 'cw90' | 'ccw90' | 'rot180' | 'flipH' | 'flipV';

const TRANSFORMS: { value: Transform; label: string; icon: React.ReactNode }[] = [
  { value: 'cw90',   label: '90° CW',      icon: <RotateCw className="w-5 h-5" /> },
  { value: 'ccw90',  label: '90° CCW',     icon: <RotateCcw className="w-5 h-5" /> },
  { value: 'rot180', label: '180°',         icon: <RotateCw className="w-5 h-5 rotate-180" /> },
  { value: 'flipH',  label: 'Flip Horiz',  icon: <FlipHorizontal className="w-5 h-5" /> },
  { value: 'flipV',  label: 'Flip Vert',   icon: <FlipVertical className="w-5 h-5" /> },
];

async function applyTransform(file: File, transform: Transform): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const isRotate90 = transform === 'cw90' || transform === 'ccw90';
      const canvas = document.createElement('canvas');
      canvas.width  = isRotate90 ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotate90 ? img.naturalWidth  : img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      if (transform === 'cw90') {
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
      } else if (transform === 'ccw90') {
        ctx.translate(0, canvas.height);
        ctx.rotate(-Math.PI / 2);
      } else if (transform === 'rot180') {
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
      } else if (transform === 'flipH') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else if (transform === 'flipV') {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      const mime = file.type || 'image/jpeg';
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), mime, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Load failed')); };
    img.src = src;
  });
}

export default function RotateImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<Transform>('cw90');
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

  async function handleTransform() {
    if (!file || status === 'processing') return;
    setStatus('processing');
    try {
      const blob = await applyTransform(file, selected);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      setStatus('done');
    } catch {
      toast.error('Transform failed');
      setStatus('idle');
    }
  }

  function downloadResult() {
    if (!resultUrl || !file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, '') + `-${selected}.${ext}`;
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
            <input id="rti-pick" type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
            <label htmlFor="rti-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm shadow-lg cursor-pointer inline-block">Select Image</label>
            <span className="text-xs text-slate-400 mt-3">Any image format · Max 50 MB · 100% In-Browser</span>
          </div>
        )}

        {file && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {(status === 'done' && resultUrl ? resultUrl : preview) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={status === 'done' && resultUrl ? resultUrl : preview!} alt="Preview" className="w-full max-h-56 object-contain rounded-xl bg-slate-50 mb-6" />
            )}

            <p className="text-xs text-slate-500 mb-5">{file.name} · {formatBytes(file.size)}</p>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {TRANSFORMS.map(t => (
                <button key={t.value} onClick={() => { setSelected(t.value); setStatus('idle'); }}
                  className={cn('rounded-xl py-3 text-xs font-bold border flex flex-col items-center gap-1.5 transition-all', selected === t.value ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300')}>
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {status !== 'done' && (
              <button onClick={handleTransform} disabled={status === 'processing'}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-sm shadow-md flex items-center justify-center gap-2">
                {status === 'processing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : 'Apply Transform'}
              </button>
            )}

            {status === 'done' && resultUrl && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-green-700">Done! {formatBytes(resultSize)}</p>
                </div>
                <button onClick={downloadResult}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                  <Download className="w-4 h-4" /> Download Image
                </button>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">
                  Edit Another
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
