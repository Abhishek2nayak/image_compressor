/**
 * Minimal, dependency-free ZIP reader for the browser.
 *
 * Reads only the central directory and the entries you ask for, using
 * Blob.slice, so a multi-GB export (e.g. an Instagram download with media)
 * never has to be loaded into memory. Supports stored and deflated entries
 * and ZIP64. Inflation uses the built-in DecompressionStream.
 */

export interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  size: number;
  localOffset: number;
}

const U32_MAX = 0xffffffff;

async function bytes(blob: Blob, start: number, end: number): Promise<DataView> {
  return new DataView(await blob.slice(start, end).arrayBuffer());
}

function u64(v: DataView, at: number): number {
  return Number(v.getBigUint64(at, true));
}

export async function listZip(file: Blob): Promise<ZipEntry[]> {
  // End-of-central-directory record: last 22 bytes + up to 64 KB comment.
  const tailStart = Math.max(0, file.size - 22 - 0xffff);
  const tail = await bytes(file, tailStart, file.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This does not look like a ZIP file.');

  let count = tail.getUint16(eocd + 10, true);
  let cdSize = tail.getUint32(eocd + 12, true);
  let cdOffset = tail.getUint32(eocd + 16, true);

  if (cdOffset === U32_MAX || cdSize === U32_MAX || count === 0xffff) {
    // ZIP64: the locator sits 20 bytes before the EOCD record.
    const loc = eocd - 20;
    if (loc < 0 || tail.getUint32(loc, true) !== 0x07064b50) throw new Error('Unsupported ZIP format.');
    const z64At = u64(tail, loc + 8);
    const z64 = await bytes(file, z64At, z64At + 56);
    if (z64.getUint32(0, true) !== 0x06064b50) throw new Error('Unsupported ZIP format.');
    count = u64(z64, 32);
    cdSize = u64(z64, 40);
    cdOffset = u64(z64, 48);
  }

  const cd = await bytes(file, cdOffset, cdOffset + cdSize);
  const utf8 = new TextDecoder('utf-8');
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
    if (cd.getUint32(p, true) !== 0x02014b50) break;
    const method = cd.getUint16(p + 10, true);
    let compressedSize = cd.getUint32(p + 20, true);
    let size = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    let localOffset = cd.getUint32(p + 42, true);
    const name = utf8.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));

    // ZIP64 extended-information extra field (id 0x0001).
    let e = p + 46 + nameLen;
    const eEnd = e + extraLen;
    while (e + 4 <= eEnd) {
      const id = cd.getUint16(e, true);
      const len = cd.getUint16(e + 2, true);
      if (id === 0x0001) {
        let q = e + 4;
        if (size === U32_MAX) { size = u64(cd, q); q += 8; }
        if (compressedSize === U32_MAX) { compressedSize = u64(cd, q); q += 8; }
        if (localOffset === U32_MAX) { localOffset = u64(cd, q); }
      }
      e += 4 + len;
    }

    if (!name.endsWith('/')) entries.push({ name, method, compressedSize, size, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export async function readZipEntry(file: Blob, entry: ZipEntry): Promise<Uint8Array> {
  const head = await bytes(file, entry.localOffset, entry.localOffset + 30);
  if (head.getUint32(0, true) !== 0x04034b50) throw new Error(`Could not read ${entry.name} from the ZIP.`);
  const start = entry.localOffset + 30 + head.getUint16(26, true) + head.getUint16(28, true);
  const data = file.slice(start, start + entry.compressedSize);

  if (entry.method === 0) return new Uint8Array(await data.arrayBuffer());
  if (entry.method === 8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Your browser cannot open ZIP files. Unzip it first and choose the file inside.');
    const stream = data.stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  throw new Error(`${entry.name} uses an unsupported compression method.`);
}

export async function readZipText(file: Blob, entry: ZipEntry): Promise<string> {
  return new TextDecoder('utf-8').decode(await readZipEntry(file, entry));
}

export function isZip(file: File): boolean {
  return /\.zip$/i.test(file.name) || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
}
