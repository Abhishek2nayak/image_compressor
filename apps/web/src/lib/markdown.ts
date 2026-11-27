/**
 * Small, dependency-free Markdown → HTML / plain-text converter covering what
 * chat assistants (ChatGPT, Claude, Gemini) actually output: headings, bold,
 * italic, strikethrough, inline code, fenced code, quotes, nested lists,
 * task lists, tables, links, images and rules.
 *
 * Output HTML is safe to inject: all text is escaped and only http(s)/mailto
 * links and http(s)/data:image sources are kept.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function safeUrl(url: string, image = false): string | null {
  const u = url.trim().replace(/^<|>$/g, '');
  if (/^(https?:|mailto:)/i.test(u) || /^[#/.]/.test(u)) return u;
  if (image && /^data:image\/(png|jpe?g|gif|webp);/i.test(u)) return u;
  return null;
}

/** Inline formatting. Code spans are protected first so their contents stay literal. */
function inline(text: string): string {
  const codes: string[] = [];
  let s = text.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, alt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'), true);
    return u ? `<img src="${esc(u)}" alt="${alt}">` : alt;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, label, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    return u ? `<a href="${esc(u)}">${label}</a>` : label;
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, pre, url) => `${pre}<a href="${url}">${url}</a>`);
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (m, a, b) => `<strong>${a ?? b}</strong>`);
  s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_\w])_(?!\s)(.+?)(?<!\s)_(?![_\w])/g, '$1<em>$2</em>');
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
}

interface ListItem { text: string[]; children: Block[]; task?: boolean; done?: boolean }
type Block =
  | { t: 'h'; level: number; text: string }
  | { t: 'p'; text: string }
  | { t: 'code'; lang: string; text: string }
  | { t: 'quote'; blocks: Block[] }
  | { t: 'list'; ordered: boolean; start: number; items: ListItem[] }
  | { t: 'hr' }
  | { t: 'table'; head: string[]; align: ('left' | 'center' | 'right' | '')[]; rows: string[][] };

const LIST_RE = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const splitRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));

function parse(lines: string[]): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = /^\s*(```|~~~)\s*([\w+-]*)/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      out.push({ t: 'code', lang: fence[2], text: body.join('\n') });
      continue;
    }
    const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) { out.push({ t: 'h', level: h[1].length, text: h[2] }); i++; continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push({ t: 'hr' }); i++; continue; }
    if (/^\s{0,3}>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) body.push(lines[i++].replace(/^\s{0,3}>\s?/, ''));
      out.push({ t: 'quote', blocks: parse(body) });
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map(c => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : '')) as ('left' | 'center' | 'right' | '')[];
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      out.push({ t: 'table', head, align, rows });
      continue;
    }
    const li = LIST_RE.exec(line);
    if (li) {
      const baseIndent = li[1].length;
      const ordered = /\d/.test(li[2]);
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = LIST_RE.exec(lines[i]);
        if (m && m[1].length <= baseIndent + 1 && /\d/.test(m[2]) === ordered) {
          const task = /^\[([ xX])\]\s+(.*)$/.exec(m[3]);
          items.push({ text: [task ? task[2] : m[3]], children: [], task: !!task, done: task ? task[1] !== ' ' : undefined });
          i++;
          // Continuation lines and nested content (indented deeper than the marker).
          const nested: string[] = [];
          while (i < lines.length) {
            const l = lines[i];
            if (!l.trim()) {
              const next = lines[i + 1];
              if (next && /^\s+/.test(next) && (next.match(/^\s*/)![0].length > baseIndent)) { nested.push(''); i++; continue; }
              break;
            }
            const indent = l.match(/^\s*/)![0].length;
            if (indent > baseIndent) { nested.push(l.slice(Math.min(indent, baseIndent + 2))); i++; continue; }
            if (!LIST_RE.test(l) && !/^\s*(#|>|```|~~~)/.test(l) && nested.length === 0) { items[items.length - 1].text.push(l.trim()); i++; continue; }
            break;
          }
          if (nested.length) {
            const blocks = parse(nested);
            const cur = items[items.length - 1];
            // Leading plain paragraph lines are part of the item text.
            if (blocks[0]?.t === 'p' && !LIST_RE.test(nested[0])) { cur.text.push((blocks.shift() as { text: string }).text); }
            cur.children.push(...blocks);
          }
        } else break;
      }
      out.push({ t: 'list', ordered, start: ordered ? parseInt(li[2], 10) || 1 : 1, items });
      continue;
    }
    // Paragraph: until blank line or another block starts.
    const para: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !/^\s{0,3}(#{1,6}\s|>|```|~~~)/.test(lines[i]) && !LIST_RE.test(lines[i]) && !/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    out.push({ t: 'p', text: para.join('\n') });
  }
  return out;
}

