import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

export type CompressionLevel = 'low' | 'medium' | 'high';

export interface PdfCompressResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
}

export async function compressPdf(
  filePath: string,
  level: CompressionLevel = 'medium',
): Promise<PdfCompressResult> {
  const originalBytes = await fs.readFile(filePath);
  const originalSize = originalBytes.length;

  const doc = await PDFDocument.load(originalBytes);
  const pageCount = doc.getPageCount();

  if (level === 'high') {
    // Strip all document metadata to shed as many bytes as possible
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));
  }

  // low  → re-serialise only (normalises structure, no object streams)
  // medium / high → enable cross-reference stream compression
  const useObjectStreams = level !== 'low';
  const compressedBytes = await doc.save({ useObjectStreams });
  const buffer = Buffer.from(compressedBytes);

  return { buffer, originalSize, compressedSize: buffer.length, pageCount };
}
