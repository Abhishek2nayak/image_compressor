'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { BarChart3, ImageIcon, TrendingDown, Zap } from 'lucide-react';

interface UsageData {
  dailyUploads: number;
  dailyLimit: number;
  totalJobs: number;
  totalBytesSaved: number;
  resetAt: string;
}

interface HistoryItem {
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  level: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: usage } = useQuery<UsageData>({
    queryKey: ['usage'],
    queryFn: () => api.get('/api/v1/user/usage').then((r) => r.data.data),
  });

  const { data: historyData } = useQuery<{ items: HistoryItem[]; total: number }>({
    queryKey: ['history'],
    queryFn: () => api.get('/api/v1/compress/history').then((r) => r.data.data),
  });

  const quotaPercent = usage
    ? usage.dailyLimit === -1 ? 0 : Math.round((usage.dailyUploads / usage.dailyLimit) * 100)
    : 0;

  const stats = [
    { label: 'Total compressions', value: usage?.totalJobs ?? 0, icon: ImageIcon },
    { label: 'Bytes saved', value: formatBytes(usage?.totalBytesSaved ?? 0), icon: TrendingDown },
    { label: 'Used today', value: `${usage?.dailyUploads ?? 0} / ${usage?.dailyLimit === -1 ? '∞' : usage?.dailyLimit ?? 10}`, icon: Zap },
    { label: 'Quota used', value: `${quotaPercent}%`, icon: BarChart3 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
              <Icon className="w-4 h-4" /> {label}
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Quota bar */}
      {usage && usage.dailyLimit !== -1 && (
        <div className="bg-white rounded-xl border p-5 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Daily upload quota</span>
            <span className="text-muted-foreground">{usage.dailyUploads} / {usage.dailyLimit}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quotaPercent > 80 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, quotaPercent)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Resets at midnight UTC
          </p>
        </div>
      )}

      {/* History table */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="font-semibold">Recent compressions</h2>
        </div>
        {!historyData?.items.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No compressions yet. <a href="/compress" className="text-primary hover:underline">Upload your first image →</a></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">File</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Original</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Compressed</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Savings</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Level</th>
                </tr>
              </thead>
              <tbody>
                {historyData.items.map((item) => {
                  const savings = item.compressedSize
                    ? Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100)
                    : null;
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium truncate max-w-[200px]">{item.originalName}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{formatBytes(item.originalSize)}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {item.compressedSize ? formatBytes(item.compressedSize) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {savings !== null ? (
                          <span className="text-green-600 font-medium">{savings}%</span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-muted rounded px-2 py-0.5">{item.level}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
