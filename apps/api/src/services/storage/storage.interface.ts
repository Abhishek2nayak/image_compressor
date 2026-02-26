export interface IStorage {
  save(filePath: string, filename: string): Promise<string>;
  getBuffer(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): string;
}
