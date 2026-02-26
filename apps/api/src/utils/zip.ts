import archiver from 'archiver';
import { Response } from 'express';
import path from 'path';

export function streamZipToResponse(
  res: Response,
  files: Array<{ filePath: string; archiveName: string }>,
  zipFilename: string,
) {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => { throw err; });
  archive.pipe(res);

  for (const { filePath, archiveName } of files) {
    archive.file(filePath, { name: archiveName });
  }

  archive.finalize();
}
