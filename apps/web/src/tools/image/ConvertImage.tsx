'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2, X, ImageIcon, CheckCircle2 } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const FORMATS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/png',  label: 'PNG',  ext: 'png' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

type FileStatus = 'queued' | 'processing' | 'done' | 'failed';

interface FileResult {
  id: string;
  file: File;
  status: FileStatus;
  blob?: Blob;
  outputSize?: number;
}

async function convertFile(file: File, format: OutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const q = format === 'image/png' ? undefined : quality / 100;
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Conversion failed')), format, q);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Load failed')); };
    img.src = src;
  });
}

export default function ConvertImagePage() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: FileResult[] = accepted.map(f => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      status: 'queued' as FileStatus,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 50 * 1024 * 1024,
    noClick: true,
    onDropRejected: () => toast.error('Image files only, max 50 MB each'),
  });

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  async function handleConvert() {
    if (!files.length || processing) return;
    setProcessing(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'queued', blob: undefined })));

    for (const item of files) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));
      try {
        const blob = await convertFile(item.file, outputFormat, quality);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', blob, outputSize: blob.size } : f));
      } catch {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
      }
    }
    setProcessing(false);
  }

  function downloadFile(item: FileResult) {
    if (!item.blob) return;
    const fmt = FORMATS.find(f => f.value === outputFormat)!;
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.file.name.replace(/\.[^.]+$/, '') + `.${fmt.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    files.filter(f => f.status === 'done').forEach(downloadFile);
  }

  const doneCount = files.filter(f => f.status === 'done').length;
  const selectedFmt = FORMATS.find(f => f.value === outputFormat)!;

  return (
    <div>

      <div className="max-w-3xl">

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6',
            isDragActive ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300',
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragActive ? 'text-brand-500' : 'text-slate-300')} />
          <p className="text-sm text-slate-500 mb-3">{isDragActive ? 'Drop images here' : 'Drag & drop images, or click to select'}</p>
          <input id="conv-pick" type="file" accept="image/*" multiple className="sr-only"
            onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
          <label htmlFor="conv-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-8 py-3 font-bold text-sm shadow-md cursor-pointer inline-block">Select Images</label>
          <p className="text-xs text-slate-400 mt-3">Any image format · Max 50 MB each</p>
        </div>

        {files.length > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
              <p className="text-sm font-bold text-slate-700 mb-3">Convert to</p>
              <div className="flex gap-3 mb-5">
                {FORMATS.map(fmt => (
                  <button key={fmt.value} onClick={() => setOutputFormat(fmt.value)} disabled={processing}
                    className={cn('rounded-xl px-6 py-2.5 text-sm font-bold border transition-all', outputFormat === fmt.value ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300')}>
                    {fmt.label}
                  </button>
                ))}
              </div>

              {outputFormat !== 'image/png' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">Quality: {quality}%</span>
                  </div>
                  <input type="range" min={10} max={100} step={5} value={quality}
                    onChange={e => setQuality(Number(e.target.value))} disabled={processing}
                    className="w-full accent-brand-600" />
                </>
              )}
            </div>

            <div className="space-y-2 mb-5">
              {files.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatBytes(item.file.size)}</span>
                      {item.status === 'done' && item.outputSize && (
                        <><span>→</span><span className="text-brand-600 font-medium">{formatBytes(item.outputSize)} .{selectedFmt.ext}</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'processing' && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
                    {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {item.status === 'done' && (
                      <button onClick={() => downloadFile(item)} className="text-xs bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium px-3 py-1.5 rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!processing && (
                      <button onClick={() => removeFile(item.id)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleConvert} disabled={processing}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-sm shadow-md flex items-center justify-center gap-2">
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</> : `Convert to ${selectedFmt.label}`}
              </button>
              {doneCount > 1 && (
                <button onClick={downloadAll} className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-5 font-bold text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> All
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">100% in-browser · Files never uploaded to any server</p>
          </>
        )}
      </div>
    </div>
  );
}
