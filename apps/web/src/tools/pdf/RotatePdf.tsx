'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2, RotateCw, FileText } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

type Rotation = 90 | 180 | 270;

const ROTATION_OPTIONS: { value: Rotation; label: string }[] = [
  { value: 90,  label: '90° Clockwise' },
  { value: 180, label: '180°' },
  { value: 270, label: '90° Counter-Clockwise' },
];

export default function RotatePdfPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<Rotation>(90);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'failed'>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setPdfFile(accepted[0]);
      setStatus('idle');
      setResultUrl(null);
    }
  }, []);

  function clearAll() {
    setPdfFile(null);
    setStatus('idle');
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }

  async function handleRotate() {
    if (!pdfFile || status === 'processing') return;
    setStatus('processing');

    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();

      for (const page of pages) {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + rotation) % 360));
      }

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setStatus('done');
    } catch (err) {
      setStatus('failed');
      toast.error(err instanceof Error ? err.message : 'Failed to rotate PDF');
    }
  }

  function downloadResult() {
    if (!resultUrl || !pdfFile) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = pdfFile.name.replace('.pdf', '') + `-rotated-${rotation}.pdf`;
    a.click();
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [] },
    maxSize: 100 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
    onDropRejected: () => toast.error('Please upload a PDF file (max 100 MB)'),
  });

  return (
    <div>

      <div className="max-w-3xl">

        {!pdfFile && (
          <div {...getRootProps()} className="flex flex-col items-center justify-center min-h-[36vh] cursor-pointer">
            <input {...getInputProps()} />
            <div className={cn('w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all', isDragActive ? 'bg-orange-100 scale-110 border-2 border-orange-300' : 'bg-white border-2 border-dashed border-slate-200')}>
              <Upload className={cn('w-10 h-10', isDragActive ? 'text-orange-500' : 'text-slate-300')} />
            </div>
            <p className="text-slate-400 text-sm mb-4">{isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF or click to select'}</p>
            <input id="rtp-pick" type="file" accept=".pdf,application/pdf" className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
            <label htmlFor="rtp-pick" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-10 py-3.5 font-bold text-sm shadow-lg cursor-pointer inline-block">Select PDF</label>
            <span className="text-xs text-slate-400 mt-3">PDF · Max 100 MB · 100% In-Browser</span>
          </div>
        )}

        {pdfFile && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{pdfFile.name}</p>
                <p className="text-sm text-slate-500">{formatBytes(pdfFile.size)}</p>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-700 mb-3">Rotation</p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {ROTATION_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => status === 'idle' && setRotation(opt.value)} disabled={status !== 'idle'}
                  className={cn('rounded-xl py-4 text-sm font-bold border transition-all flex flex-col items-center gap-2', rotation === opt.value ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300', status !== 'idle' && 'opacity-50 cursor-not-allowed')}>
                  <RotateCw className={cn('w-5 h-5', opt.value === 270 && 'scale-x-[-1]', opt.value === 180 && 'rotate-180')} />
                  {opt.label}
                </button>
              ))}
            </div>

            {status === 'idle' && (
              <button onClick={handleRotate} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-4 font-bold text-sm transition-colors shadow-md">
                Rotate PDF
              </button>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                <p className="text-sm font-medium text-slate-600">Rotating pages…</p>
              </div>
            )}

            {status === 'done' && resultUrl && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-green-700 mb-1">PDF rotated successfully!</p>
                  <p className="text-xs text-green-600">{formatBytes(resultSize)}</p>
                </div>
                <button onClick={downloadResult} className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                  <Download className="w-4 h-4" /> Download Rotated PDF
                </button>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">
                  Rotate Another PDF
                </button>
              </div>
            )}

            {status === 'failed' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-red-700">Failed to rotate PDF</p>
                  <p className="text-xs text-red-500 mt-1">The file may be encrypted or corrupted.</p>
                </div>
                <button onClick={clearAll} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50">Try Another File</button>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-5">100% in-browser · Files never uploaded to any server</p>
          </div>
        )}
      </div>
    </div>
  );
}
