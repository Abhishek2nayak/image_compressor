import fs from 'fs/promises';
import path from 'path';
import { IStorage } from './storage.interface';
import { env } from '../../config/env';

export class LocalStorage implements IStorage {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.UPLOAD_DIR);
  }

  async save(sourcePath: string, filename: string): Promise<string> {
    const dest = path.join(this.baseDir, filename);
    await fs.copyFile(sourcePath, dest);
    return dest;
  }

  async getBuffer(storagePath: string): Promise<Buffer> {
    return fs.readFile(storagePath);
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
    } catch {
      // File may already be deleted
    }
  }

  getUrl(storagePath: string): string {
    const filename = path.basename(storagePath);
    return `/api/v1/compress/files/${filename}`;
  }
}
