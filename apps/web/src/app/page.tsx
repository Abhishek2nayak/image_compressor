'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import {
  FileText, ChevronDown, Shield, Clock,
  Layers, Code2, Gauge, ImageIcon,
  ArrowRight, FilePlus2, Scissors, Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FORMATS = [
  { ext: 'JPEG', emoji: '🖼️', color: 'bg-orange-50 border-orange-100', desc: 'Best for photos and images with rich gradients. Achieves 40–70% compression at quality 75.' },
  { ext: 'PNG',  emoji: '🎨', color: 'bg-sky-50 border-sky-100',      desc: 'Lossless compression. Preserves transparency. Great for logos, icons, and UI graphics.' },
  { ext: 'WebP', emoji: '⚡', color: 'bg-green-50 border-green-100',  desc: 'Modern format with 25–35% better compression than JPEG. Supported by all major browsers.' },
  { ext: 'AVIF', emoji: '🚀', color: 'bg-violet-50 border-violet-100', desc: 'Next-generation format. Up to 50% smaller than JPEG with equivalent visual quality.' },
];

const FEATURES = [
  { icon: Gauge,     title: 'Smart Compression',  desc: 'Advanced algorithms minimise file size while preserving visual quality across all compression levels.' },
  { icon: Layers,    title: 'Batch Processing',    desc: 'Upload and compress up to 20 images at once. Download all results individually.' },
  { icon: Code2,     title: 'Developer API',       desc: 'REST API with API key auth. Integrate image compression into any app, pipeline, or CMS.' },
  { icon: Shield,    title: 'Secure & Private',    desc: 'Files are automatically deleted after 24 hours. We never access or share your images.' },
  { icon: Clock,     title: 'Lightning Fast',      desc: 'Parallel processing queue handles thousands of images concurrently with near-instant results.' },
  { icon: ImageIcon, title: 'All Major Formats',   desc: 'JPEG, PNG, WebP, and AVIF — the four formats that matter most for web and mobile.' },
];

const STEPS = [
  { n: '01', title: 'Select images',       desc: 'Drag and drop up to 20 images or click to browse. No account required. Supports JPEG, PNG, WebP, AVIF up to 25 MB each.' },
  { n: '02', title: 'Adjust quality',      desc: 'Slide to any quality from 1 to 100. Higher values = better quality, lower = smaller file. See the estimated output size in real time.' },
  { n: '03', title: 'Download optimised',  desc: 'Click Compress and your files are ready in seconds. Download each result individually, or grab all at once.' },
];

const FAQS = [
  {
    q: 'How do I compress an image without losing quality?',
    a: 'Set the quality slider to 75–85. This range strips invisible data (EXIF metadata, redundant colour information) that the human eye cannot perceive, typically achieving 40–60% file reduction with zero visible difference.',
  },
  {
    q: 'What image formats does Easy PDF Studio support?',
    a: 'The image compressor supports JPEG (JPG), PNG, WebP, and AVIF — the four formats that cover virtually all web, mobile, and photography use cases.',
  },
  {
    q: 'Is there a file size limit for uploads?',
    a: 'Each file can be up to 25 MB. You can compress images without an account. Sign up free to track history, or upgrade to Pro for 500 images per day plus API access.',
  },
  {
    q: 'Are my uploaded images stored permanently?',
    a: 'No. All files — original uploads and compressed outputs — are permanently and automatically deleted after 24 hours. We never access, analyse, or share your images.',
  },
  {
    q: 'Can I compress multiple images at once?',
    a: 'Yes. Drop up to 20 images at once. Each image is processed in parallel. When all are done you can download them individually.',
  },
  {
    q: 'What is the difference between quality levels?',
    a: 'Higher quality (85–100) is nearly lossless — ideal for print or archival. Balanced (50–70) is the sweet spot for most web images. Lower values (1–30) maximise compression at the cost of some visible quality — useful for thumbnails.',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: 'Easy PDF Studio', url: 'https://easyPdfStudio.app',
          description: 'Free online tools for images and PDFs. Compress JPEG, PNG, WebP, AVIF files without quality loss.',
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
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Easy PDF Studio</span>
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
                <FileText className="w-3 h-3" /> 100% Free · No Sign-up Required
              </div>
              <h1 className="text-5xl sm:text-[3.75rem] font-black tracking-tight leading-[1.06] mb-5">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Easy PDF Studio.
                </span>
                <br />
                <span className="text-slate-900">Simple. Fast. Free.</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
                Free online tools for images and PDFs.
                Compress, convert, and optimise — no account required, no watermarks.
              </p>
              <Link
                href="/compress-image"
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-200"
              >
                Start Compressing Images <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['✓ No sign-up required', '✓ JPEG · PNG · WebP · AVIF', '✓ Files deleted after 24h'].map(f => (
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
                    Reduce JPEG, PNG, WebP and AVIF file sizes by up to 80% without visible quality loss. Free, instant, no account needed.
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
                    Reduce PDF file size by re-optimising its internal structure. Quota-enforced, processed securely on our servers.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-purple-600 group-hover:gap-2.5 transition-all">
                    Compress PDF <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="bg-[#f8fafc]">
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
          <section className="py-20 bg-gradient-to-br from-red-500 via-red-600 to-orange-600">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to optimise your images?</h2>
              <p className="text-red-100 text-lg mb-8 leading-relaxed">
                Create a free account to unlock history, batch processing, and full API access.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/compress-image" className="bg-white text-red-600 rounded-xl px-8 py-3.5 font-black text-sm hover:bg-red-50 transition-colors shadow-lg shadow-red-900/30">
                  Try Image Compressor
                </Link>
                <Link href="/register" className="border border-red-300/60 text-white rounded-xl px-8 py-3.5 font-bold text-sm hover:bg-white/10 transition-colors">
                  Get started free
                </Link>
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
                  <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white text-lg">Easy PDF Studio</span>
                </div>
                <p className="text-sm leading-relaxed max-w-xs">
                  Free online tools for images and PDFs. Fast, simple, and private.
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-3">Tools</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/compress-image" className="hover:text-white transition-colors">Image Compressor</Link></li>
                  <li><Link href="/jpg-to-pdf"      className="hover:text-white transition-colors">JPG to PDF</Link></li>
                  <li><Link href="/merge-pdf"       className="hover:text-white transition-colors">Merge PDF</Link></li>
                  <li><Link href="/split-pdf"       className="hover:text-white transition-colors">Split PDF</Link></li>
                  <li><Link href="/compress-pdf"   className="hover:text-white transition-colors">Compress PDF</Link></li>
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
              <span>© {new Date().getFullYear()} Easy PDF Studio. All rights reserved.</span>
              <span>Files deleted after 24 hours · SSL encrypted · No watermarks</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
