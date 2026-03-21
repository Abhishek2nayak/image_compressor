'use client';

import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  FileText, Loader2, Download, X, Plus, Minimize2,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import api from '@/lib/api';
import { CloudFilePicker } from '@/components/CloudFilePicker';

const ACCEPTED = { 'application/pdf': ['.pdf'] };
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? '';
  toast.error(
    msg.includes('size') ? 'File too large (max 100 MB)' : 'Only PDF files are supported',
  );
}

interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  pageCount: number;
  fileName: string;
}

type CompressionLevel = 'low' | 'medium' | 'high';

const LEVELS: { value: CompressionLevel; label: string; desc: string }[] = [
  { value: 'low',    label: 'Low',    desc: 'Re-serialise only. Safest — preserves all metadata and structure.' },
  { value: 'medium', label: 'Medium', desc: 'Object stream compression. Best balance of size and compatibility.' },
  { value: 'high',   label: 'High',   desc: 'Object streams + strip all metadata. Maximum size reduction.' },
];

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setResult(null);
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

  const {
    getRootProps: getReplaceRootProps,
    getInputProps: getReplaceInputProps,
    isDragActive: isReplaceDragActive,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    onDropRejected,
  });

  async function handleCompress() {
    if (!file || isCompressing) return;

    setIsCompressing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('level', level);

      const response = await api.post<Blob>('/api/v1/pdf-compress', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });

      const originalSize = parseInt(response.headers['x-original-size'] ?? '0', 10);
      const compressedSize = parseInt(response.headers['x-compressed-size'] ?? '0', 10);
      const savingsPercent = parseInt(response.headers['x-savings-percent'] ?? '0', 10);
      const pageCount = parseInt(response.headers['x-page-count'] ?? '0', 10);

      setResult({
        blob: response.data,
        originalSize,
        compressedSize,
        savingsPercent,
        pageCount,
        fileName: file.name,
      });

      toast.success(`Compressed ${savingsPercent > 0 ? `— saved ${savingsPercent}%` : 'done'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Compression failed');
    } finally {
      setIsCompressing(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    const base = result.fileName.replace(/\.pdf$/i, '');
    a.download = `${base}_compressed.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
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

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Empty state */}
        {!file && (
          <div
            {...getRootProps()}
            className="flex flex-col items-center justify-center min-h-[65vh] text-center"
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                'w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-200',
                isDragActive
                  ? 'bg-purple-100 scale-110 border-2 border-purple-300'
                  : 'bg-white border-2 border-dashed border-slate-200',
              )}
            >
              <Minimize2
                className={cn(
                  'w-10 h-10 transition-colors',
                  isDragActive ? 'text-purple-500' : 'text-slate-300',
                )}
              />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {isDragActive ? 'Drop your PDF' : 'Compress PDF'}
            </h1>
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
              Reduce PDF file size by re-optimising the internal structure — processed securely
              on our servers, never shared.
            </p>
            <button
              type="button"
              onClick={open}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-purple-200"
            >
              Select PDF File
            </button>

            <div className="flex items-center gap-3 mt-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or import from</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <CloudFilePicker
              onFiles={(files) => { if (files[0]) { setFile(files[0]); setResult(null); } }}
              accept="pdf"
              multiple={false}
            />

            <p className="text-xs text-slate-400 mt-2">
              PDF files only · Max 100 MB
            </p>
          </div>
        )}

        {/* File loaded */}
        {file && (
          <div className="space-y-6">
            {/* File info card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-slate-800 truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-sm text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={reset}
                className="text-slate-400 hover:text-red-500 transition-colors mt-0.5"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Result card (shown after compression) */}
            {result && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h2 className="font-bold text-slate-800">Compression Result</h2>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      Original
                    </p>
                    <p className="text-lg font-black text-slate-700">
                      {formatBytes(result.originalSize)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
                      Saved
                    </p>
                    <p className="text-lg font-black text-purple-600">
                      {result.savingsPercent > 0 ? `${result.savingsPercent}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">
                      Compressed
                    </p>
                    <p className="text-lg font-black text-green-600">
                      {formatBytes(result.compressedSize)}
                    </p>
                  </div>
                </div>

                {result.savingsPercent <= 0 && (
                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    This PDF is already well-optimised — no further structural compression possible.
                  </p>
                )}

                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-md shadow-green-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Compressed PDF
                </button>
              </div>
            )}

            {/* Action panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-800">Compression Level</h2>

              {/* Level selector */}
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setLevel(l.value); setResult(null); }}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition-all',
                      level === l.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {LEVELS.find((l) => l.value === level)?.desc}
              </p>

              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-md shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Compressing…
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" /> Compress PDF
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Files are deleted from our servers immediately after processing
              </p>
            </div>

            {/* Replace file drop zone */}
            {!isCompressing && (
              <div
                {...getReplaceRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-all',
                  isReplaceDragActive
                    ? 'border-purple-400 bg-purple-50 text-purple-600'
                    : 'border-slate-200 text-slate-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50/30',
                )}
              >
                <input {...getReplaceInputProps()} />
                <div className="flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">
                    {isReplaceDragActive ? 'Drop to replace' : 'Drop a different PDF'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
