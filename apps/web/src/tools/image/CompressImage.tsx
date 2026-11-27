"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Loader2,
  X,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

type FileStatus = "queued" | "processing" | "done" | "failed";

interface FileResult {
  id: string;
  file: File;
  status: FileStatus;
  blob?: Blob;
  compressedSize?: number;
  error?: string;
}

function outputFileName(original: File, mime: string): string {
  const ext =
    mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const base = original.name.replace(/\.[^.]+$/, "");
  return `${base}-compressed.${ext}`;
}

async function compressFile(
  file: File,
  quality: number,
): Promise<{ blob: Blob; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const srcUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(srcUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0);
      const mime =
        file.type === "image/png"
          ? "image/png"
          : file.type === "image/webp"
            ? "image/webp"
            : "image/jpeg";
      const q = mime === "image/png" ? undefined : quality / 100;
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve({ blob, compressedSize: blob.size })
            : reject(new Error("Compression failed")),
        mime,
        q,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(srcUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = srcUrl;
  });
}

export default function CompressImagePage() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: FileResult[] = accepted.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      status: "queued" as FileStatus,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: 50 * 1024 * 1024,
    noClick: true,
    onDropRejected: () =>
      toast.error("Only JPEG, PNG and WebP are supported (max 50 MB each)"),
  });

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleCompress() {
    if (!files.length || processing) return;
    setProcessing(true);
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: "queued",
        blob: undefined,
        compressedSize: undefined,
      })),
    );

    for (const item of files) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "processing" } : f,
        ),
      );
      try {
        const { blob, compressedSize } = await compressFile(item.file, quality);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "done", blob, compressedSize }
              : f,
          ),
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "failed",
                  error: err instanceof Error ? err.message : "Failed",
                }
              : f,
          ),
        );
      }
    }
    setProcessing(false);
  }

  function downloadFile(item: FileResult) {
    if (!item.blob) return;
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputFileName(item.file, item.blob.type);
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    files.filter((f) => f.status === "done").forEach(downloadFile);
  }

  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div>

      <div className="max-w-3xl">

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6",
            isDragActive
              ? "border-brand-400 bg-brand-50"
              : "border-slate-200 bg-white hover:border-brand-300",
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              "w-10 h-10 mx-auto mb-3",
              isDragActive ? "text-brand-500" : "text-slate-300",
            )}
          />
          <p className="text-sm text-slate-500 mb-3">
            {isDragActive
              ? "Drop your images here"
              : "Drag & drop images, or click to select"}
          </p>
          <input
            id="ci-pick"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              if (picked.length) onDrop(picked);
              e.currentTarget.value = '';
            }}
          />
          <label
            htmlFor="ci-pick"
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-8 py-3 font-bold text-sm shadow-md cursor-pointer inline-block"
          >
            Select Images
          </label>
          <p className="text-xs text-slate-400 mt-3">
            JPEG · PNG · WebP · Max 50 MB each
          </p>
        </div>

        {files.length > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700">
                  Quality: {quality}%
                </span>
                {quality < 50 && (
                  <span className="text-xs text-amber-500 font-medium">
                    Low quality
                  </span>
                )}
                {quality >= 85 && (
                  <span className="text-xs text-green-600 font-medium">
                    High quality
                  </span>
                )}
              </div>
              <input
                type="range"
                min={10}
                max={95}
                step={5}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={processing}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatBytes(item.file.size)}</span>
                      {item.status === "done" && item.compressedSize && (
                        <>
                          <span>→</span>
                          <span className="text-green-600 font-medium">
                            {formatBytes(item.compressedSize)}
                          </span>
                          <span className="text-green-600">
                            (
                            {Math.round(
                              (1 - item.compressedSize / item.file.size) * 100,
                            )}
                            % smaller)
                          </span>
                        </>
                      )}
                      {item.status === "failed" && (
                        <span className="text-red-500">{item.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "processing" && (
                      <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    )}
                    {item.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === "failed" && (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    {item.status === "done" && (
                      <button
                        onClick={() => downloadFile(item)}
                        className="text-xs bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!processing && (
                      <button
                        onClick={() => removeFile(item.id)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCompress}
                disabled={processing}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Compressing…
                  </>
                ) : (
                  "Compress Images"
                )}
              </button>
              {doneCount > 1 && (
                <button
                  onClick={downloadAll}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-5 font-bold text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> All
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
              100% in-browser · Files never uploaded to any server
            </p>
          </>
        )}
      </div>
    </div>
  );
}
