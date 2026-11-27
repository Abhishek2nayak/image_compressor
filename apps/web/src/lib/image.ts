'use client';

/** Shared image helpers for the browser-only image tools. */

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export const EXT: Record<ImageMime, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Decode a File/Blob into an <img>. Rejects with a friendly message on failure. */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img); setTimeout(() => URL.revokeObjectURL(url), 0); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be opened. Try a JPG, PNG or WebP file.')); };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: ImageMime = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode the image.'))), type, quality);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'image';
}

/** Draw `src` into a new canvas of w×h. `fill` paints a background first (needed for JPEG). */
export function drawToCanvas(
  src: CanvasImageSource, w: number, h: number,
  opts: { fill?: string; sx?: number; sy?: number; sw?: number; sh?: number } = {},
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  if (opts.sw && opts.sh) ctx.drawImage(src, opts.sx ?? 0, opts.sy ?? 0, opts.sw, opts.sh, 0, 0, canvas.width, canvas.height);
  else ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export interface TargetResult { blob: Blob; width: number; height: number; quality: number; hitTarget: boolean }

/**
 * Encode an image as close to (but not above) `targetBytes` as possible.
 * Binary-searches JPEG/WebP quality first; if even low quality is too big,
 * scales the image down step by step and tries again.
 */
export async function encodeToTarget(
  img: HTMLImageElement | HTMLCanvasElement, targetBytes: number,
  { type = 'image/jpeg', maxWidth, maxHeight, minQuality = 0.3 }: { type?: 'image/jpeg' | 'image/webp'; maxWidth?: number; maxHeight?: number; minQuality?: number } = {},
): Promise<TargetResult> {
  const iw = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const ih = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  let scale = Math.min(1, maxWidth ? maxWidth / iw : 1, maxHeight ? maxHeight / ih : 1);
  let best: TargetResult | null = null;

  for (let attempt = 0; attempt < 14; attempt++) {
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));
    const canvas = drawToCanvas(img, w, h, { fill: '#ffffff' });
    let lo = minQuality, hi = 0.95;
    let fit: { blob: Blob; q: number } | null = null;
    // Quick check at the top quality: maybe it already fits.
    const top = await canvasToBlob(canvas, type, hi);
    if (top.size <= targetBytes) fit = { blob: top, q: hi };
    else {
      for (let i = 0; i < 7; i++) {
        const q = (lo + hi) / 2;
        const b = await canvasToBlob(canvas, type, q);
        if (b.size <= targetBytes) { fit = { blob: b, q }; lo = q; } else hi = q;
      }
    }
    if (fit) return { blob: fit.blob, width: w, height: h, quality: fit.q, hitTarget: true };
    const smallest = await canvasToBlob(canvas, type, minQuality);
    if (!best || smallest.size < best.blob.size) best = { blob: smallest, width: w, height: h, quality: minQuality, hitTarget: false };
    // Shrink proportionally to how far over we are (at least 10%).
    scale *= Math.min(0.9, Math.sqrt(targetBytes / smallest.size) * 0.95);
    if (w < 16 || h < 16) break;
  }
  return best!;
}

export function formatKB(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Read an image pasted with Ctrl/⌘+V anywhere on the page. */
export function imageFromClipboard(e: ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const it of items) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) return new File([f], f.name && f.name !== 'image.png' ? f.name : `pasted-${Date.now()}.png`, { type: f.type });
    }
  }
  return null;
}