function toHtml(blocks: Block[]): string {
  return blocks.map(b => {
    switch (b.t) {
      case 'h': return `<h${b.level}>${inline(b.text)}</h${b.level}>`;
      case 'p': return `<p>${inline(b.text).replace(/ {2,}\n|\\\n/g, '<br>').replace(/\n/g, ' ')}</p>`;
      case 'code': return `<pre><code${b.lang ? ` class="language-${esc(b.lang)}"` : ''}>${esc(b.text)}</code></pre>`;
      case 'quote': return `<blockquote>${toHtml(b.blocks)}</blockquote>`;
      case 'hr': return '<hr>';
      case 'list': {
        const tag = b.ordered ? 'ol' : 'ul';
        const start = b.ordered && b.start !== 1 ? ` start="${b.start}"` : '';
        return `<${tag}${start}>${b.items.map(it => `<li>${it.task ? `<input type="checkbox" disabled${it.done ? ' checked' : ''}> ` : ''}${inline(it.text.join(' '))}${toHtml(it.children)}</li>`).join('')}</${tag}>`;
      }
      case 'table': {
        const al = (i: number) => (b.align[i] ? ` style="text-align:${b.align[i]}"` : '');
        return `<table><thead><tr>${b.head.map((c, i) => `<th${al(i)}>${inline(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${b.head.map((_, i) => `<td${al(i)}>${inline(r[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      }
    }
  }).join('\n');
}

export function markdownToHtml(md: string): string {
  return toHtml(parse(md.replace(/\r\n?/g, '\n').split('\n')));
}

// ── Plain text ─────────────────────────────────────────────────────────────

export interface PlainOptions {
  /** Bullet character for unordered lists ('' keeps none). */
  bullet?: string;
  /** Keep link URLs in brackets after the text. */
  keepUrls?: boolean;
  /** UPPERCASE headings so they still stand out. */
  upperHeadings?: boolean;
}

function inlinePlain(s: string, o: PlainOptions): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (m, t, u) => (o.keepUrls && t !== u ? `${t} (${u})` : t))
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, (m, a, b) => a ?? b)
    .replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_\w])_(?!\s)(.+?)(?<!\s)_(?![_\w])/g, '$1$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1');
}

function toPlain(blocks: Block[], o: PlainOptions, depth = 0): string {
  const pad = '  '.repeat(depth);
  return blocks.map(b => {
    switch (b.t) {
      case 'h': { const t = inlinePlain(b.text, o); return o.upperHeadings ? t.toUpperCase() : t; }
      case 'p': return inlinePlain(b.text, o).replace(/\\\n/g, '\n');
      case 'code': return b.text;
      case 'quote': return toPlain(b.blocks, o, depth);
      case 'hr': return '';
      case 'list': return b.items.map((it, n) => {
        const mark = b.ordered ? `${b.start + n}. ` : it.task ? (it.done ? '☑ ' : '☐ ') : o.bullet ? `${o.bullet} ` : '';
        const kids = it.children.length ? '\n' + toPlain(it.children, o, depth + 1) : '';
        return `${pad}${mark}${inlinePlain(it.text.join(' '), o)}${kids}`;
      }).join('\n');
      case 'table': return [b.head, ...b.rows].map(r => r.map(c => inlinePlain(c, o)).join('\t')).join('\n');
    }
  }).filter((s, i, a) => !(s === '' && a[i - 1] === '')).join('\n\n');
}

export function markdownToPlain(md: string, o: PlainOptions = {}): string {
  return toPlain(parse(md.replace(/\r\n?/g, '\n').split('\n')), { bullet: '•', ...o }).replace(/\n{3,}/g, '\n\n').trim();
}

/** Styles for rendered Markdown (preview, PDF print and Word export). */
export const MARKDOWN_CSS = `
.md{font:15px/1.65 Georgia,'Times New Roman',serif;color:#1a1715;word-wrap:break-word}
.md h1,.md h2,.md h3,.md h4{font-family:Arial,Helvetica,sans-serif;line-height:1.25;margin:1.4em 0 .5em;color:#1a1715}
.md h1{font-size:1.9em}.md h2{font-size:1.5em}.md h3{font-size:1.2em}.md h4{font-size:1.05em}
.md>:first-child{margin-top:0}
.md p,.md ul,.md ol,.md blockquote,.md pre,.md table{margin:0 0 1em}
.md ul,.md ol{padding-left:1.6em}.md li{margin:.25em 0}.md li>ul,.md li>ol{margin:.25em 0}
.md a{color:#ad380b}
.md code{font:0.88em Consolas,Menlo,monospace;background:#f4f3f1;padding:.1em .35em;border-radius:4px}
.md pre{background:#f4f3f1;padding:12px 14px;border-radius:8px;overflow:auto;white-space:pre-wrap}
.md pre code{background:none;padding:0}
.md blockquote{border-left:3px solid #d5d2ce;padding-left:1em;color:#4d4743}
.md hr{border:0;border-top:1px solid #d5d2ce;margin:1.6em 0}
.md table{border-collapse:collapse;width:100%;font-size:.95em}
.md th,.md td{border:1px solid #d5d2ce;padding:6px 10px;text-align:left;vertical-align:top}
.md th{background:#f4f3f1;font-family:Arial,Helvetica,sans-serif}
.md img{max-width:100%}
`;
