import { IStorage } from '../services/storage/storage.interface';
import { LocalStorage } from '../services/storage/local.storage';
import { S3Storage } from '../services/storage/s3.storage';
import { SupabaseStorage } from '../services/storage/supabase.storage';
import { env } from './env';

let _storage: IStorage | null = null;

export function getStorage(): IStorage {
  if (!_storage) {
    if (env.STORAGE_DRIVER === 's3') _storage = new S3Storage();
    else if (env.STORAGE_DRIVER === 'supabase') _storage = new SupabaseStorage();
    else _storage = new LocalStorage();
  }
  return _storage;
}
