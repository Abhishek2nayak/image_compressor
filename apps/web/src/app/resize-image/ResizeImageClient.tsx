'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, X, Download, Loader2, Link2, Link2Off } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

const ACCEPTED = { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] };
const MAX_SIZE = 25 * 1024 * 1024;

type Mode = 'dimensions' | 'percentage' | 'target';
type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

const FORMAT_LABELS: Record<OutputFormat, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

const EXTENSIONS: Record<OutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

interface Source {
  file: File;
  bitmap: ImageBitmap;
  previewUrl: string;
}

interface Result {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? '';
  toast.error(msg.includes('size') ? 'File too large (max 25 MB)' : 'Unsupported file type');
}

/** Draws the bitmap at the given size and encodes it once. */
function encodeAt(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas is not available in this browser'));

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // PNG keeps transparency; JPEG has none, so flatten onto white first.
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))),
      format,
      quality,
    );
  });
}

/**
 * Searches for the largest quality that still fits under targetBytes, then
 * falls back to scaling the image down if quality alone cannot get there.
 * PNG ignores quality, so it goes straight to scaling.
 */
async function encodeUnderSize(
  bitmap: ImageBitmap,
  format: OutputFormat,
  targetBytes: number,
): Promise<Blob> {
  const { width, height } = bitmap;

  if (format !== 'image/png') {
    let low = 0.05;
    let high = 0.95;
    let best: Blob | null = null;

    // 7 passes narrows quality to ~1%, which is closer than the eye can tell.
    for (let i = 0; i < 7; i++) {
      const mid = (low + high) / 2;
      const blob = await encodeAt(bitmap, width, height, format, mid);
      if (blob.size <= targetBytes) {
        best = blob;
        low = mid;
      } else {
        high = mid;
      }
    }
    if (best) return best;
  }

  // Still too big at the lowest useful quality — shrink the pixels instead.
  let scale = 0.9;
  let last: Blob | null = null;
  for (let i = 0; i < 12; i++) {
    const blob = await encodeAt(
      bitmap,
      width * scale,
      height * scale,
      format,
      format === 'image/png' ? 1 : 0.7,
    );
    last = blob;
    if (blob.size <= targetBytes) return blob;
    scale *= 0.85;
  }
  return last ?? encodeAt(bitmap, width, height, format, 0.5);
}

