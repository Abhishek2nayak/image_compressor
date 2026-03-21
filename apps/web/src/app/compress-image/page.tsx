'use client';

import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Upload, X, Download, Loader2, CheckCircle2, AlertCircle,
  FileText, Plus, Archive,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import api from '@/lib/api';
import { CloudFilePicker } from '@/components/CloudFilePicker';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

interface FileItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface Job {
  fileId: string;
  jobId: string;
  fileName: string;
  originalSize: number;
  status: 'uploading' | 'pending' | 'done' | 'failed';
  compressedSize?: number;
  savingsPercent?: number;
}

function estimatedOutputSize(originalSize: number, quality: number): number {
  // At q=1: ~8% of original; at q=100: ~85% of original (linear interpolation)
  const ratio = 0.08 + ((quality - 1) / 99) * 0.77;
  return Math.round(originalSize * ratio);
}

function qualityLabel(q: number): string {
  if (q >= 85) return 'Maximum quality';
  if (q >= 70) return 'High quality';
  if (q >= 50) return 'Balanced';
  if (q >= 30) return 'High compression';
  return 'Maximum compression';
}

function sliderColor(q: number): string {
  if (q >= 85) return '#3b82f6';
  if (q >= 70) return '#22c55e';
  if (q >= 50) return '#eab308';
  if (q >= 30) return '#f97316';
  return '#ef4444';
}

const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] };
const MAX_SIZE = 25 * 1024 * 1024;

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? '';
  toast.error(msg.includes('size') ? 'File too large (max 25 MB)' : 'Unsupported file type');
}

