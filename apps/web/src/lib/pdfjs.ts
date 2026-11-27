'use client';

/**
 * Shared pdf.js loader. ALWAYS use this instead of `import('pdfjs-dist')`.
 *
 * pdf.js v5 ships ESM-only builds that break when bundled by Next 15's webpack
 * ("Object.defineProperty called on non-object"). So we load the copies in
 * /public (kept in sync by scripts/copy-pdfjs.js on install) with a native
 * browser import that webpack ignores. Only the types come from the package.
 */
import type * as PdfJs from 'pdfjs-dist';

export type PdfJsLib = typeof PdfJs;
export type PdfDocument = PdfJs.PDFDocumentProxy;

const LIB_URL = '/pdf.min.mjs';
const WORKER_URL = '/pdf.worker.min.mjs';

let promise: Promise<PdfJsLib> | null = null;

export function loadPdfjs(): Promise<PdfJsLib> {
  if (!promise) {
    promise = (import(/* webpackIgnore: true */ LIB_URL) as Promise<PdfJsLib>)
      .then(lib => {
        if (!lib.GlobalWorkerOptions.workerPort) {
          // The worker is ESM too, so it must be a module worker. Reused across documents.
          lib.GlobalWorkerOptions.workerPort = new Worker(WORKER_URL, { type: 'module' });
        }
        return lib;
      })
      .catch(err => {
        promise = null; // allow a retry, e.g. after a network blip
        throw err;
      });
  }
  return promise;
}

/** Open a PDF from a File. Call `doc.destroy()` when finished to free memory. */
export async function openPdf(file: File | Blob): Promise<PdfDocument> {
  const lib = await loadPdfjs();
  return lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}
