'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, Download, Loader2, FileText } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { openPdf } from '@/lib/pdfjs';

type OutputFormat = 'image/jpeg' | 'image/png';
type PageResult = { pageNum: number; dataUrl: string; blob: Blob };

export default function PdfToImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
  const [scale, setScale] = useState(2);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'failed'>('idle');
  const [pages, setPages] = useState<PageResult[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setStatus('idle');
    setPages([]);
    setPageCount(0);
    setCurrentPage(0);
    // Quick page count
    (async () => {
      try {
        const pdf = await openPdf(f);
        setPageCount(pdf.numPages);
        await pdf.destroy();
      } catch {
        toast.error('Could not read this PDF. It may be damaged or password-protected.');
      }
    })();
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [] },
    maxSize: 100 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
    onDropRejected: () => toast.error('PDF only, max 100 MB'),
  });

  async function handleConvert() {
    if (!file || status === 'processing') return;
    setStatus('processing');
    setPages([]);
    setCurrentPage(0);

    try {
      const pdf = await openPdf(file);
      const results: PageResult[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setCurrentPage(i);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // pdfjs v5 requires the canvas element itself; canvasContext is optional
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const q = outputFormat === 'image/jpeg' ? 0.92 : undefined;
        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), outputFormat, q)
        );
        page.cleanup();
        // Object URL instead of toDataURL: avoids a second, base64 copy of every page in memory
        results.push({ pageNum: i, dataUrl: URL.createObjectURL(blob), blob });
        setPages([...results]);
      }
      await pdf.destroy();

      setStatus('done');
    } catch (err) {
      setStatus('failed');
      toast.error(err instanceof Error ? err.message : 'Conversion failed');
    }
  }

  function downloadPage(p: PageResult) {
    const ext = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const url = URL.createObjectURL(p.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file!.name.replace('.pdf', '')}-page-${p.pageNum}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAll() {
    for (const p of pages) {
      await new Promise(r => setTimeout(r, 100));
      downloadPage(p);
    }
  }

  function clearAll() {
    setFile(null); setPages([]); setPageCount(0); setStatus('idle'); setCurrentPage(0);
  }

  const ext = outputFormat === 'image/jpeg' ? 'jpg' : 'png';

  return (
    <div>

      <div className="max-w-3xl">

        {!file && (
          <div {...getRootProps()} className="flex flex-col items-center justify-center min-h-[36vh] cursor-pointer">
            <input {...getInputProps()} />
            <div className={cn('w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all', isDragActive ? 'bg-brand-100 scale-110 border-2 border-brand-300' : 'bg-white border-2 border-dashed border-slate-200')}>
              <Upload className={cn('w-10 h-10', isDragActive ? 'text-brand-500' : 'text-slate-300')} />
            </div>
            <p className="text-slate-400 text-sm mb-4">{isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF or click to select'}</p>
            <input id="p2i-pick" type="file" accept=".pdf,application/pdf" className="sr-only"
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onDrop(f); e.currentTarget.value = ''; }} />
            <label htmlFor="p2i-pick" className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm shadow-lg cursor-pointer inline-block">Select PDF</label>
            <span className="text-xs text-slate-400 mt-3">PDF · Max 100 MB · 100% In-Browser</span>
          </div>
        )}

        {file && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{file.name}</p>
                <p className="text-sm text-slate-500">{formatBytes(file.size)}{pageCount > 0 ? ` · ${pageCount} pages` : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">Output Format</label>
                <div className="flex gap-2">
                  {(['image/jpeg', 'image/png'] as const).map(f => (
                    <button key={f} onClick={() => setOutputFormat(f)} disabled={status === 'processing'}
                      className={cn('flex-1 rounded-xl py-2.5 text-sm font-bold border transition-all', outputFormat === f ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300')}>
                      {f === 'image/jpeg' ? 'JPEG' : 'PNG'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600">Resolution: {scale}x</label>
                </div>
                <input type="range" min={1} max={3} step={0.5} value={scale}
                  onChange={e => setScale(Number(e.target.value))} disabled={status === 'processing'}
                  className="w-full accent-brand-600 mt-2.5" />
              </div>
            </div>

            {status === 'idle' && (
              <button onClick={handleConvert}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-4 font-bold text-sm shadow-md">
                Convert to Images
              </button>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                <p className="text-sm font-medium text-slate-600">
                  Converting page {currentPage}{pageCount > 0 ? ` of ${pageCount}` : ''}…
                </p>
              </div>
            )}

            {pages.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">{pages.length} page{pages.length !== 1 ? 's' : ''} converted</p>
                  {status === 'done' && pages.length > 1 && (
                    <button onClick={downloadAll} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700">
                      <Download className="w-4 h-4" /> Download All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {pages.map(p => (
                    <div key={p.pageNum} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt={`Page ${p.pageNum}`} className="w-full rounded-xl border border-slate-100 shadow-sm" />
                      <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => downloadPage(p)}
                          className="bg-white text-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow">
                          <Download className="w-3.5 h-3.5" /> .{ext}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 text-center mt-1">Page {p.pageNum}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === 'done' && (
              <button onClick={clearAll} className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50 mt-4">
                Convert Another PDF
              </button>
            )}

            <p className="text-xs text-slate-400 text-center mt-5">100% in-browser · Files never uploaded to any server</p>
          </div>
        )}
      </div>
    </div>
  );
}
