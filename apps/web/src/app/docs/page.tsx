import Link from 'next/link';

const endpoints = [
  {
    method: 'POST', path: '/api/v1/compress', auth: 'Optional',
    desc: 'Upload and compress a single image. Returns a jobId to poll for completion.',
    body: 'multipart/form-data: image (file), level (LOW|MEDIUM|HIGH)',
    response: '{ jobId: string, status: "PENDING" }',
  },
  {
    method: 'GET', path: '/api/v1/compress/:jobId', auth: 'None',
    desc: 'Poll compression job status and get result metadata.',
    response: '{ jobId, status, originalSize, compressedSize, savingsPercent }',
  },
  {
    method: 'GET', path: '/api/v1/compress/:jobId/download', auth: 'None',
    desc: 'Download the compressed image file.',
    response: 'Binary image file',
  },
  {
    method: 'POST', path: '/api/v1/compress/batch', auth: 'Optional',
    desc: 'Upload multiple images at once (max 20). Returns batchId + array of jobs.',
    body: 'multipart/form-data: images[] (files), level',
    response: '{ batchId, jobs: [...] }',
  },
  {
    method: 'GET', path: '/api/v1/compress/batch/:batchId/zip', auth: 'None',
    desc: 'Download all completed files in a batch as a single ZIP archive.',
    response: 'application/zip file',
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-yellow-100 text-yellow-700',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">ImagePress</Link>
          <Link href="/register" className="text-sm bg-primary text-primary-foreground rounded-md px-4 py-1.5 hover:opacity-90 transition-opacity">Get API key</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-3">API Documentation</h1>
        <p className="text-muted-foreground mb-10">Integrate image compression into your applications with our REST API.</p>

        {/* Auth section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="text-sm text-muted-foreground mb-4">Include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded">X-API-Key</code> header:</p>
          <pre className="bg-zinc-900 text-zinc-100 rounded-xl p-5 text-sm overflow-x-auto">
{`curl -X POST https://api.imagepress.io/api/v1/compress \\
  -H "X-API-Key: ic_your_api_key_here" \\
  -F "image=@photo.jpg" \\
  -F "level=MEDIUM"`}
          </pre>
          <p className="text-sm text-muted-foreground mt-3">
            Get your API key from <Link href="/api-keys" className="text-primary hover:underline">your dashboard</Link>.
            Free tier: 20 req/hr. Pro tier: 500 req/hr.
          </p>
        </section>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Base URL</h2>
          <pre className="bg-zinc-900 text-zinc-100 rounded-xl p-5 text-sm">
            https://api.imagepress.io
          </pre>
        </section>

        {/* Endpoints */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((ep) => (
              <div key={ep.path} className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${methodColors[ep.method] ?? 'bg-muted'}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono font-semibold">{ep.path}</code>
                  <span className={`text-xs ml-auto px-2 py-0.5 rounded-full ${ep.auth === 'None' ? 'bg-muted text-muted-foreground' : 'bg-yellow-100 text-yellow-700'}`}>
                    Auth: {ep.auth}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{ep.desc}</p>
                {ep.body && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Request body</span>
                    <pre className="bg-muted rounded-lg p-3 text-xs mt-1 overflow-x-auto">{ep.body}</pre>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Response</span>
                  <pre className="bg-muted rounded-lg p-3 text-xs mt-1 overflow-x-auto">{ep.response}</pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start example */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Quick Start (Node.js)</h2>
          <pre className="bg-zinc-900 text-zinc-100 rounded-xl p-5 text-sm overflow-x-auto">
{`import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

const form = new FormData();
form.append('image', fs.createReadStream('./photo.jpg'));
form.append('level', 'MEDIUM');

const res = await fetch('https://api.imagepress.io/api/v1/compress', {
  method: 'POST',
  headers: { 'X-API-Key': 'ic_your_key' },
  body: form,
});
const { data: { jobId } } = await res.json();

// Poll for completion
let job;
do {
  await new Promise(r => setTimeout(r, 1500));
  const poll = await fetch(\`https://api.imagepress.io/api/v1/compress/\${jobId}\`);
  job = (await poll.json()).data;
} while (job.status === 'PENDING' || job.status === 'PROCESSING');

console.log(\`Compressed! \${job.savingsPercent}% smaller\`);
console.log(\`Download: https://api.imagepress.io/api/v1/compress/\${jobId}/download\`);`}
          </pre>
        </section>

        {/* Rate limits */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Plan</th>
                  <th className="text-left px-5 py-3 font-medium">Web Uploads / Day</th>
                  <th className="text-left px-5 py-3 font-medium">API Requests / Hour</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="px-5 py-3">Free</td><td className="px-5 py-3">10</td><td className="px-5 py-3">20</td></tr>
                <tr><td className="px-5 py-3 font-medium text-primary">Pro</td><td className="px-5 py-3">500</td><td className="px-5 py-3">500</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
