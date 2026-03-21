'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  FileText, Scissors, Loader2, Plus, X, Check, Layers, AlignLeft,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { CloudFilePicker } from '@/components/CloudFilePicker';

// ── Minimal pdfjs type (avoids importing the package into webpack) ─────────────

interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage {
  getViewport(opts: { scale: number }): PdfjsViewport;
  render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport; canvas: HTMLCanvasElement }): PdfjsRenderTask;
}
interface PdfjsDocument { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib {
  GlobalWorkerOptions: { workerSrc: string; workerPort: Worker | null };
  getDocument(params: { data: Uint8Array }): { promise: Promise<PdfjsDocument> };
}

// Load pdfjs from /public via a <script type="module"> — completely bypasses
// webpack so the ESM-only pdf.min.mjs never enters the webpack pipeline.
let _pdfjsPromise: Promise<PdfjsLib> | null = null;
function getPdfjsLib(): Promise<PdfjsLib> {
  if (!_pdfjsPromise) {
    _pdfjsPromise = new Promise<PdfjsLib>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      // Import the local copy, assign to a known window key, then fire an event
      script.textContent = `
        import * as lib from '/pdf.min.mjs';
        window.__pdfjsLib = lib;
        document.dispatchEvent(new Event('__pdfjsready'));
      `;
      document.addEventListener('__pdfjsready', () => {
        resolve((window as unknown as { __pdfjsLib: PdfjsLib }).__pdfjsLib);
      }, { once: true });
      script.onerror = () => reject(new Error('Failed to load PDF.js from /pdf.min.mjs'));
      document.head.appendChild(script);
    });
  }
  return _pdfjsPromise;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface PageThumb {
  pageNum: number; // 1-indexed
  dataUrl: string; // '' while rendering
  selected: boolean;
}

type SplitMode = "extract" | "ranges";

// ── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED = { "application/pdf": [".pdf"] };
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

// ── Helpers ──────────────────────────────────────────────────────────────────

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? "";
  toast.error(
    msg.includes("size")
      ? "File too large (max 100 MB)"
      : "Only PDF files are supported",
  );
}

