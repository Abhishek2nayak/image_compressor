'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, X, Download, Loader2, Check, Images } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

// ── Minimal pdfjs types (mirrors the approach in SplitPdfClient) ──────────────

interface PdfjsViewport {
  width: number;
  height: number;
}
interface PdfjsRenderTask {
  promise: Promise<void>;
}
interface PdfjsPage {
  getViewport(opts: { scale: number }): PdfjsViewport;
  render(opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfjsViewport;
    canvas: HTMLCanvasElement;
  }): PdfjsRenderTask;
}
interface PdfjsDocument {
  numPages: number;
  getPage(n: number): Promise<PdfjsPage>;
}
interface PdfjsLib {
  GlobalWorkerOptions: { workerSrc: string; workerPort: Worker | null };
  getDocument(params: { data: Uint8Array }): { promise: Promise<PdfjsDocument> };
}

// Load pdfjs from /public via a <script type="module">, bypassing webpack so
// the ESM-only build never enters the bundle. Same trick as the split tool.
let _pdfjsPromise: Promise<PdfjsLib> | null = null;
function getPdfjsLib(): Promise<PdfjsLib> {
  if (!_pdfjsPromise) {
    _pdfjsPromise = new Promise<PdfjsLib>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import * as lib from '/pdf.min.mjs';
        window.__pdfjsLib = lib;
        document.dispatchEvent(new Event('__pdfjsready'));
      `;
      document.addEventListener(
        '__pdfjsready',
        () => resolve((window as unknown as { __pdfjsLib: PdfjsLib }).__pdfjsLib),
        { once: true },
      );
      script.onerror = () => reject(new Error('Failed to load PDF.js from /pdf.min.mjs'));
      document.head.appendChild(script);
    });
  }
  return _pdfjsPromise;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED = { 'application/pdf': ['.pdf'] };
const MAX_SIZE = 100 * 1024 * 1024;

type OutputFormat = 'image/jpeg' | 'image/png';

const QUALITY_PRESETS = [
  { label: 'Screen', scale: 1.5, hint: '~110 DPI — smallest files' },
  { label: 'Good', scale: 2, hint: '~150 DPI — a good default' },
  { label: 'Print', scale: 3, hint: '~220 DPI — largest files' },
] as const;

interface RenderedPage {
  pageNum: number;
  /** Object URL of the rendered image. */
  url: string;
  width: number;
  height: number;
  size: number;
  selected: boolean;
}

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? '';
  toast.error(msg.includes('size') ? 'File too large (max 100 MB)' : 'Only PDF files are supported');
}

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [scaleIdx, setScaleIdx] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const urlsRef = useRef<string[]>([]);
  useEffect(() => () => urlsRef.current.forEach(URL.revokeObjectURL), []);

  const render = useCallback(
    async (pdfFile: File, scale: number, outFormat: OutputFormat) => {
      setIsRendering(true);
      setPages([]);
      try {
        const pdfjsLib = await getPdfjsLib();
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const data = new Uint8Array(await pdfFile.arrayBuffer());
        const doc = await pdfjsLib.getDocument({ data }).promise;
        setProgress({ done: 0, total: doc.numPages });

        const out: RenderedPage[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas is not available in this browser');

          // JPEG has no alpha, so paint white under the page first.
          if (outFormat === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              b => (b ? resolve(b) : reject(new Error('Could not encode page ' + n))),
              outFormat,
              0.92,
            );
          });

          const url = URL.createObjectURL(blob);
          urlsRef.current.push(url);
          out.push({
            pageNum: n,
            url,
            width: canvas.width,
            height: canvas.height,
            size: blob.size,
            selected: true,
          });
          setPages([...out]);
          setProgress({ done: n, total: doc.numPages });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not convert that PDF');
      } finally {
        setIsRendering(false);
      }
    },
    [],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      const pdfFile = accepted[0];
      if (!pdfFile) return;
      setFile(pdfFile);
      void render(pdfFile, QUALITY_PRESETS[scaleIdx]!.scale, format);
    },
    [render, scaleIdx, format],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    noClick: true,
    onDropRejected,
  });

  function applySettings(nextIdx: number, nextFormat: OutputFormat) {
    setScaleIdx(nextIdx);
    setFormat(nextFormat);
    if (file) void render(file, QUALITY_PRESETS[nextIdx]!.scale, nextFormat);
  }

  function toggle(pageNum: number) {
    setPages(prev =>
      prev.map(p => (p.pageNum === pageNum ? { ...p, selected: !p.selected } : p)),
    );
  }

  const selected = pages.filter(p => p.selected);
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';
  const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'page';

  function downloadOne(page: RenderedPage) {
    const a = document.createElement('a');
    a.href = page.url;
    a.download = `${baseName}_page_${page.pageNum}.${ext}`;
    a.click();
  }

  // Browsers block a burst of synchronous download clicks, so space them out.
  async function downloadSelected() {
    for (const page of selected) {
      downloadOne(page);
      await new Promise(r => setTimeout(r, 250));
    }
  }

  function reset() {
    setFile(null);
    setPages([]);
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!file) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-3xl py-20 flex flex-col items-center text-center transition-colors',
            isDragActive ? 'border-red-400 bg-red-50/60' : 'border-slate-200 bg-white',
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-slate-300 mb-5" aria-hidden="true" />
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {isDragActive ? 'Drop your PDF' : 'Convert PDF to JPG'}
          </h1>
          <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
            Turn every page of a PDF into a JPG or PNG image at the resolution you
            choose. Runs in your browser — the file is never uploaded.
          </p>
          <button
            type="button"
            onClick={open}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-200"
          >
            Select a PDF
          </button>
          <p className="text-xs text-slate-400 mt-5">PDF — up to 100 MB</p>
        </div>
      </main>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Convert PDF to JPG</h1>
          <p className="text-sm text-slate-500">
            {file.name} · {formatBytes(file.size)}
            {progress.total > 0 && ` · ${progress.total} pages`}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          aria-label="Remove this PDF"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 grid sm:grid-cols-2 gap-5">
        <div>
          <span className="block text-xs font-bold text-slate-500 mb-2">Resolution</span>
          <div className="flex gap-2">
            {QUALITY_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                type="button"
                disabled={isRendering}
                onClick={() => applySettings(i, format)}
                title={preset.hint}
                className={cn(
                  'flex-1 rounded-lg py-2 text-xs font-bold border transition-colors disabled:opacity-50',
                  scaleIdx === i
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{QUALITY_PRESETS[scaleIdx]!.hint}</p>
        </div>
        <div>
          <span className="block text-xs font-bold text-slate-500 mb-2">Format</span>
          <div className="flex gap-2">
            {(
              [
                ['image/jpeg', 'JPG'],
                ['image/png', 'PNG'],
              ] as [OutputFormat, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={isRendering}
                onClick={() => applySettings(scaleIdx, value)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-xs font-bold border transition-colors disabled:opacity-50',
                  format === value
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            JPG for photos and scans, PNG for sharp text and line art.
          </p>
        </div>
      </div>

      {isRendering && (
        <div className="flex items-center gap-2.5 text-sm text-slate-500 mb-6">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Rendering page {progress.done} of {progress.total}…
        </div>
      )}

      {pages.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-sm text-slate-500">
              {selected.length} of {pages.length} selected
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPages(prev => prev.map(p => ({ ...p, selected: true })))}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Select all
              </button>
              <span className="text-slate-200" aria-hidden="true">
                |
              </span>
              <button
                type="button"
                onClick={() => setPages(prev => prev.map(p => ({ ...p, selected: false })))}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {pages.map(page => (
              <li key={page.pageNum}>
                <button
                  type="button"
                  onClick={() => toggle(page.pageNum)}
                  aria-pressed={page.selected}
                  className={cn(
                    'relative w-full rounded-xl overflow-hidden border-2 bg-white transition-all text-left',
                    page.selected
                      ? 'border-red-400 shadow-md'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.url}
                    alt={`Page ${page.pageNum} of ${file.name}`}
                    className="w-full aspect-[3/4] object-contain bg-[#f8fafc]"
                  />
                  {page.selected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" aria-hidden="true" />
                    </span>
                  )}
                  <span className="block px-2.5 py-2 text-xs text-slate-500 border-t border-slate-100">
                    Page {page.pageNum} · {formatBytes(page.size)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadOne(page)}
                  className="mt-1.5 w-full text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Download this page
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={downloadSelected}
            disabled={selected.length === 0}
            className="w-full sm:w-auto bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl px-8 py-3.5 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download {selected.length} {selected.length === 1 ? 'image' : 'images'}
          </button>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5" aria-hidden="true" />
            Your browser may ask permission to save multiple files.
          </p>
        </>
      )}
    </main>
  );
}
