'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Checkbox, CopyButton, NumberField, Panel, Segmented, TextArea } from '@/components/tool/ui';

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nunc vestibulum ante primis faucibus orci luctus ultrices posuere cubilia curae mauris viverra massa vitae tortor condimentum lacinia quam pellentesque habitant morbi tristique senectus netus malesuada fames turpis egestas integer feugiat scelerisque varius aenean'.split(' ');
const OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';

type Unit = 'paragraphs' | 'sentences' | 'words';
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];

function sentence() {
  const n = rand(6, 14);
  const words = Array.from({ length: n }, pick);
  if (n > 8) words[rand(3, n - 4)] += ',';
  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}
const paragraph = () => Array.from({ length: rand(4, 7) }, sentence).join(' ');

function generate(unit: Unit, count: number, startLorem: boolean, html: boolean) {
  let parts: string[];
  if (unit === 'words') {
    const words = Array.from({ length: count }, pick);
    if (startLorem) OPENING.toLowerCase().replace(',', '').split(' ').slice(0, count).forEach((w, i) => (words[i] = w));
    const s = words.join(' ');
    parts = [s.charAt(0).toUpperCase() + s.slice(1) + '.'];
  } else if (unit === 'sentences') {
    const s = Array.from({ length: count }, sentence);
    if (startLorem) s[0] = OPENING + '.';
    parts = [s.join(' ')];
  } else {
    parts = Array.from({ length: count }, paragraph);
    if (startLorem) parts[0] = OPENING + ', ' + parts[0].charAt(0).toLowerCase() + parts[0].slice(1);
  }
  return html ? parts.map(p => `<p>${p}</p>`).join('\n') : parts.join('\n\n');
}

export default function LoremIpsum() {
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState('3');
  const [startLorem, setStartLorem] = useState(true);
  const [html, setHtml] = useState(false);
  const [output, setOutput] = useState('');

  const n = Math.min(unit === 'words' ? 5000 : unit === 'sentences' ? 500 : 100, Math.max(1, Math.floor(Number(count)) || 1));
  const regenerate = useCallback(() => setOutput(generate(unit, n, startLorem, html)), [unit, n, startLorem, html]);
  // Random text is generated on the client only (avoids hydration mismatches).
  useEffect(regenerate, [regenerate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <Panel className="space-y-5 h-fit">
        <Segmented size="sm" value={unit} onChange={setUnit} options={[
          { value: 'paragraphs', label: 'Paragraphs' }, { value: 'sentences', label: 'Sentences' }, { value: 'words', label: 'Words' },
        ]} />
        <NumberField id="count" label={`Number of ${unit}`} value={count} onChange={setCount} min={1} step={1} />
        <div className="space-y-2">
          <Checkbox checked={startLorem} onChange={setStartLorem} label="Start with “Lorem ipsum…”" />
          <Checkbox checked={html} onChange={setHtml} label="Wrap in <p> tags" />
        </div>
        <Button variant="secondary" onClick={regenerate} className="w-full"><RefreshCw className="w-4 h-4" /> Regenerate</Button>
      </Panel>
      <div>
        <div className="flex justify-end mb-2"><CopyButton text={output} variant="primary" /></div>
        <TextArea rows={18} value={output} readOnly aria-label="Generated text" className={html ? 'font-mono text-[13px]' : ''} />
      </div>
    </div>
  );
}
