'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2 } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'failed'>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [progress, setProgress] = useState('');

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
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
    onDropRejected: () => toast.error('JPEG, PNG or WebP, max 20 MB'),
  });

  async function handleRemoveBg() {
    if (!file || status === 'processing') return;
    setStatus('processing');
    setProgress('Loading AI model…');

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      setProgress('Removing background…');

      const blob = await removeBackground(file, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/',
        output: { format: 'image/png', quality: 0.9 },
      });

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      setStatus('done');
      setProgress('');
    } catch (err) {
      setStatus('failed');
      setProgress('');
      toast.error(err instanceof Error ? err.message : 'Background removal failed');
    }
  }

  function downloadResult() {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, '') + '-no-bg.png';
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

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <p className="text-sm text-amber-700">First use downloads the AI model (~40 MB). Subsequent uses are instant. Everything stays on your device.</p>
        </div>

        {!file && (
          <div {...getRootProps()} className="flex flex-col items-center justify-center min-h-[36vh] cursor-pointer">
            <input {...getInputProps()} />
            <div className={cn('w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all', isDragActive ? 'bg-brand-100 scale-110 border-2 border-brand-300' : 'bg-white border-2 border-dashed border-slate-200')}>
              <Upload className={cn('w-10 h-10', isDragActive ? 'text-brand-500' : 'text-slate-300')} />
            </div>
            <p className="text-slate-400 text-sm mb-4">{isDragActive ? 'Drop image here' : 'Drag & drop an image or click to select'}</p>
            <input id="rmbg-pick" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
            <label htmlFor="rmbg-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm shadow-lg cursor-pointer inline-block">Select Image</label>
            <span className="text-xs text-slate-400 mt-3">JPEG · PNG · WebP · Max 20 MB · 100% In-Browser</span>
          </div>
        )}

        {file && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 text-center">Original</p>
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Original" className="w-full max-h-48 object-contain rounded-xl bg-slate-100" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 text-center">Result</p>
                <div className="w-full max-h-48 rounded-xl overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGklEQVQoU2NkYGD4z8BQDwAEgAF/QualIIAAAAABJRU5ErkJggg==')] bg-repeat flex items-center justify-center">
                  {resultUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultUrl} alt="Result" className="w-full max-h-48 object-contain" />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-300 text-sm">Preview</div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5">{file.name} · {formatBytes(file.size)}</p>

            {status === 'idle' && (
              <button onClick={handleRemoveBg}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                Remove Background
              </button>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                <p className="text-sm font-medium text-slate-600">{progress || 'Processing…'}</p>
                <p className="text-xs text-slate-400">This may take 10–30 seconds on the first run</p>
              </div>
            )}

            {status === 'done' && resultUrl && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-green-700">Background removed! PNG · {formatBytes(resultSize)}</p>
                </div>
                <button onClick={downloadResult}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">
                  Remove Another
                </button>
              </div>
            )}

            {status === 'failed' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-red-700">Failed to remove background</p>
                </div>
                <button onClick={() => setStatus('idle')} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">Try Again</button>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-500 rounded-xl py-2.5 text-sm hover:bg-slate-50">Try Another Image</button>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-5">100% in-browser · Files never uploaded to any server</p>
          </div>
        )}
      </div>
    </div>
  );
}
