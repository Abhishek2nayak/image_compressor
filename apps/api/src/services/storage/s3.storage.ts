import { IStorage } from './storage.interface';
import { env } from '../../config/env';

/**
 * S3 storage adapter — stubbed for future use.
 * Install @aws-sdk/client-s3 and implement when STORAGE_DRIVER=s3.
 */
export class S3Storage implements IStorage {
  async save(_sourcePath: string, _filename: string): Promise<string> {
    throw new Error('S3 storage not yet configured. Set STORAGE_DRIVER=local or implement S3 adapter.');
  }

  async getBuffer(_storagePath: string): Promise<Buffer> {
    throw new Error('S3 storage not yet configured.');
  }

  async delete(_storagePath: string): Promise<void> {
    throw new Error('S3 storage not yet configured.');
  }

  getUrl(storagePath: string): string {
    return `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${storagePath}`;
  }
}
