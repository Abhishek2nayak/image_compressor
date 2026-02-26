'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Upload, Download, X, CheckCircle2, AlertCircle, Loader2,
  FileImage, Zap, Archive, ChevronDown, Shield, Clock,
  Layers, Code2, Gauge, ImageIcon,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import api from '@/lib/api';

type JobStatus = 'pending' | 'done' | 'failed';

interface JobResult {
  jobId: string;
  fileName: string;
  originalSize: number;
  status: JobStatus;
  compressedSize?: number;
  savingsPercent?: number;
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

function qualityLabel(q: number): { text: string; color: string; bg: string } {
  if (q >= 85) return { text: 'Maximum quality',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100' };
  if (q >= 70) return { text: 'High quality',       color: 'text-green-700',  bg: 'bg-green-50 border-green-100' };
  if (q >= 50) return { text: 'Balanced',            color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' };
  if (q >= 30) return { text: 'High compression',   color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' };
  return             { text: 'Maximum compression', color: 'text-red-700',    bg: 'bg-red-50 border-red-100' };
}

function sliderColor(q: number): string {
  if (q >= 85) return '#3b82f6';
  if (q >= 70) return '#22c55e';
  if (q >= 50) return '#eab308';
  if (q >= 30) return '#f97316';
  return '#ef4444';
}

const PRESETS = [
  { label: 'Max quality', v: 95, cls: 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100' },
  { label: 'High',        v: 80, cls: 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100' },
  { label: 'Balanced',    v: 60, cls: 'text-yellow-700 border-yellow-200 bg-yellow-50 hover:bg-yellow-100' },
  { label: 'Low',         v: 40, cls: 'text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100' },
  { label: 'Min size',    v: 20, cls: 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100' },
] as const;

const FORMATS = [
  { ext: 'JPEG', emoji: '🖼️', color: 'bg-orange-50 border-orange-100', desc: 'Best for photos and images with rich gradients. Achieves 40–70% compression at quality 75.' },
  { ext: 'PNG',  emoji: '🎨', color: 'bg-sky-50 border-sky-100',      desc: 'Lossless compression. Preserves transparency. Great for logos, icons, and UI graphics.' },
  { ext: 'WebP', emoji: '⚡', color: 'bg-green-50 border-green-100',  desc: 'Modern format with 25–35% better compression than JPEG. Supported by all major browsers.' },
  { ext: 'AVIF', emoji: '🚀', color: 'bg-violet-50 border-violet-100', desc: 'Next-generation format. Up to 50% smaller than JPEG with equivalent visual quality.' },
];

const FEATURES = [
  { icon: Gauge,     title: 'Smart Compression',  desc: 'Advanced algorithms minimise file size while preserving visual quality across all compression levels.' },
  { icon: Layers,    title: 'Batch Processing',    desc: 'Upload and compress up to 20 images at once. Download all results as a single ZIP archive.' },
  { icon: Code2,     title: 'Developer API',       desc: 'REST API with API key auth. Integrate image compression into any app, pipeline, or CMS.' },
  { icon: Shield,    title: 'Secure & Private',    desc: 'Files are automatically deleted after 24 hours. We never access or share your images.' },
  { icon: Clock,     title: 'Lightning Fast',      desc: 'Parallel processing queue handles thousands of images concurrently with near-instant results.' },
  { icon: ImageIcon, title: 'All Major Formats',   desc: 'JPEG, PNG, WebP, and AVIF — the four formats that matter most for web and mobile.' },
];

const STEPS = [
  { n: '01', title: 'Upload images',        desc: 'Drag and drop up to 20 images or click to browse. No account required. Supports JPEG, PNG, WebP, AVIF up to 25 MB each.' },
  { n: '02', title: 'Choose quality level', desc: 'Slide to any quality from 1 to 100, or pick a preset. Higher values = better quality, lower = smaller file.' },
  { n: '03', title: 'Download optimised',   desc: 'Files compress in seconds. Download each result individually, or grab all at once as a ZIP archive.' },
];

const FAQS = [
  {
    q: 'How do I compress an image without losing quality?',
    a: 'Set the quality slider to 75–85. This range strips invisible data (EXIF metadata, redundant colour information) that the human eye cannot perceive, typically achieving 40–60% file reduction with zero visible difference.',
  },
  {
    q: 'What image formats does ImagePress support?',
    a: 'ImagePress supports JPEG (JPG), PNG, WebP, and AVIF — the four formats that cover virtually all web, mobile, and photography use cases.',
  },
  {
    q: 'Is there a file size limit for uploads?',
    a: 'Each file can be up to 25 MB. Free guests can compress images without an account. Sign up free to track history, or upgrade to Pro for 500 images per day plus API access.',
  },
  {
    q: 'Are my uploaded images stored permanently?',
    a: 'No. All files — original uploads and compressed outputs — are permanently and automatically deleted after 24 hours. We never access, analyse, or share your images.',
  },
  {
    q: 'Can I compress multiple images at once?',
    a: 'Yes. Drop up to 20 images at once. Each image is processed in parallel. When all are done you can download them individually or as a single ZIP file.',
  },
  {
    q: 'What is the difference between the quality presets?',
    a: 'Max quality (95) is nearly lossless — ideal for print or archival. High (80) works great for professional photography. Balanced (60) is the sweet spot for most web images. Low (40) and Min size (20) maximise compression at the cost of some visible quality — useful for thumbnails.',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [quality, setQuality] = useState(75);
  const [jobs, setJobs]       = useState<JobResult[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const ql    = qualityLabel(quality);
  const color = sliderColor(quality);

  function updateJob(jobId: string, patch: Partial<JobResult>) {
    setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, ...patch } : j));
  }

  async function pollJob(jobId: string) {
    const iv = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/compress/${jobId}`);
        const d = res.data.data as { status: string; compressedSize?: number; savingsPercent?: number };
        if (d.status === 'DONE') {
          clearInterval(iv);
          updateJob(jobId, { status: 'done', compressedSize: d.compressedSize, savingsPercent: d.savingsPercent });
        } else if (d.status === 'FAILED') {
          clearInterval(iv);
          updateJob(jobId, { status: 'failed' });
          toast.error('Compression failed');
        }
      } catch {
        clearInterval(iv);
        updateJob(jobId, { status: 'failed' });
      }
    }, 2500);
  }

  const onDrop = useCallback(async (accepted: File[]) => {
    for (const file of accepted) {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('quality', String(quality));
      try {
        const res = await api.post('/api/v1/compress', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const { jobId } = res.data.data as { jobId: string };
        setJobs(prev => [{ jobId, fileName: file.name, originalSize: file.size, status: 'pending' }, ...prev]);
        pollJob(jobId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
  }, [quality]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] },
    maxSize: 25 * 1024 * 1024,
    noClick: jobs.length > 0,
    onDropRejected: f => toast.error(f[0]?.errors[0]?.message?.includes('size') ? 'File too large (max 25 MB)' : 'Unsupported file type'),
  });

  function downloadFile(jobId: string, fileName: string) {
    const a = document.createElement('a');
    a.href = `${API_URL}/api/v1/compress/${jobId}/download`;
    a.download = fileName;
    a.click();
  }

  async function downloadAll() {
    for (const j of jobs.filter(j => j.status === 'done')) {
      downloadFile(j.jobId, j.fileName);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const doneCount    = jobs.filter(j => j.status === 'done').length;
  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const totalSaved   = jobs.filter(j => j.status === 'done')
    .reduce((s, j) => s + (j.originalSize - (j.compressedSize ?? j.originalSize)), 0);

  return (
    <>
      {/* Structured data — WebApplication + FAQPage schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'ImagePress', url: 'https://imagepress.app',
          description: 'Free online image compressor. Reduce JPEG, PNG, WebP, AVIF files by up to 80% without visible quality loss.',
          applicationCategory: 'MultimediaApplication', operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: FAQS.map(f => ({
            '@type': 'Question', name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ]) }} />

      <div className="min-h-screen bg-[#f8fafc]">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between" style={{ height: '3.75rem' }}>
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">ImagePress</span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
              <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</Link>
              <Link href="#formats"      className="hover:text-slate-900 transition-colors">Formats</Link>
              {/* <Link href="/docs"    className="hover:text-slate-900 transition-colors">API</Link> */}
              {/* <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link> */}
            </nav>
            <div className="flex items-center gap-2.5 text-sm shrink-0">
              {session ? (
                <Link href="/dashboard" className="border border-slate-200 rounded-lg px-3.5 py-1.5 font-semibold hover:bg-slate-50 transition-colors text-slate-700">
                  Dashboard
                </Link>
              ) : (
                <>
                  <button onClick={() => signIn()} className="hidden sm:block font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    Sign in
                  </button>
                  <Link href="/register" className="bg-indigo-600 text-white rounded-lg px-4 py-1.5 font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main>

          {/* ── Hero + Tool ── */}
          <section className="relative overflow-hidden pb-16">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/70 via-white/60 to-transparent pointer-events-none" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-r from-indigo-100/50 via-violet-100/50 to-purple-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-8 text-center">
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-6 shadow-sm">
                <Zap className="w-3 h-3" /> 100% Free · No Sign-up Required
              </div>
              <h1 className="text-5xl sm:text-[3.75rem] font-black tracking-tight leading-[1.06] mb-5">
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Compress Images.
                </span>
                <br />
                <span className="text-slate-900">Keep the Quality.</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
                Reduce JPEG, PNG, WebP and AVIF file sizes by up to 80% without visible quality loss.
                Free forever — no watermarks, no limits on file count.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {['✓ No sign-up required', '✓ JPEG · PNG · WebP · AVIF', '✓ Up to 20 images at once', '✓ Files deleted after 24h'].map(f => (
                  <span key={f} className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 shadow-sm">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Tool area */}
            <div className="relative max-w-3xl mx-auto px-4">

              {/* Quality slider */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-700">Compression Quality</span>
                    <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full border', ql.bg, ql.color)}>
                      {ql.text}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-black tabular-nums" style={{ color }}>{quality}</span>
                    <span className="text-sm text-slate-400 font-medium">/100</span>
                  </div>
                </div>

                <input
                  type="range" min={1} max={100} value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-1.5"
                  style={{ background: `linear-gradient(to right, ${color} ${quality}%, #e2e8f0 ${quality}%)`, color }}
                />
                <div className="flex justify-between text-xs text-slate-400 mb-3.5">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>

                <div className="flex gap-1.5">
                  {PRESETS.map(p => (
                    <button
                      key={p.label} onClick={() => setQuality(p.v)}
                      className={cn(
                        'flex-1 text-xs font-bold rounded-lg py-1.5 border transition-all duration-150',
                        quality === p.v ? p.cls : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone — empty state */}
              {jobs.length === 0 ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl bg-white shadow-sm cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-16 px-8 text-center',
                    isDragActive
                      ? 'border-indigo-400 bg-indigo-50/60 scale-[1.01]'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20',
                  )}
                >
                  <input {...getInputProps()} />
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all',
                    isDragActive ? 'bg-indigo-100 scale-110' : 'bg-gradient-to-br from-slate-50 to-slate-100',
                  )}>
                    <Upload className={cn('w-7 h-7 transition-colors', isDragActive ? 'text-indigo-600' : 'text-slate-400')} />
                  </div>
                  <p className="text-xl font-bold text-slate-700 mb-1.5">
                    {isDragActive ? 'Drop to compress' : 'Drop images here'}
                  </p>
                  <p className="text-sm text-slate-400 mb-7">JPEG, PNG, WebP, AVIF — up to 25 MB each</p>
                  <button
                    type="button"
                    className="bg-indigo-600 text-white rounded-xl px-9 py-3 font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                  >
                    Select Images
                  </button>
                  {!session && (
                    <p className="text-xs text-slate-400 mt-6">
                      No account needed.{' '}
                      <Link href="/register" className="text-indigo-600 hover:underline font-semibold">Sign up free</Link>
                      {' '}for history &amp; more uploads.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary bar */}
                  <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-sm">
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="font-bold text-slate-700">{jobs.length} image{jobs.length !== 1 ? 's' : ''}</span>
                      {pendingCount > 0 && (
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> {pendingCount} processing…
                        </span>
                      )}
                      {doneCount > 0 && totalSaved > 0 && (
                        <span className="text-green-600 font-bold text-xs">Saved {formatBytes(totalSaved)} total</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doneCount > 1 && (
                        <button onClick={downloadAll} className="flex items-center gap-1.5 text-xs border border-slate-200 rounded-lg px-3 py-1.5 font-bold hover:bg-slate-50 transition-colors">
                          <Archive className="w-3.5 h-3.5" /> Download all
                        </button>
                      )}
                      <button onClick={open} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" /> Add more
                      </button>
                      <button onClick={() => setJobs([])} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File cards */}
                  {jobs.map(job => (
                    <div key={job.jobId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shrink-0">
                          <FileImage className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-700 truncate mb-0.5">{job.fileName}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span>{formatBytes(job.originalSize)}</span>
                            {job.status === 'done' && job.compressedSize && (
                              <>
                                <span className="text-slate-200">→</span>
                                <span className="text-green-600 font-bold">{formatBytes(job.compressedSize)}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {job.status === 'pending' && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Compressing…
                            </span>
                          )}
                          {job.status === 'done' && (
                            <>
                              <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {job.savingsPercent}% smaller
                              </span>
                              <button
                                onClick={() => downloadFile(job.jobId, job.fileName)}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </button>
                            </>
                          )}
                          {job.status === 'failed' && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          )}
                          <button
                            onClick={() => setJobs(p => p.filter(j => j.jobId !== job.jobId))}
                            className="text-slate-300 hover:text-slate-500 transition-colors ml-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className={cn('h-0.5 transition-all', {
                        'bg-gradient-to-r from-indigo-400 to-violet-400 animate-pulse': job.status === 'pending',
                        'bg-gradient-to-r from-green-400 to-emerald-400':               job.status === 'done',
                        'bg-red-400':                                                    job.status === 'failed',
                      })} />
                    </div>
                  ))}

                  {/* Compact drop zone */}
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-all',
                      isDragActive
                        ? 'border-indigo-400 bg-indigo-50/50 text-indigo-600'
                        : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500',
                    )}
                  >
                    <input {...getInputProps()} />
                    <span className="font-semibold">{isDragActive ? '↓ Drop to add' : '+ Drop more images here'}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="border-y border-slate-100 bg-white">
            <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-3 gap-6 text-center">
              {[
                { value: '50M+', label: 'Images compressed' },
                { value: '78%',  label: 'Average file reduction' },
                { value: '150+', label: 'Countries served' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{s.value}</div>
                  <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── How it works ── */}
          <section id="how-it-works" className="py-20 bg-[#f8fafc]">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">How it works</h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto">Three simple steps — no account required.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {STEPS.map(s => (
                  <div key={s.n} className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-5xl font-black text-indigo-100 mb-4 leading-none">{s.n}</div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{s.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Supported formats ── */}
          <section id="formats" className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Supported image formats</h2>
                <p className="text-slate-500 text-lg">All four major web image formats — fully optimised.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FORMATS.map(f => (
                  <div key={f.ext} className={cn('rounded-2xl border p-6 hover:shadow-md transition-shadow', f.color)}>
                    <div className="text-3xl mb-3">{f.emoji}</div>
                    <div className="font-black text-slate-800 text-xl mb-1.5">{f.ext}</div>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ── */}
          <section className="py-20 bg-[#f8fafc]">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Everything you need</h2>
                <p className="text-slate-500 text-lg">Built for developers, designers, and anyone who cares about performance.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map(f => (
                  <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="py-20 bg-white">
            <div className="max-w-3xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Frequently asked questions</h2>
                <p className="text-slate-500 text-lg">Everything you need to know about image compression.</p>
              </div>
              <div className="space-y-2.5">
                {FAQS.map((faq, i) => (
                  <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                      className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-slate-50 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="font-bold text-slate-800 text-sm sm:text-[0.9375rem] leading-snug">{faq.q}</span>
                      <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openFaq === i && 'rotate-180')} />
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="py-20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to optimise your images?</h2>
              <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                Create a free account to unlock history, batch processing, and full API access.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="bg-white text-indigo-700 rounded-xl px-8 py-3.5 font-black text-sm hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/30">
                  Get started free
                </Link>
                {/* <Link href="/pricing" className="border border-indigo-400/60 text-white rounded-xl px-8 py-3.5 font-bold text-sm hover:bg-white/10 transition-colors">View pricing</Link> */}
              </div>
            </div>
          </section>

        </main>

        {/* ── Footer ── */}
        <footer className="bg-slate-900 text-slate-400">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid sm:grid-cols-4 gap-8 mb-10">
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white text-lg">ImagePress</span>
                </div>
                <p className="text-sm leading-relaxed max-w-xs">
                  Free online image compression. Reduce file sizes without losing quality.
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                  {/* <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li> */}
                  {/* <li><Link href="/docs"    className="hover:text-white transition-colors">API Docs</Link></li> */}
                  <li><Link href="/register" className="hover:text-white transition-colors">Sign up</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-3">Account</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login"     className="hover:text-white transition-colors">Sign in</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                  <li><Link href="/api-keys"  className="hover:text-white transition-colors">API Keys</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} ImagePress. All rights reserved.</span>
              <span>Files deleted after 24 hours · SSL encrypted · No watermarks</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
