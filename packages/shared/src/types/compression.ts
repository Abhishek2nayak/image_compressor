export type CompressionLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface CompressionJob {
  id: string;
  status: JobStatus;
  originalName: string;
  originalSize: number;
  compressedSize?: number;
  mimeType: string;
  level: CompressionLevel;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

export interface CompressionResult {
  jobId: string;
  originalSize: number;
  compressedSize: number;
  savingsBytes: number;
  savingsPercent: number;
  downloadUrl: string;
  previewUrl: string;
}

export interface BatchCompressionResult {
  batchId: string;
  jobs: CompressionJob[];
  zipUrl: string;
}
