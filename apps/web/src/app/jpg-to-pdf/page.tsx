'use client';

import { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Upload, X, Plus, FileText, Loader2,
  RotateCcw, RotateCw, GripVertical,
  Smartphone, Monitor,
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
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type Rotation    = 0 | 90 | 180 | 270;
type PageSize    = 'A4' | 'Letter' | 'A3';
type Orientation = 'portrait' | 'landscape';
type Margin      = 'none' | 'small' | 'large';
type ImageFit    = 'fill' | 'fit' | 'original';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: Rotation;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_DIMS_MM: Record<PageSize, [number, number]> = {
  A4:     [210, 297],
  Letter: [216, 279],
  A3:     [297, 420],
};

const MARGIN_MM: Record<Margin, number> = { none: 0, small: 10, large: 20 };

const ACCEPTED = {
  'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [],
};
const MAX_SIZE = 25 * 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextRotation(r: Rotation, dir: 'cw' | 'ccw'): Rotation {
  const vals: Rotation[] = [0, 90, 180, 270];
  const idx = vals.indexOf(r);
  return vals[dir === 'cw' ? (idx + 1) % 4 : (idx + 3) % 4]!;
}

function onDropRejected(files: FileRejection[]) {
  const msg = files[0]?.errors[0]?.message ?? '';
  toast.error(msg.includes('size') ? 'File too large (max 25 MB)' : 'Unsupported file type');
}

async function getRotatedDataUrl(src: string, rotation: Rotation): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const swap = rotation === 90 || rotation === 270;
      const canvas = document.createElement('canvas');
      canvas.width  = swap ? img.height : img.width;
      canvas.height = swap ? img.width  : img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

function loadImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => reject(new Error('Dimension load failed'));
    img.src = src;
  });
}

// ── Sortable card ─────────────────────────────────────────────────────────────

interface CardProps {
  item: ImageItem;
  index: number;
  onRemove: (id: string) => void;
  onRotate: (id: string, dir: 'cw' | 'ccw') => void;
}