export default function CompressImagePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(75);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const compressStarted = jobs.length > 0;
  const pendingJobs = jobs.filter(j => j.status === 'uploading' || j.status === 'pending');
  const doneJobs = jobs.filter(j => j.status === 'done');
  const allDone = compressStarted && pendingJobs.length === 0;

  const totalOriginal = files.reduce((s, f) => s + f.file.size, 0);
  const totalEstimated = files.reduce((s, f) => s + estimatedOutputSize(f.file.size, quality), 0);
  const estimatedSavings = totalOriginal > 0
    ? Math.round((1 - totalEstimated / totalOriginal) * 100)
    : 0;

  const addNewFiles = useCallback((accepted: File[]) => {
    const items: FileItem[] = accepted.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setFiles(prev => [...prev, ...items]);
  }, []);

  function removeFile(id: string) {
    setFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  }

  function clearAll() {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setJobs([]);
    setIsUploading(false);
  }

  function updateJob(fileId: string, patch: Partial<Job>) {
    setJobs(prev => prev.map(j => j.fileId === fileId ? { ...j, ...patch } : j));
  }

  async function pollJob(fileId: string, jobId: string) {
    const iv = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/compress/${jobId}`);
        const d = res.data.data as { status: string; compressedSize?: number; savingsPercent?: number };
        if (d.status === 'DONE') {
          clearInterval(iv);
          updateJob(fileId, { status: 'done', compressedSize: d.compressedSize, savingsPercent: d.savingsPercent });
        } else if (d.status === 'FAILED') {
          clearInterval(iv);
          updateJob(fileId, { status: 'failed' });
          toast.error('Compression failed');
        }
      } catch {
        clearInterval(iv);
        updateJob(fileId, { status: 'failed' });
      }
    }, 2000);
  }

  async function handleCompress() {
    if (!files.length || isUploading || compressStarted) return;
    setIsUploading(true);

    setJobs(files.map(f => ({
      fileId: f.id,
      jobId: '',
      fileName: f.file.name,
      originalSize: f.file.size,
      status: 'uploading',
    })));

    for (const fileItem of files) {
      const fd = new FormData();
      fd.append('image', fileItem.file);
      fd.append('quality', String(quality));
      try {
        const res = await api.post('/api/v1/compress', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const { jobId } = res.data.data as { jobId: string };
        updateJob(fileItem.id, { jobId, status: 'pending' });
        pollJob(fileItem.id, jobId);
      } catch (err) {
        updateJob(fileItem.id, { status: 'failed' });
        toast.error(err instanceof Error ? err.message : `Failed: ${fileItem.file.name}`);
      }
    }
    setIsUploading(false);
  }

  function downloadFile(jobId: string, fileName: string) {
    const a = document.createElement('a');
    a.href = `${API_URL}/api/v1/compress/${jobId}/download`;
    a.download = fileName;
    a.click();
  }

  async function downloadAll() {
    for (const j of doneJobs.filter(j => j.jobId)) {
      downloadFile(j.jobId, j.fileName);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Dropzone for empty state (whole area, no-click — button triggers open())
  const {
    getRootProps: getEmptyRootProps,
    getInputProps: getEmptyInputProps,
    isDragActive: isEmptyDragActive,
    open: openFilePicker,
  } = useDropzone({
    onDrop: addNewFiles,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    noClick: true,
    onDropRejected,
  });

  // Dropzone for "Add more" zone in split layout
  const {
    getRootProps: getAddRootProps,
    getInputProps: getAddInputProps,
    isDragActive: isAddDragActive,
  } = useDropzone({
    onDrop: addNewFiles,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    onDropRejected,
  });

  const color = sliderColor(quality);

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Minimal header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Easy PDF Studio</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            All tools
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Empty state ── */}
        {files.length === 0 && (
          <div
            {...getEmptyRootProps()}
            className="flex flex-col items-center justify-center min-h-[65vh] text-center"
          >
            <input {...getEmptyInputProps()} />
            <div className={cn(
              'w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-200',
              isEmptyDragActive
                ? 'bg-red-100 scale-110 border-2 border-red-300'
                : 'bg-white border-2 border-dashed border-slate-200',
            )}>
              <Upload className={cn(
                'w-10 h-10 transition-colors',
                isEmptyDragActive ? 'text-red-500' : 'text-slate-300',
              )} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {isEmptyDragActive ? 'Drop your images' : 'Compress Images'}
            </h1>
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
              Reduce JPEG, PNG, WebP and AVIF file sizes by up to 80%
              without visible quality loss. Free, no sign-up required.
            </p>

            <button
              type="button"
              onClick={openFilePicker}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-200"
            >
              Select Images
            </button>

            <div className="flex items-center gap-3 mt-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or import from</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <CloudFilePicker onFiles={addNewFiles} accept="image" multiple />

            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              {['JPEG', 'PNG', 'WebP', 'AVIF'].map(f => (
                <span key={f} className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                  {f}
                </span>
              ))}
              <span className="text-xs text-slate-400">· Max 25 MB each</span>
            </div>
          </div>
        )}

        {/* ── Two-panel layout ── */}
        {files.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left: preview panel */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-700 text-sm">
                  {files.length} image{files.length !== 1 ? 's' : ''} selected
                </h2>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  {allDone ? 'Start over' : 'Clear all'}
                </button>
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map(fileItem => {
                  const job = jobs.find(j => j.fileId === fileItem.id);
                  return (
                    <div
                      key={fileItem.id}
                      className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm"
                      style={{ aspectRatio: '1' }}
                    >
                      {/* Preview image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fileItem.previewUrl}
                        alt={fileItem.file.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Bottom info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
                        <p className="text-white text-xs font-medium truncate leading-tight">{fileItem.file.name}</p>
                        <p className="text-white/60 text-xs">{formatBytes(fileItem.file.size)}</p>
                      </div>

                      {/* Status overlay */}
                      {job && (
                        <div className={cn(
                          'absolute inset-0 flex items-center justify-center',
                          job.status === 'done' ? 'bg-black/10' : 'bg-black/40',
                        )}>
                          {(job.status === 'uploading' || job.status === 'pending') && (
                            <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow" />
                          )}
                          {job.status === 'done' && (
                            <div className="bg-green-500 rounded-full p-1.5 shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          )}
                          {job.status === 'failed' && (
                            <div className="bg-red-500 rounded-full p-1.5 shadow-lg">
                              <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Download badge (done) */}
                      {job?.status === 'done' && job.jobId && (
                        <button
                          onClick={() => downloadFile(job.jobId, job.fileName)}
                          className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-2 py-1 text-xs font-bold flex items-center gap-1 transition-colors shadow"
                        >
                          <Download className="w-3 h-3" /> {job.savingsPercent}%
                        </button>
                      )}

                      {/* Remove button (before compression) */}
                      {!compressStarted && (
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add more files zone (before compression only) */}
              {!compressStarted && (
                <div
                  {...getAddRootProps()}
                  className={cn(
                    'mt-3 border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-all',
                    isAddDragActive
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/30',
                  )}
                >
                  <input {...getAddInputProps()} />
                  <div className="flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">
                      {isAddDragActive ? 'Drop to add' : 'Add more images'}
                    </span>
                  </div>
                </div>
              )}

              {/* Download all button */}
              {doneJobs.length > 1 && (
                <button
                  onClick={downloadAll}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Archive className="w-4 h-4" />
                  Download all ({doneJobs.length} files)
                </button>
              )}
            </div>

            {/* Right: settings panel */}
            <div className="lg:w-72 w-full shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-6">
                <h2 className="font-bold text-slate-800 mb-5">Compression Settings</h2>

                {/* Quality slider */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Quality level</span>
                    <span className="text-sm font-black tabular-nums" style={{ color }}>{quality}</span>
                  </div>
                  <input
                    type="range" min={1} max={100} value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    disabled={compressStarted}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-1.5"
                    style={{
                      background: `linear-gradient(to right, ${color} ${quality}%, #e2e8f0 ${quality}%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Smaller file</span>
                    <span className="font-semibold" style={{ color }}>{qualityLabel(quality)}</span>
                    <span>Better quality</span>
                  </div>
                </div>

                {/* Estimated output size */}
                {!compressStarted && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">Estimated output size</p>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-2xl font-black text-slate-900">
                        {formatBytes(totalEstimated)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">from {formatBytes(totalOriginal)}</span>
                      <span className="text-xs font-bold text-green-600">· ~{estimatedSavings}% smaller</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Estimate — actual size varies by image content</p>
                  </div>
                )}

                {/* Processing progress */}
                {compressStarted && pendingJobs.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                      <span className="text-sm font-medium text-blue-700">Processing images…</span>
                    </div>
                    <p className="text-xs text-blue-500">
                      {doneJobs.length} of {jobs.length} complete
                    </p>
                  </div>
                )}

                {/* Results summary */}
                {doneJobs.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 mb-5 border border-green-100">
                    <p className="text-xs font-bold text-green-700 mb-2">
                      {allDone ? 'All images compressed!' : 'Compressed so far'}
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {doneJobs.map(j => (
                        <div key={j.fileId} className="flex items-center justify-between text-xs gap-2">
                          <span className="text-slate-600 truncate">{j.fileName}</span>
                          <span className="text-green-600 font-bold shrink-0">{j.savingsPercent}% smaller</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Total saved: {formatBytes(
                        doneJobs.reduce((s, j) => s + (j.originalSize - (j.compressedSize ?? j.originalSize)), 0)
                      )}
                    </p>
                  </div>
                )}

                {/* Compress button */}
                {!compressStarted && (
                  <button
                    onClick={handleCompress}
                    disabled={isUploading || files.length === 0}
                    className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-md shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                      </span>
                    ) : (
                      `Compress ${files.length === 1 ? 'Image' : `${files.length} Images`}`
                    )}
                  </button>
                )}

                {/* Compress more — shown when all done */}
                {allDone && (
                  <button
                    onClick={clearAll}
                    className="w-full border border-slate-200 text-slate-600 rounded-xl py-3 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Compress More Images
                  </button>
                )}

                <p className="text-xs text-slate-400 text-center mt-4">
                  Files deleted automatically after 24 hours
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