export default function ResizeImagePage() {
  const [source, setSource] = useState<Source | null>(null);
  const [mode, setMode] = useState<Mode>('dimensions');
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [percentage, setPercentage] = useState(50);
  const [targetKb, setTargetKb] = useState(100);

  const [isWorking, setIsWorking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Revoke object URLs on unmount so previews do not leak.
  const urlsRef = useRef<string[]>([]);
  const track = (url: string) => {
    urlsRef.current.push(url);
    return url;
  };
  useEffect(() => () => urlsRef.current.forEach(URL.revokeObjectURL), []);

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      setSource({ file, bitmap, previewUrl: URL.createObjectURL(file) });
      setWidth(bitmap.width);
      setHeight(bitmap.height);
      setResult(null);
      // Keep the original's format as the default output where we support it.
      if (file.type === 'image/png') setFormat('image/png');
      else if (file.type === 'image/webp') setFormat('image/webp');
      else setFormat('image/jpeg');
    } catch {
      toast.error('Could not read that image');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    noClick: true,
    onDropRejected,
  });

  const ratio = source ? source.bitmap.width / source.bitmap.height : 1;

  function changeWidth(next: number) {
    setWidth(next);
    if (lockRatio && next > 0) setHeight(Math.round(next / ratio));
  }

  function changeHeight(next: number) {
    setHeight(next);
    if (lockRatio && next > 0) setWidth(Math.round(next * ratio));
  }

  async function handleResize() {
    if (!source) return;
    setIsWorking(true);
    try {
      let blob: Blob;
      let outW: number;
      let outH: number;

      if (mode === 'target') {
        blob = await encodeUnderSize(source.bitmap, format, targetKb * 1024);
        const probe = await createImageBitmap(blob);
        outW = probe.width;
        outH = probe.height;
        probe.close();
      } else {
        if (mode === 'percentage') {
          outW = Math.round((source.bitmap.width * percentage) / 100);
          outH = Math.round((source.bitmap.height * percentage) / 100);
        } else {
          outW = width;
          outH = height;
        }
        if (outW < 1 || outH < 1) {
          toast.error('Width and height must be at least 1 pixel');
          return;
        }
        blob = await encodeAt(source.bitmap, outW, outH, format, 0.92);
      }

      setResult({ blob, url: track(URL.createObjectURL(blob)), width: outW, height: outH });

      if (mode === 'target' && blob.size > targetKb * 1024) {
        toast.warning(
          `Could not reach ${targetKb} KB — got ${formatBytes(blob.size)}. Try a lower target or JPG.`,
        );
      } else {
        toast.success('Image resized');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resize that image');
    } finally {
      setIsWorking(false);
    }
  }

  function download() {
    if (!result || !source) return;
    const base = source.file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${base}_${result.width}x${result.height}.${EXTENSIONS[format]}`;
    a.click();
  }

  function reset() {
    source?.bitmap.close();
    setSource(null);
    setResult(null);
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!source) {
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
            {isDragActive ? 'Drop your image' : 'Resize an image'}
          </h1>
          <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
            Set exact pixel dimensions, scale by percentage, or shrink the file to a
            target size in KB. Runs in your browser — nothing is uploaded.
          </p>
          <button
            type="button"
            onClick={open}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-200"
          >
            Select an image
          </button>
          <p className="text-xs text-slate-400 mt-5">JPG · PNG · WebP · AVIF — up to 25 MB</p>
        </div>
      </main>
    );
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Resize an image</h1>
          <p className="text-sm text-slate-500">
            {source.file.name} · {source.bitmap.width} × {source.bitmap.height} ·{' '}
            {formatBytes(source.file.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          aria-label="Remove this image"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1 mb-6">
            {(
              [
                ['dimensions', 'Pixels'],
                ['percentage', 'Percent'],
                ['target', 'Target KB'],
              ] as [Mode, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-xs font-bold transition-colors',
                  mode === value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'dimensions' && (
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <label className="flex-1">
                  <span className="block text-xs font-bold text-slate-500 mb-1.5">Width (px)</span>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={e => changeWidth(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setLockRatio(v => !v)}
                  title={lockRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  aria-pressed={lockRatio}
                  className={cn(
                    'mb-1 p-2 rounded-lg border transition-colors',
                    lockRatio
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-slate-200 text-slate-400 hover:text-slate-700',
                  )}
                >
                  {lockRatio ? (
                    <Link2 className="w-4 h-4" />
                  ) : (
                    <Link2Off className="w-4 h-4" />
                  )}
                  <span className="sr-only">
                    {lockRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  </span>
                </button>
                <label className="flex-1">
                  <span className="block text-xs font-bold text-slate-500 mb-1.5">Height (px)</span>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={e => changeHeight(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                With the link locked, changing one side adjusts the other so the image
                is not stretched.
              </p>
            </div>
          )}

          {mode === 'percentage' && (
            <div>
              <label htmlFor="pct" className="block text-xs font-bold text-slate-500 mb-2">
                Scale to {percentage}% — {Math.round((source.bitmap.width * percentage) / 100)} ×{' '}
                {Math.round((source.bitmap.height * percentage) / 100)}
              </label>
              <input
                id="pct"
                type="range"
                min={5}
                max={200}
                value={percentage}
                onChange={e => setPercentage(Number(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex gap-2 mt-4">
                {[25, 50, 75, 100].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercentage(p)}
                    className="flex-1 border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'target' && (
            <div className="space-y-4">
              <label>
                <span className="block text-xs font-bold text-slate-500 mb-1.5">
                  Target size (KB)
                </span>
                <input
                  type="number"
                  min={1}
                  value={targetKb}
                  onChange={e => setTargetKb(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </label>
              <div className="flex gap-2">
                {[20, 50, 100, 200].map(kb => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className="flex-1 border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {kb} KB
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quality is lowered until the file fits. If that is not enough, the
                pixel dimensions are reduced as well. JPG reaches small targets most
                reliably.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-500 mb-2">Save as</span>
            <div className="flex gap-2">
              {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-bold border transition-colors',
                    format === f
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleResize}
            disabled={isWorking}
            className="w-full mt-6 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isWorking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Resizing…
              </>
            ) : (
              'Resize image'
            )}
          </button>
        </div>

        {/* Preview / result */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-xs font-bold text-slate-500 mb-3">
            {result ? 'Result' : 'Original'}
          </h2>
          <div className="flex-1 flex items-center justify-center bg-[#f8fafc] rounded-xl overflow-hidden min-h-[220px] mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result?.url ?? source.previewUrl}
              alt={
                result
                  ? `Resized preview of ${source.file.name}, ${result.width} by ${result.height} pixels`
                  : `Original preview of ${source.file.name}`
              }
              className="max-h-[320px] max-w-full object-contain"
            />
          </div>

          {result ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <dt className="text-xs text-slate-400 font-medium">Dimensions</dt>
                  <dd className="font-bold text-slate-800">
                    {result.width} × {result.height}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium">File size</dt>
                  <dd className="font-bold text-slate-800">
                    {formatBytes(result.blob.size)}
                    <span className="ml-1.5 text-xs font-semibold text-green-600">
                      {result.blob.size < source.file.size
                        ? `−${Math.round((1 - result.blob.size / source.file.size) * 100)}%`
                        : ''}
                    </span>
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={download}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> Download
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center">
              Choose your settings, then resize to see the result here.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