function SortableImageCard({ item, index, onRemove, onRotate }: CardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none"
    >
      {/* Drag handle — always visible on mobile, hover-only on desktop */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center h-7 bg-slate-50 border-b border-slate-100 cursor-grab active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Image preview */}
      <div className="relative w-full bg-slate-100 overflow-hidden" style={{ aspectRatio: '1' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            transform: `rotate(${item.rotation}deg)`,
            transition: 'transform 0.3s ease',
          }}
        />

        {/* Page number badge */}
        <div className="absolute bottom-2 left-2 bg-black/55 text-white text-xs font-bold px-1.5 py-0.5 rounded-md leading-tight">
          {index + 1}
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
          title="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Rotate controls + filename */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white border-t border-slate-100">
        <button
          onClick={() => onRotate(item.id, 'ccw')}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          title="Rotate left"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="flex-1 text-xs text-slate-400 truncate text-center min-w-0">
          {item.file.name}
        </span>
        <button
          onClick={() => onRotate(item.id, 'cw')}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          title="Rotate right"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Reusable settings row ─────────────────────────────────────────────────────

function SettingsRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex gap-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg border capitalize transition-all',
              value === opt.value
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                : 'border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-500 bg-white',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JpgToPdfPage() {
  const [images, setImages]             = useState<ImageItem[]>([]);
  const [pageSize, setPageSize]         = useState<PageSize>('A4');
  const [orientation, setOrientation]   = useState<Orientation>('portrait');
  const [margin, setMargin]             = useState<Margin>('small');
  const [imageFit, setImageFit]         = useState<ImageFit>('fit');
  const [isConverting, setIsConverting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── File management ──────────────────────────────────────────────────────

  const addFiles = useCallback((accepted: File[]) => {
    setImages(prev => [
      ...prev,
      ...accepted.map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        rotation: 0 as Rotation,
      })),
    ]);
  }, []);

  function removeImage(id: string) {
    setImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  }

  function clearAll() {
    images.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
  }

  function rotateImage(id: string, dir: 'cw' | 'ccw') {
    setImages(prev =>
      prev.map(i => i.id === id ? { ...i, rotation: nextRotation(i.rotation, dir) } : i),
    );
  }

  // ── Drag end ─────────────────────────────────────────────────────────────

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      setImages(prev => {
        const from = prev.findIndex(i => i.id === active.id);
        const to   = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, from, to);
      });
    }
  }

  // ── PDF generation ───────────────────────────────────────────────────────

  async function convertToPDF() {
    if (!images.length || isConverting) return;
    setIsConverting(true);

    try {
      const { jsPDF } = await import('jspdf');

      const [basW, basH] = PAGE_DIMS_MM[pageSize];
      const [pw, ph]     = orientation === 'portrait' ? [basW, basH] : [basH, basW];
      const m            = MARGIN_MM[margin];
      const availW       = pw - m * 2;
      const availH       = ph - m * 2;

      const pdf = new jsPDF({
        orientation,
        unit:   'mm',
        format: pageSize.toLowerCase() as 'a4' | 'letter' | 'a3',
      });

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();

        const item    = images[i]!;
        const dataUrl = await getRotatedDataUrl(item.previewUrl, item.rotation);
        const { w: pxW, h: pxH } = await loadImageDimensions(dataUrl);

        // Convert px → mm  (96 dpi: 1px = 0.264583 mm)
        const imgW = pxW * 0.264583;
        const imgH = pxH * 0.264583;

        let drawW: number;
        let drawH: number;

        if (imageFit === 'fit') {
          const scale = Math.min(availW / imgW, availH / imgH);
          drawW = imgW * scale;
          drawH = imgH * scale;
        } else if (imageFit === 'fill') {
          const scale = Math.max(availW / imgW, availH / imgH);
          drawW = imgW * scale;
          drawH = imgH * scale;
        } else {
          // original — use natural size, capped at available area
          drawW = Math.min(imgW, availW);
          drawH = Math.min(imgH, availH);
        }

        const x = m + (availW - drawW) / 2;
        const y = m + (availH - drawH) / 2;

        pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
      }

      pdf.save(`easy-pdf-studio-${Date.now()}.pdf`);
      toast.success(`PDF created — ${images.length} page${images.length !== 1 ? 's' : ''}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsConverting(false);
    }
  }

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
        {images.length === 0 && (
          <div
            {...getEmptyRootProps()}
            className="flex flex-col items-center justify-center min-h-[65vh] text-center"
          >
            <input {...getEmptyInputProps()} />
            <div className={cn(
              'w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-200',
              isEmptyDragActive
                ? 'bg-orange-100 scale-110 border-2 border-orange-300'
                : 'bg-white border-2 border-dashed border-slate-200',
            )}>
              <Upload className={cn(
                'w-10 h-10 transition-colors',
                isEmptyDragActive ? 'text-orange-500' : 'text-slate-300',
              )} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {isEmptyDragActive ? 'Drop your images' : 'JPG to PDF'}
            </h1>
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
              Convert JPEG, PNG, WebP and AVIF images into a single PDF.
              Reorder pages, rotate images, and pick your layout — all in the browser.
            </p>

            <button
              type="button"
              onClick={openPicker}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-10 py-3.5 font-bold text-sm transition-colors shadow-lg shadow-orange-200"
            >
              Select Images
            </button>

            <div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
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
        {images.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left: sortable grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-700">
                  {images.length} page{images.length !== 1 ? 's' : ''}
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
                  items={images.map(i => i.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((item, index) => (
                      <SortableImageCard
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={removeImage}
                        onRotate={rotateImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add more */}
              <div
                {...getAddRootProps()}
                className={cn(
                  'mt-3 border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-all',
                  isAddDragActive
                    ? 'border-orange-400 bg-orange-50 text-orange-600'
                    : 'border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30',
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
            </div>

            {/* Right: settings panel */}
            <div className="lg:w-72 w-full shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-6 space-y-5">
                <h2 className="font-bold text-slate-800">PDF Settings</h2>

                <SettingsRow
                  label="Page size"
                  value={pageSize}
                  onChange={setPageSize}
                  options={[
                    { value: 'A4',     label: 'A4' },
                    { value: 'Letter', label: 'Letter' },
                    { value: 'A3',     label: 'A3' },
                  ]}
                />

                <SettingsRow
                  label="Orientation"
                  value={orientation}
                  onChange={setOrientation}
                  options={[
                    { value: 'portrait',  label: 'Portrait',  icon: <Smartphone className="w-3.5 h-3.5" /> },
                    { value: 'landscape', label: 'Landscape', icon: <Monitor className="w-3.5 h-3.5" /> },
                  ]}
                />

                <SettingsRow
                  label="Margin"
                  value={margin}
                  onChange={setMargin}
                  options={[
                    { value: 'none',  label: 'None' },
                    { value: 'small', label: 'Small' },
                    { value: 'large', label: 'Large' },
                  ]}
                />

                <SettingsRow
                  label="Image fit"
                  value={imageFit}
                  onChange={setImageFit}
                  options={[
                    { value: 'fill',     label: 'Fill' },
                    { value: 'fit',      label: 'Fit' },
                    { value: 'original', label: 'Original' },
                  ]}
                />

                {/* Page count */}
                <div className="bg-orange-50 rounded-xl p-3.5 border border-orange-100 text-center">
                  <p className="text-2xl font-black text-orange-600">{images.length}</p>
                  <p className="text-xs text-orange-500 font-medium">
                    page{images.length !== 1 ? 's' : ''} in PDF
                  </p>
                </div>

                {/* Convert button */}
                <button
                  onClick={convertToPDF}
                  disabled={isConverting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isConverting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating PDF…
                    </span>
                  ) : (
                    'Convert to PDF'
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
