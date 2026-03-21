import multer from 'multer';
import { RequestHandler } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { env } from '../config/env';
import { AppError } from './error.middleware';

const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100 MB

function ensureUploadDir() {
  const dir = env.UPLOAD_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureUploadDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadPdf: RequestHandler = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF files are supported', 400, 'INVALID_FILE_TYPE'));
    }
  },
  limits: { fileSize: MAX_PDF_SIZE },
}).single('file');
