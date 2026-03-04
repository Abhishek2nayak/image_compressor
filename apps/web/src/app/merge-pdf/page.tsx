'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Upload, X, Plus, FileText, Loader2,
  GripVertical, FilePlus2, ArrowDown,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, formatBytes } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface PdfFile {
  id: string;
  file: File;
  pageCount: number | null; // null while loading
}

// ── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED = { 'application/pdf': ['.pdf'] };
const MAX_SIZE  = 100 * 1024 * 1024; // 100 MB

// ── Helpers ──────────────────────────────────────────────────────────────────

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? '';
  toast.error(msg.includes('size') ? 'File too large (max 100 MB)' : 'Only PDF files are supported');
}

async function readPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return doc.getPageCount();
}

// ── Sortable PDF card ─────────────────────────────────────────────────────────

interface CardProps {
  item: PdfFile;
  index: number;
  onRemove: (id: string) => void;
}

function SortablePdfCard({ item, index, onRemove }: CardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex:  isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={cn(
        'flex items-center gap-3 bg-white rounded-xl border px-4 py-3.5 shadow-sm transition-shadow group',
        isDragging ? 'shadow-lg border-blue-200' : 'border-slate-200 hover:border-slate-300',
      )}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Order number */}
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-blue-600">{index + 1}</span>
        </div>

        {/* PDF icon */}
        <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4.5 h-4.5 text-red-500" style={{ width: '1.125rem', height: '1.125rem' }} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
            {item.file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{formatBytes(item.file.size)}</span>
            {item.pageCount === null ? (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> reading…
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                · {item.pageCount} page{item.pageCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.id)}
          className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-50"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Down-arrow connector between cards */}
      <div className="flex justify-center py-1 text-slate-200 last:hidden">
        <ArrowDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MergePdfPage() {
  const [pdfs, setPdfs]           = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── File management ──────────────────────────────────────────────────────

  const addFiles = useCallback((accepted: File[]) => {
    const newItems: PdfFile[] = accepted.map(file => ({
      id: crypto.randomUUID(),
      file,
      pageCount: null,
    }));
    setPdfs(prev => [...prev, ...newItems]);

    // Load page counts asynchronously
    newItems.forEach(item => {
      readPageCount(item.file)
        .then(count => {
          setPdfs(prev =>
            prev.map(p => p.id === item.id ? { ...p, pageCount: count } : p),
          );
        })
        .catch(() => {
          setPdfs(prev =>
            prev.map(p => p.id === item.id ? { ...p, pageCount: 0 } : p),
          );
          toast.error(`Could not read ${item.file.name}`);
        });
    });
  }, []);

  function removeFile(id: string) {
    setPdfs(prev => prev.filter(p => p.id !== id));
  }

  function clearAll() {
    setPdfs([]);
  }

  // ── Drag end ─────────────────────────────────────────────────────────────

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      setPdfs(prev => {
        const from = prev.findIndex(p => p.id === active.id);
        const to   = prev.findIndex(p => p.id === over.id);
        return arrayMove(prev, from, to);
      });
    }
  }

  // ── Merge ────────────────────────────────────────────────────────────────

  async function mergePDFs() {
    if (pdfs.length < 2 || isMerging) return;
    setIsMerging(true);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();

      for (const pdfFile of pdfs) {
        const buffer   = await pdfFile.file.arrayBuffer();
        const doc      = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const indices  = doc.getPageIndices();
        const copied   = await merged.copyPages(doc, indices);
        copied.forEach(page => merged.addPage(page));
      }

      const bytes = await merged.save();
      // new Uint8Array(...) narrows ArrayBufferLike → ArrayBuffer for Blob
      const blob  = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = `merged-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      const totalPages = pdfs.reduce((s, p) => s + (p.pageCount ?? 0), 0);
      toast.success(`Merged ${pdfs.length} PDFs · ${totalPages} pages total`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to merge PDFs');
    } finally {
      setIsMerging(false);
    }
  }

  // ── Computed values ───────────────────────────────────────────────────────

  const totalPages   = pdfs.reduce((s, p) => s + (p.pageCount ?? 0), 0);
  const allLoaded    = pdfs.every(p => p.pageCount !== null);
  const canMerge     = pdfs.length >= 2;

  // ── Dropzones ────────────────────────────────────────────────────────────

  const {
    getRootProps: getEmptyRootProps,
    getInputProps: getEmptyInputProps,
    isDragActive:  isEmptyDragActive,
    open:          openPicker,
  } = useDropzone({
    onDrop: addFiles, accept: ACCEPTED, maxSize: MAX_SIZE,
    noClick: true, onDropRejected,
  });

  const {
    getRootProps: getAddRootProps,
    getInputProps: getAddInputProps,
    isDragActive:  isAddDragActive,
  } = useDropzone({
    onDrop: addFiles, accept: ACCEPTED, maxSize: MAX_SIZE, onDropRejected,
  });

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
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            All tools
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Empty state ── */}
        {pdfs.length === 0 && (
          <div
            {...getEmptyRootProps()}
            className="flex flex-col items-center justify-center min-h-[65vh] text-center"
          >
            <input {...getEmptyInputProps()} />

            <div className={cn(
              'w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-200',
              isEmptyDragActive
                ? 'bg-blue-100 scale-110 border-2 border-blue-300'
                : 'bg-white border-2 border-dashed border-slate-200',
            )}>
              <FilePlus2 className={cn(
                'w-10 h-10 transition-colors',
                isEmptyDragActive ? 'text-blue-500' : 'text-slate-300',
              )} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {isEmptyDragActive ? 'Drop your PDFs' : 'Merge PDF'}
            </h1>
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
              Combine multiple PDF files into one. Drag to reorder pages, then download your merged PDF — all processed in your browser.
            </p>

            <button
              type="button"
              onClick={openPicker}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-blue-200"
            >
              Select PDF Files
            </button>

            <p className="text-xs text-slate-400 mt-6">PDF files only · Max 100 MB each</p>
          </div>
        )}

        {/* ── Two-panel layout ── */}
        {pdfs.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left: sortable PDF list */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-700">
                  {pdfs.length} file{pdfs.length !== 1 ? 's' : ''}
                  <span className="text-slate-400 font-normal ml-1">· drag to reorder</span>
                </h2>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pdfs.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0">
                    {pdfs.map((item, index) => (
                      <SortablePdfCard
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={removeFile}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add more */}
              <div
                {...getAddRootProps()}
                className={cn(
                  'mt-2 border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-all',
                  isAddDragActive
                    ? 'border-blue-400 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30',
                )}
              >
                <input {...getAddInputProps()} />
                <div className="flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">
                    {isAddDragActive ? 'Drop to add' : 'Add more PDF files'}
                  </span>
                </div>
              </div>

              {/* Hint */}
              {!canMerge && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  Add at least 2 PDF files to merge
                </p>
              )}
            </div>

            {/* Right: panel */}
            <div className="lg:w-72 w-full shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-6 space-y-5">
                <h2 className="font-bold text-slate-800">Merge Summary</h2>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100 text-center">
                    <p className="text-2xl font-black text-blue-600">{pdfs.length}</p>
                    <p className="text-xs text-blue-500 font-medium">
                      PDF file{pdfs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
                    {allLoaded ? (
                      <>
                        <p className="text-2xl font-black text-slate-700">{totalPages}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          total page{totalPages !== 1 ? 's' : ''}
                        </p>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">counting…</p>
                      </>
                    )}
                  </div>
                </div>

                {/* File order list (compact) */}
                {pdfs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Merge order
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {pdfs.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 rounded bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {i + 1}
                          </span>
                          <span className="text-slate-600 truncate flex-1">{p.file.name}</span>
                          {p.pageCount !== null && (
                            <span className="text-slate-400 shrink-0">{p.pageCount}p</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Merge button */}
                <button
                  onClick={mergePDFs}
                  disabled={!canMerge || isMerging}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMerging ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Merging…
                    </span>
                  ) : (
                    `Merge ${pdfs.length} PDF${pdfs.length !== 1 ? 's' : ''}`
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Processed entirely in your browser — no uploads
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
