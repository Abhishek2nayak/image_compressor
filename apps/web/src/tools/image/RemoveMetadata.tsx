'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2, Shield, CheckCircle2, X, ImageIcon } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

type FileStatus = 'queued' | 'processing' | 'done' | 'failed';

interface FileResult {
  id: string;
  file: File;
  status: FileStatus;
  blob?: Blob;
  cleanSize?: number;
}

async function stripMetadata(file: File): Promise<Blob> {
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
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), mime, 0.95);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Load failed')); };
    img.src = src;
  });
}

export default function RemoveMetadataPage() {
  const [files, setFiles] = useState<FileResult[]>([]);
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
    accept: { 'image/jpeg': [], 'image/jpg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 50 * 1024 * 1024,
    noClick: true,
    onDropRejected: () => toast.error('JPEG, PNG or WebP only, max 50 MB each'),
  });

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  async function handleStrip() {
    if (!files.length || processing) return;
    setProcessing(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'queued', blob: undefined })));

    for (const item of files) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));
      try {
        const blob = await stripMetadata(item.file);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', blob, cleanSize: blob.size } : f));
      } catch {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
      }
    }
    setProcessing(false);
  }

  function downloadFile(item: FileResult) {
    if (!item.blob) return;
    const ext = item.file.type === 'image/png' ? 'png' : 'jpg';
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.file.name.replace(/\.[^.]+$/, '') + `-clean.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    files.filter(f => f.status === 'done').forEach(downloadFile);
  }

  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div>

      <div className="max-w-3xl">

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
          <p className="text-sm text-brand-700">Your images are processed locally. GPS coordinates, device info, and timestamps are removed by redrawing the image on canvas.</p>
        </div>

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
          <input id="rm-pick" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
            onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
          <label htmlFor="rm-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-8 py-3 font-bold text-sm shadow-md cursor-pointer inline-block">Select Images</label>
          <p className="text-xs text-slate-400 mt-3">JPEG · PNG · WebP · Max 50 MB each</p>
        </div>

        {files.length > 0 && (
          <>
            <div className="space-y-2 mb-5">
              {files.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(item.file.size)}</p>
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
              <button
                onClick={handleStrip}
                disabled={processing}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : 'Remove Metadata'}
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
