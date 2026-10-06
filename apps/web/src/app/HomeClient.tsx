'use client';

import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import {
  FileText, ChevronDown, Shield, Clock,
  Layers, Code2, Gauge, ImageIcon,
  ArrowRight, FilePlus2, Scissors, Minimize2, Maximize2, Images,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { HOME_FAQS } from '@/lib/faq';

const FORMATS = [
  { ext: 'JPEG', emoji: '🖼️', color: 'bg-orange-50 border-orange-100', desc: 'Lossy format for photos and anything with soft gradients. You choose how far to push the quality.' },
  { ext: 'PNG',  emoji: '🎨', color: 'bg-sky-50 border-sky-100',      desc: 'Lossless and keeps transparency. The right pick for logos, icons and UI graphics.' },
  { ext: 'WebP', emoji: '⚡', color: 'bg-green-50 border-green-100',  desc: 'Modern format that is usually smaller than JPEG at a comparable quality. Every current browser supports it.' },
  { ext: 'AVIF', emoji: '🚀', color: 'bg-violet-50 border-violet-100', desc: 'Newer still, and often smaller than WebP. Encoding takes longer, so expect a slightly slower compress.' },
];

const FEATURES = [
  { icon: Gauge,     title: 'Quality you control', desc: 'A 1–100 quality slider with a live estimate of the output size, so you can stop exactly where you need to.' },
  { icon: Layers,    title: 'Up to 20 at once',    desc: 'Compress up to 20 images in a single batch and download each result as it finishes.' },
  { icon: Code2,     title: 'Developer API',       desc: 'A REST API with key authentication for the image compressor, available on the Pro plan.' },
  { icon: Shield,    title: 'Clear about uploads', desc: 'Merge, split and JPG to PDF never upload anything. Image and PDF compression run on our server — see the FAQ for exactly how long files are kept.' },
  { icon: Clock,     title: 'No watermarks',       desc: 'Nothing is stamped onto your files, and you are never asked for an email before a download.' },
  { icon: ImageIcon, title: 'Four image formats',  desc: 'JPEG, PNG, WebP and AVIF, both for compression and for converting into a PDF.' },
];

const STEPS = [
  { n: '01', title: 'Pick a tool',         desc: 'Compress an image, convert JPG to PDF, or merge, split and compress PDF files. No account needed for any of them.' },
  { n: '02', title: 'Add your files',      desc: 'Drag and drop, or browse. Merge, split and JPG to PDF open the file in your browser; the two compressors upload it to our server.' },
  { n: '03', title: 'Download the result', desc: 'No watermark and no sign-up wall. The file is ready as soon as processing finishes.' },
];


export default function HomePage() {
  const { data: session } = useSession();

  return (
    <>

      <div className="min-h-screen bg-[#f8fafc]">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between" style={{ height: '3.75rem' }}>
            <Link href="/" className="shrink-0" aria-label="My PDF Hub home">
              <Logo size={34} />
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
              <Link href="#tools"        className="hover:text-slate-900 transition-colors">Tools</Link>
              <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</Link>
              <Link href="/pricing"      className="hover:text-slate-900 transition-colors">Pricing</Link>
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
                  <Link href="/register" className="bg-red-500 text-white rounded-lg px-4 py-1.5 font-semibold hover:bg-red-600 transition-colors shadow-sm">
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main>

          {/* ── Hero ── */}
          <section className="relative overflow-hidden pb-12">
            <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 via-white/60 to-transparent pointer-events-none" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-r from-red-100/40 via-orange-100/40 to-yellow-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
              <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-6 shadow-sm">
                <FileText className="w-3 h-3" aria-hidden="true" /> Free to use · No account needed
              </div>
              <h1 className="text-5xl sm:text-[3.75rem] font-black tracking-tight leading-[1.06] mb-5">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Free PDF &amp; image tools.
                </span>
                <br />
                <span className="text-slate-900">Compress. Convert. Merge. Split.</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
                Compress images, convert JPG to PDF, and merge, split or compress
                PDF files. Five tools, free to use, no account required and no
                watermarks on anything you download.
              </p>
              <Link
                href="/compress-image"
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-200"
              >
                Start Compressing Images <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['✓ No account needed', '✓ No watermarks', '✓ Merge, split & JPG to PDF never upload'].map(f => (
                  <span key={f} className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 shadow-sm">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Tools section ── */}
          <section id="tools" className="py-16 bg-white border-y border-slate-100">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Our Tools</h2>
                <p className="text-slate-500 text-lg">Everything you need to work with images and PDFs, online and free.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Image Compressor tool card */}
                <Link
                  href="/compress-image"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                    <ImageIcon className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">Image Compressor</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Shrink JPEG, PNG, WebP and AVIF files with a quality slider and a live size estimate. Aim for a specific KB and stop there.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-red-500 group-hover:gap-2.5 transition-all">
                    Compress Images <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* JPG to PDF tool card */}
                <Link
                  href="/jpg-to-pdf"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">JPG to PDF</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Convert JPEG, PNG, WebP and AVIF images into a single PDF. Reorder pages, rotate images, and choose your page settings.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-orange-500 group-hover:gap-2.5 transition-all">
                    Convert to PDF <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* Merge PDF tool card */}
                <Link
                  href="/merge-pdf"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <FilePlus2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">Merge PDF</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Combine multiple PDF files into one. Drag to reorder, then download your merged PDF — entirely in your browser.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                    Merge PDFs <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* Split PDF tool card */}
                <Link
                  href="/split-pdf"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                    <Scissors className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">Split PDF</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Extract specific pages or split a PDF into multiple files by range — all processed locally in your browser.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-green-600 group-hover:gap-2.5 transition-all">
                    Split PDF <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* Compress PDF tool card */}
                <Link
                  href="/compress-pdf"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                    <Minimize2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">Compress PDF</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Shrink a PDF by rebuilding its internal structure. Processed on our server and deleted the moment your download starts.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-purple-600 group-hover:gap-2.5 transition-all">
                    Compress PDF <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* Resize Image tool card */}
                <Link
                  href="/resize-image"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                    <Maximize2 className="w-6 h-6 text-amber-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">Resize Image</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Set exact pixel dimensions, scale by percentage, or shrink an image to a target size in KB. Runs in your browser.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-amber-600 group-hover:gap-2.5 transition-all">
                    Resize an image <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                </Link>

                {/* PDF to JPG tool card */}
                <Link
                  href="/pdf-to-jpg"
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                    <Images className="w-6 h-6 text-teal-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-lg">PDF to JPG</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Turn PDF pages into JPG or PNG images at the resolution you choose. Nothing leaves your browser.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-teal-600 group-hover:gap-2.5 transition-all">
                    Convert to images <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                </Link>
              </div>
            </div>
          </section>
          {/* ── How it works ── */}
          <section id="how-it-works" className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">How it works</h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto">Three simple steps — no account required.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {STEPS.map(s => (
                  <div key={s.n} className="bg-[#f8fafc] rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-5xl font-black text-red-100 mb-4 leading-none">{s.n}</div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{s.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Supported formats ── */}
          <section id="formats" className="py-20 bg-[#f8fafc]">
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
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Everything you need</h2>
                <p className="text-slate-500 text-lg">Built for developers, designers, and anyone who cares about performance.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map(f => (
                  <div key={f.title} className="bg-[#f8fafc] rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="py-20 bg-[#f8fafc]">
            <div className="max-w-3xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Frequently asked questions</h2>
                <p className="text-slate-500 text-lg">How the tools work, what the limits are, and where your files go.</p>
              </div>
              <div className="space-y-2.5">
                {HOME_FAQS.map((faq, i) => (
                  <details
                    key={i}
                    className="group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                  >
                    <summary className="flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-slate-50 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-[0.9375rem] leading-snug">{faq.q}</h3>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="py-20 bg-gradient-to-br from-red-500 via-red-600 to-orange-600">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Pick a tool and get started</h2>
              <p className="text-red-100 text-lg mb-8 leading-relaxed">
                Every tool is free and needs no account. Sign in only if you want a higher daily limit on the compressors, or API access.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/compress-image" className="bg-white text-red-600 rounded-xl px-8 py-3.5 font-black text-sm hover:bg-red-50 transition-colors shadow-lg shadow-red-900/30">
                  Compress an image
                </Link>
                <Link href="/register" className="border border-red-300/60 text-white rounded-xl px-8 py-3.5 font-bold text-sm hover:bg-white/10 transition-colors">
                  Get started free
                </Link>
              </div>
            </div>
          </section>

        </main>

      </div>
    </>
  );
}
