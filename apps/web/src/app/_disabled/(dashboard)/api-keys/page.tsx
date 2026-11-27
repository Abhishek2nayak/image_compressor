'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { ApiKey } from '@image-compressor/shared';

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data: keys = [] } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api/v1/api-keys').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/v1/api-keys', { name }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(res.data.data.key);
      setNewKeyName('');
      toast.success('API key created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('Key revoked'); },
    onError: (err: Error) => toast.error(err.message),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">API Keys</h1>
      <p className="text-muted-foreground text-sm mb-6">Authenticate API requests with <code className="bg-muted px-1 rounded">X-API-Key: your_key</code></p>

      {/* New key created banner */}
      {createdKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-800 mb-1">Save your API key now — it won't be shown again</p>
              <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
                <code className="text-sm font-mono flex-1 truncate">{createdKey}</code>
                <button onClick={() => copyToClipboard(createdKey)} className="shrink-0">
                  <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => setCreatedKey(null)} className="text-xs text-green-700 mt-2 hover:underline">I've saved it, dismiss</button>
        </div>
      )}

      {/* Create new key */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="font-semibold mb-3">Create new API key</h2>
        <div className="flex gap-3">
          <input
            type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. Production)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => newKeyName.trim() && createMutation.mutate(newKeyName.trim())}
            disabled={!newKeyName.trim() || createMutation.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Create key
          </button>
        </div>
      </div>

      {/* Keys list */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="font-semibold">Your API keys</h2>
        </div>
        {keys.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {keys.map((key) => (
              <div key={key.id} className="p-5 flex items-center gap-4">
                <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{key.prefix}••••••••</p>
                  {key.lastUsedAt && (
                    <p className="text-xs text-muted-foreground">Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${key.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {key.isActive ? 'Active' : 'Revoked'}
                  </span>
                  <span className="text-xs text-muted-foreground">{key.rateLimit} req/hr</span>
                  {key.isActive && (
                    <button
                      onClick={() => revokeMutation.mutate(key.id)}
                      className="text-destructive hover:opacity-70 transition-opacity"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
