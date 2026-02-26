import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export function qualityToLevel(quality: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (quality >= 70) return 'LOW';
  if (quality >= 40) return 'MEDIUM';
  return 'HIGH';
}

export async function compressImage(
  inputPath: string,
  mimeType: string,
  quality: number, // 1–100
): Promise<{ outputPath: string; compressedSize: number }> {
  const q = Math.max(1, Math.min(100, Math.round(quality)));
  const ext = path.extname(inputPath);
  const outputPath = inputPath.replace(ext, `_compressed${ext}`);

  // PNG compressionLevel is 0–9 (inverse of quality: 9 = most compressed)
  const pngCompression = Math.round((1 - q / 100) * 9);

  let pipeline = sharp(inputPath); // EXIF stripped by default

  switch (mimeType) {
    case 'image/jpeg':
      pipeline = pipeline.jpeg({ quality: q });
      break;
    case 'image/png':
      pipeline = pipeline.png({ compressionLevel: pngCompression });
      break;
    case 'image/webp':
      pipeline = pipeline.webp({ quality: q });
      break;
    case 'image/avif':
      pipeline = pipeline.avif({ quality: q });
      break;
    default:
      throw new Error('Unsupported MIME type: ' + mimeType);
  }

  await pipeline.toFile(outputPath);
  const stat = await fs.stat(outputPath);

  return { outputPath, compressedSize: stat.size };
}
