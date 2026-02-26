import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { IStorage } from './storage.interface';
import { env } from '../../config/env';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', avif: 'image/avif',
};

function client() {
  return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export class SupabaseStorage implements IStorage {
  private bucket: string;

  constructor() {
    this.bucket = env.SUPABASE_STORAGE_BUCKET ?? 'compressed-images';
  }

  async save(sourcePath: string, filename: string): Promise<string> {
    const buffer = await fs.readFile(sourcePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = MIME[ext] ?? 'application/octet-stream';

    const { error } = await client()
      .storage.from(this.bucket)
      .upload(filename, buffer, { contentType, upsert: true });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return filename; // storage key stored in DB
  }

  async getBuffer(storagePath: string): Promise<Buffer> {
    const { data, error } = await client()
      .storage.from(this.bucket)
      .download(storagePath);

    if (error || !data) throw new Error(`Supabase download failed: ${error?.message}`);
    return Buffer.from(await (data as Blob).arrayBuffer());
  }

  async delete(storagePath: string): Promise<void> {
    await client().storage.from(this.bucket).remove([storagePath]);
  }

  getUrl(storagePath: string): string {
    const { data } = client().storage.from(this.bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }
}
