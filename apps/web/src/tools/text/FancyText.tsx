'use client';

import { useMemo, useState } from 'react';
import { CopyButton, Panel, TextInput } from '@/components/tool/ui';

type Style = { name: string; fn: (s: string) => string };

/** Map A–Z / a–z / 0–9 into a Unicode block, with per-letter exceptions
 *  for characters that live in the Letterlike Symbols block. */
function alpha(upper: number, lower: number, digit: number | null, exceptions: Record<string, number> = {}) {
  return (s: string) =>
    Array.from(s).map(ch => {
      if (exceptions[ch]) return String.fromCodePoint(exceptions[ch]);
      const c = ch.codePointAt(0)!;
      if (c >= 65 && c <= 90) return String.fromCodePoint(upper + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(lower + c - 97);
      if (digit !== null && c >= 48 && c <= 57) return String.fromCodePoint(digit + c - 48);
      return ch;
    }).join('');
}

const SMALL_CAPS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ';
const UPSIDE: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
  '.': '˙', ',': "'", '?': '¿', '!': '¡', "'": ',', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '_': '‾',
  '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0',
};
const combine = (mark: string) => (s: string) => Array.from(s).map(c => (c.trim() ? c + mark : c)).join('');

const STYLES: Style[] = [
  { name: 'Bold', fn: alpha(0x1d400, 0x1d41a, 0x1d7ce) },
  { name: 'Italic', fn: alpha(0x1d434, 0x1d44e, null, { h: 0x210e }) },
  { name: 'Bold italic', fn: alpha(0x1d468, 0x1d482, null) },
  { name: 'Bold sans', fn: alpha(0x1d5d4, 0x1d5ee, 0x1d7ec) },
  { name: 'Italic sans', fn: alpha(0x1d608, 0x1d622, null) },
  { name: 'Script', fn: alpha(0x1d49c, 0x1d4b6, null, { B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b, e: 0x212f, g: 0x210a, o: 0x2134 }) },
  { name: 'Bold script', fn: alpha(0x1d4d0, 0x1d4ea, null) },
  { name: 'Gothic', fn: alpha(0x1d504, 0x1d51e, null, { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 }) },
  { name: 'Bold gothic', fn: alpha(0x1d56c, 0x1d586, null) },
  { name: 'Double-struck', fn: alpha(0x1d538, 0x1d552, 0x1d7d8, { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 }) },
  { name: 'Monospace', fn: alpha(0x1d670, 0x1d68a, 0x1d7f6) },
  { name: 'Bubble', fn: alpha(0x24b6, 0x24d0, null, { '0': 0x24ea, '1': 0x2460, '2': 0x2461, '3': 0x2462, '4': 0x2463, '5': 0x2464, '6': 0x2465, '7': 0x2466, '8': 0x2467, '9': 0x2468 }) },
  { name: 'Squared', fn: s => alpha(0x1f130, 0x1f130, null)(s.toUpperCase()) },
  { name: 'Black squared', fn: s => alpha(0x1f170, 0x1f170, null)(s.toUpperCase()) },
  { name: 'Fullwidth', fn: s => Array.from(s).map(c => { const n = c.codePointAt(0)!; return n >= 33 && n <= 126 ? String.fromCodePoint(n + 0xfee0) : c === ' ' ? '　' : c; }).join('') },
  { name: 'Small caps', fn: s => Array.from(s.toLowerCase()).map(c => { const n = c.charCodeAt(0) - 97; return n >= 0 && n < 26 ? SMALL_CAPS[n] : c; }).join('') },
  { name: 'Upside down', fn: s => Array.from(s.toLowerCase()).reverse().map(c => UPSIDE[c] ?? c).join('') },
  { name: 'Strikethrough', fn: combine('̶') },
  { name: 'Underline', fn: combine('̲') },
];

export default function FancyText() {
  const [text, setText] = useState('Hello World');
  const outputs = useMemo(() => STYLES.map(s => ({ name: s.name, value: s.fn(text) })), [text]);

  return (
    <div className="space-y-4">
      <TextInput value={text} onChange={e => setText(e.target.value)} placeholder="Type something…" aria-label="Your text" className="text-lg py-3.5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {outputs.map(o => (
          <Panel key={o.name} className="p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-400 mb-0.5">{o.name}</div>
              <div className="text-lg text-slate-900 truncate">{o.value || ' '}</div>
            </div>
            <CopyButton text={o.value} label="" className="px-2.5" />
          </Panel>
        ))}
      </div>
    </div>
  );
}