/** Parse a range string like "1-3, 5, 7-9" into arrays of 1-indexed page numbers. */
function parseRanges(input: string, total: number): number[][] {
  const result: number[][] = [];
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end > total || start > end) continue;
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    result.push(pages);
  }
  return result;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbs, setThumbs] = useState<PageThumb[]>([]);
  const [thumbsLoaded, setThumbsLoaded] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [mode, setMode] = useState<SplitMode>("extract");
  const [rangeInput, setRangeInput] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  // cancel rendering if a new file is dropped
  const cancelRef = useRef(false);

  // ── Load PDF & render thumbnails ──────────────────────────────────────────

  async function loadFile(pdfFile: File) {
    cancelRef.current = true; // cancel any previous render
    setFile(pdfFile);
    setThumbs([]);
    setThumbsLoaded(0);
    setTotalPages(0);
    setIsRendering(true);
    cancelRef.current = false;

    try {
      const pdfjsLib = await getPdfjsLib();

      // Worker is also ESM — must be created with { type: 'module' }. Reuse across loads.
      if (!pdfjsLib.GlobalWorkerOptions.workerPort) {
        pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
          '/pdf.worker.min.mjs',
          { type: 'module' },
        );
      }

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const count = pdf.numPages;
      setTotalPages(count);

      // Initialise blank thumb entries so the grid appears immediately
      setThumbs(
        Array.from({ length: count }, (_, i) => ({
          pageNum: i + 1,
          dataUrl: "",
          selected: false,
        })),
      );

      // Render thumbnails one by one
      const SCALE = 0.4;
      for (let i = 1; i <= count; i++) {
        if (cancelRef.current) break;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setThumbs((prev) =>
          prev.map((t) => (t.pageNum === i ? { ...t, dataUrl } : t)),
        );
        setThumbsLoaded(i);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[split-pdf] loadFile error:", msg);
      console.log("error------>>", err);
      toast.error(
        msg.toLowerCase().includes("password")
          ? "This PDF is password-protected — please unlock it first"
          : "Failed to read PDF — try a different file",
      );
      setFile(null);
    } finally {
      setIsRendering(false);
    }
  }

  // ── Dropzones ────────────────────────────────────────────────────────────

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) loadFile(accepted[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    getRootProps: getEmptyRootProps,
    getInputProps: getEmptyInputProps,
    isDragActive: isEmptyDragActive,
    open: openPicker,
  } = useDropzone({
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

  // ── Thumbnail helpers ─────────────────────────────────────────────────────

  function togglePage(pageNum: number) {
    setThumbs((prev) =>
      prev.map((t) =>
        t.pageNum === pageNum ? { ...t, selected: !t.selected } : t,
      ),
    );
  }

  function selectAll() {
    setThumbs((prev) => prev.map((t) => ({ ...t, selected: true })));
  }
  function deselectAll() {
    setThumbs((prev) => prev.map((t) => ({ ...t, selected: false })));
  }

  const selectedCount = thumbs.filter((t) => t.selected).length;
  const renderProgress =
    totalPages > 0 ? Math.round((thumbsLoaded / totalPages) * 100) : 0;

  // ── Split / Extract ───────────────────────────────────────────────────────

  async function handleSplit() {
    if (!file || isSplitting) return;

    if (mode === "extract" && selectedCount === 0) {
      toast.error("Select at least one page to extract");
      return;
    }
    if (mode === "ranges" && !rangeInput.trim()) {
      toast.error("Enter page ranges, e.g. 1-3, 5, 7-9");
      return;
    }
    if (mode === "ranges" && parseRanges(rangeInput, totalPages).length === 0) {
      toast.error("No valid ranges found — check your input");
      return;
    }

    setIsSplitting(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const srcBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBuffer, {
        ignoreEncryption: true,
      });

      if (mode === "extract") {
        const indices = thumbs
          .filter((t) => t.selected)
          .map((t) => t.pageNum - 1);
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, indices);
        copied.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        downloadBlob(
          new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
          "extracted-pages.pdf",
        );
        toast.success(
          `Extracted ${indices.length} page${indices.length !== 1 ? "s" : ""} to PDF`,
        );
      } else {
        const ranges = parseRanges(rangeInput, totalPages);
        for (let i = 0; i < ranges.length; i++) {
          const indices = ranges[i].map((p) => p - 1);
          const newDoc = await PDFDocument.create();
          const copied = await newDoc.copyPages(srcDoc, indices);
          copied.forEach((p) => newDoc.addPage(p));
          const bytes = await newDoc.save();
          // slight delay between downloads so browsers don't block them
          await new Promise((r) => setTimeout(r, i * 250));
          downloadBlob(
            new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
            `split-part-${i + 1}.pdf`,
          );
        }
        toast.success(
          `Split into ${ranges.length} PDF file${ranges.length !== 1 ? "s" : ""}`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to split PDF");
    } finally {
      setIsSplitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

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
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            All tools
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {!file && (
          <div
            {...getEmptyRootProps()}
            className="flex flex-col items-center justify-center min-h-[65vh] text-center"
          >
            <input {...getEmptyInputProps()} />

            <div
              className={cn(
                "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-200",
                isEmptyDragActive
                  ? "bg-green-100 scale-110 border-2 border-green-300"
                  : "bg-white border-2 border-dashed border-slate-200",
              )}
            >
              <Scissors
                className={cn(
                  "w-10 h-10 transition-colors",
                  isEmptyDragActive ? "text-green-500" : "text-slate-300",
                )}
              />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {isEmptyDragActive ? "Drop your PDF" : "Split PDF"}
            </h1>
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
              Extract pages or split a PDF into multiple files — all processed
              in your browser, nothing uploaded.
            </p>

            <button
              type="button"
              onClick={openPicker}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-green-200"
            >
              Select PDF File
            </button>

            <div className="flex items-center gap-3 mt-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or import from</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <CloudFilePicker
              onFiles={(files) => { if (files[0]) loadFile(files[0]); }}
              accept="pdf"
              multiple={false}
            />

            <p className="text-xs text-slate-400 mt-2">
              PDF files only · Max 100 MB
            </p>
          </div>
        )}

        {/* ── Two-panel layout ─────────────────────────────────────────────── */}
        {file && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: page thumbnails */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <span
                    className="text-sm font-bold text-slate-700 truncate max-w-xs inline-block"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="text-slate-400 font-normal ml-1.5 text-xs">
                    · {formatBytes(file.size)} · {totalPages} page
                    {totalPages !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {mode === "extract" &&
                    thumbsLoaded === totalPages &&
                    totalPages > 0 && (
                      <>
                        <button
                          onClick={selectAll}
                          className="text-xs text-slate-500 hover:text-green-600 transition-colors font-medium"
                        >
                          All
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={deselectAll}
                          className="text-xs text-slate-500 hover:text-red-500 transition-colors font-medium"
                        >
                          None
                        </button>
                        <span className="text-slate-200">|</span>
                      </>
                    )}
                  <button
                    onClick={() => {
                      setFile(null);
                      setThumbs([]);
                      setTotalPages(0);
                      cancelRef.current = true;
                    }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Change file
                  </button>
                </div>
              </div>

              {/* Render progress bar */}
              {isRendering && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Rendering
                      thumbnails…
                    </span>
                    <span>
                      {thumbsLoaded}/{totalPages}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Thumbnail grid */}
              {thumbs.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {thumbs.map((thumb) => (
                    <button
                      key={thumb.pageNum}
                      onClick={() =>
                        mode === "extract" && togglePage(thumb.pageNum)
                      }
                      disabled={mode !== "extract"}
                      className={cn(
                        "relative group rounded-xl border-2 overflow-hidden aspect-[3/4] bg-white transition-all duration-150",
                        mode === "extract"
                          ? thumb.selected
                            ? "border-green-500 shadow-md shadow-green-100 scale-[1.02]"
                            : "border-slate-200 hover:border-green-300 hover:shadow-sm"
                          : "border-slate-200 cursor-default",
                      )}
                    >
                      {/* Thumbnail image or skeleton */}
                      {thumb.dataUrl ? (
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${thumb.pageNum}`}
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                          <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                        </div>
                      )}

                      {/* Selection overlay */}
                      {mode === "extract" && thumb.selected && (
                        <div className="absolute inset-0 bg-green-500/15 flex items-center justify-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Page number badge */}
                      <div
                        className={cn(
                          "absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                          thumb.selected
                            ? "bg-green-500 text-white"
                            : "bg-white/90 text-slate-500 border border-slate-200",
                        )}
                      >
                        {thumb.pageNum}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Replace file drop zone */}
              {thumbsLoaded === totalPages && totalPages > 0 && (
                <div
                  {...getReplaceRootProps()}
                  className={cn(
                    "mt-4 border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-all",
                    isReplaceDragActive
                      ? "border-green-400 bg-green-50 text-green-600"
                      : "border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50/30",
                  )}
                >
                  <input {...getReplaceInputProps()} />
                  <div className="flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">
                      {isReplaceDragActive
                        ? "Drop to replace"
                        : "Drop a different PDF"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: settings panel */}
            <div className="lg:w-72 w-full shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-6 space-y-5">
                <h2 className="font-bold text-slate-800">Split Options</h2>

                {/* Mode toggle */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Mode
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode("extract")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all",
                        mode === "extract"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300",
                      )}
                    >
                      <Layers className="w-4 h-4" />
                      Extract pages
                    </button>
                    <button
                      onClick={() => setMode("ranges")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all",
                        mode === "ranges"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300",
                      )}
                    >
                      <AlignLeft className="w-4 h-4" />
                      By ranges
                    </button>
                  </div>
                </div>

                {/* Mode-specific UI */}
                {mode === "extract" ? (
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
                      <p className="text-2xl font-black text-green-600">
                        {selectedCount}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        page{selectedCount !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed text-center">
                      Click thumbnails on the left to select pages. Selected
                      pages will be combined into a single PDF.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Page ranges
                      </label>
                      <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder={`e.g. 1-3, 5, 7-${Math.min(totalPages, 9)}`}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition"
                      />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Each comma-separated range becomes a separate PDF file.
                      <br />
                      <span className="font-medium text-slate-500">
                        Total pages: {totalPages}
                      </span>
                    </p>
                    {rangeInput.trim() &&
                      (() => {
                        const ranges = parseRanges(rangeInput, totalPages);
                        return ranges.length > 0 ? (
                          <div className="space-y-1">
                            {ranges.map((pages, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="w-5 h-5 rounded bg-green-100 text-green-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                  {i + 1}
                                </span>
                                <span className="text-slate-600">
                                  Page{pages.length !== 1 ? "s" : ""} {pages[0]}
                                  {pages.length > 1
                                    ? `–${pages[pages.length - 1]}`
                                    : ""}{" "}
                                  ({pages.length}p)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-red-400">
                            No valid ranges found
                          </p>
                        );
                      })()}
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={handleSplit}
                  disabled={
                    isSplitting ||
                    isRendering ||
                    (mode === "extract" && selectedCount === 0) ||
                    (mode === "ranges" &&
                      parseRanges(rangeInput, totalPages).length === 0)
                  }
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-md shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSplitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Splitting…
                    </>
                  ) : mode === "extract" ? (
                    <>
                      <Scissors className="w-4 h-4" /> Extract{" "}
                      {selectedCount > 0
                        ? `${selectedCount} page${selectedCount !== 1 ? "s" : ""}`
                        : "pages"}
                    </>
                  ) : (
                    (() => {
                      const n = parseRanges(rangeInput, totalPages).length;
                      return (
                        <>
                          <Scissors className="w-4 h-4" /> Split into{" "}
                          {n > 0 ? `${n} PDF${n !== 1 ? "s" : ""}` : "PDFs"}
                        </>
                      );
                    })()
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Processed entirely in your browser — no uploads
                </p>

                {/* Remove button */}
                <button
                  onClick={() => {
                    setFile(null);
                    setThumbs([]);
                    setTotalPages(0);
                    cancelRef.current = true;
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors py-1"
                >
                  <X className="w-3.5 h-3.5" /> Remove file
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
