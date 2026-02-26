import multer from 'multer';
import { RequestHandler } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { env } from '../config/env';
import { AppError } from './error.middleware';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function ensureUploadDir() {
  const dir = env.UPLOAD_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureUploadDir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WebP, AVIF`, 400, 'INVALID_FILE_TYPE'));
  }
}

export const uploadSingle: RequestHandler = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

export const uploadBatch: RequestHandler = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 20 },
}).array('images', 20);
