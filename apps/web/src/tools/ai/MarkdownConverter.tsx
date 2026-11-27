'use client';

import { useMemo, useState } from 'react';
import { ClipboardPaste, FileCode2, FileText, Printer } from 'lucide-react';
import { Button, Label, Panel, Segmented, TextArea, TextInput } from '@/components/tool/ui';
import { downloadText } from '@/lib/tool-helpers';
import { MARKDOWN_CSS, markdownToHtml } from '@/lib/markdown';

const SAMPLE = `# Project update

**Status:** on track · *Updated today*

## Highlights
- Launched the new homepage
- Reduced load time by **40%**
- Fixed 12 bugs

## Next steps
1. Finish the mobile review
2. Ship the invoice tool

| Task | Owner | Due |
|------|-------|-----|
| Mobile QA | Priya | Friday |
| Docs | Arjun | Monday |

> Tip: paste any ChatGPT or Claude answer here.`;

function documentHtml(body: string, title: string) {
  const safeTitle = title.replace(/[<>&"]/g, '');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title>
<style>${MARKDOWN_CSS}
body{margin:0;padding:32px;background:#fff}@page{margin:18mm}@media print{body{padding:0}}
.md{max-width:760px;margin:0 auto}</style></head><body><div class="md">${body}</div></body></html>`;
}

export default function MarkdownConverter() {
  const [md, setMd] = useState('');
  const [title, setTitle] = useState('Document');
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => markdownToHtml(md), [md]);
  const fileBase = title.trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-') || 'document';

  function printPdf() {
    const doc = documentHtml(html, title);
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch) {
      // Mobile browsers print new tabs more reliably than hidden frames.
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(doc.replace('</body>', '<script>setTimeout(function(){print()},300)<\/script></body>'));
      w.document.close();
      return;
    }
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const d = frame.contentDocument!;
    d.open(); d.write(doc); d.close();
    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    }, 250);
  }

  function downloadWord() {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title.replace(/[<>&"]/g, '')}</title><style>${MARKDOWN_CSS}</style></head><body><div class="md">${html}</div></body></html>`;
    downloadText(`${fileBase}.doc`, '﻿' + doc, 'application/msword');
  }

  async function copyFormatted() {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([`<div>${html}</div>`], { type: 'text/html' }),
        'text/plain': new Blob([md], { type: 'text/plain' }),
      })]);
    } catch { await navigator.clipboard.writeText(md); }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const preview = (
    <div className="rounded-xl border border-slate-200 bg-[#fff] p-5 sm:p-8 min-h-[320px] overflow-x-auto">
      <style>{MARKDOWN_CSS}</style>
      {md.trim()
        ? <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
        : <p className="text-sm text-[#7c756f]">Your formatted document appears here.</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <Panel className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="title">File name</Label>
            <TextInput id="title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={printPdf} disabled={!md.trim()}><Printer className="w-4 h-4" />PDF</Button>
            <Button variant="secondary" onClick={downloadWord} disabled={!md.trim()}><FileText className="w-4 h-4" />Word</Button>
            <Button variant="secondary" onClick={copyFormatted} disabled={!md.trim()}>{copied ? 'Copied' : 'Copy formatted'}</Button>
            <Button variant="ghost" onClick={() => downloadText(`${fileBase}.html`, documentHtml(html, title), 'text/html')} disabled={!md.trim()}><FileCode2 className="w-4 h-4" />HTML</Button>
          </div>
        </div>
        <p className="text-xs text-slate-500">PDF opens your browser’s print dialog — choose <strong>Save as PDF</strong>. Word downloads a .doc file that opens in Word and Google Docs.</p>
      </Panel>

      {/* Phones: switch between writing and preview. Desktop: side by side. */}
      <Segmented className="lg:hidden" value={view} onChange={setView} options={[{ value: 'write', label: 'Markdown' }, { value: 'preview', label: 'Preview' }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel className={view === 'preview' ? 'hidden lg:block' : ''}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Label htmlFor="md" className="mb-0">Markdown</Label>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={async () => { try { setMd(await navigator.clipboard.readText()); } catch { /* manual paste */ } }}><ClipboardPaste className="w-4 h-4" />Paste</Button>
              {!md && <Button variant="ghost" onClick={() => setMd(SAMPLE)}>Example</Button>}
            </div>
          </div>
          <TextArea id="md" rows={18} mono value={md} onChange={e => setMd(e.target.value)} placeholder={'# Heading\n\nPaste Markdown or an AI answer…'} />
        </Panel>
        <div className={view === 'write' ? 'hidden lg:block' : ''}>{preview}</div>
      </div>
    </div>
  );
}
