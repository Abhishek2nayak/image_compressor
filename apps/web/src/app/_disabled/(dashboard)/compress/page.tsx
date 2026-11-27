'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, X, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import api from '@/lib/api';

type Level = 'LOW' | 'MEDIUM' | 'HIGH';

interface JobResult {
  jobId: string;
  fileName: string;
  originalSize: number;
  status: 'pending' | 'done' | 'failed';
  compressedSize?: number;
  savingsPercent?: number;
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export default function CompressPage() {
  const [level, setLevel] = useState<Level>('MEDIUM');
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [uploading, setUploading] = useState(false);

  function updateJob(jobId: string, patch: Partial<JobResult>) {
    setJobs((prev) => prev.map((j) => (j.jobId === jobId ? { ...j, ...patch } : j)));
  }

  async function pollJob(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/compress/${jobId}`);
        const data = res.data.data as { status: string; compressedSize?: number; savingsPercent?: number };
        if (data.status === 'DONE') {
          clearInterval(interval);
          updateJob(jobId, { status: 'done', compressedSize: data.compressedSize, savingsPercent: data.savingsPercent });
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          updateJob(jobId, { status: 'failed' });
          toast.error('Compression failed');
        }
      } catch {
        clearInterval(interval);
        updateJob(jobId, { status: 'failed' });
      }
    }, 1500);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setUploading(true);

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('level', level);

      try {
        const res = await api.post('/api/v1/compress', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const { jobId } = res.data.data as { jobId: string };
        const newJob: JobResult = { jobId, fileName: file.name, originalSize: file.size, status: 'pending' };
        setJobs((prev) => [newJob, ...prev]);
        pollJob(jobId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setUploading(false);
  }, [level]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] },
    maxSize: 25 * 1024 * 1024,
    onDropRejected: (files) => {
      toast.error(files[0]?.errors[0]?.message ?? 'File rejected');
    },
  });

  function downloadFile(jobId: string, fileName: string) {
    const link = document.createElement('a');
    link.href = `${API_URL}/api/v1/compress/${jobId}/download`;
    link.download = fileName;
    link.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Compress Images</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Level:</span>
          {(['LOW', 'MEDIUM', 'HIGH'] as Level[]).map((l) => (
            <button
              key={l} onClick={() => setLevel(l)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors',
                level === l ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors mb-6',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30',
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
        <p className="font-medium text-lg mb-1">
          {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
        </p>
        <p className="text-sm text-muted-foreground">or click to browse • JPG, PNG, WebP, AVIF • Max 25MB per file</p>
        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        )}
      </div>

      {/* Results */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.jobId} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{job.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(job.originalSize)}
                  {job.compressedSize && ` → ${formatBytes(job.compressedSize)}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {job.status === 'pending' && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </div>
                )}
                {job.status === 'done' && (
                  <>
                    <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {job.savingsPercent}% smaller
                    </div>
                    <button
                      onClick={() => downloadFile(job.jobId, job.fileName)}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </>
                )}
                {job.status === 'failed' && (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" /> Failed
                  </div>
                )}
                <button onClick={() => setJobs((prev) => prev.filter((j) => j.jobId !== job.jobId))}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
