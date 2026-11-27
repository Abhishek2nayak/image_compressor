'use client';

import { useMemo, useState } from 'react';
import { Label, NumberField, Panel, Segmented, Stat, TextArea } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';

/**
 * Token estimate modelled on BPE tokenizers (GPT/Claude/Gemini style):
 * split like a pre-tokenizer, then charge each piece by script and length.
 * Typically within ~10% of real counts for English prose.
 */
const PIECE = /'(?:s|t|re|ve|m|ll|d)\b| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+/gu;
const CJK = /[぀-ヿ㐀-鿿가-힯]/gu;
const INDIC = /[ऀ-෿]/gu;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  let tokens = 0;
  for (const m of text.matchAll(PIECE)) {
    const p = m[0];
    const cjk = p.match(CJK)?.length ?? 0;
    const indic = p.match(INDIC)?.length ?? 0;
    if (cjk) { tokens += cjk * 1.1; continue; }
    if (indic) { tokens += Math.ceil(indic / 1.6); continue; }
    if (/^\s+$/.test(p)) { tokens += p.includes('\n') ? Math.ceil(p.length / 4) : p.length > 1 ? 1 : 0; continue; }
    const core = p.trim();
    if (/^\p{N}+$/u.test(core)) tokens += Math.ceil(core.length / 3);
    else if (/^\p{L}+$/u.test(core)) tokens += core.length <= 6 ? 1 : Math.ceil(core.length / 4.5);
    else tokens += Math.ceil(core.length / 2);
  }
  return Math.max(1, Math.round(tokens));
}

const TIERS = {
  budget: { label: 'Budget', input: 0.2, output: 1.2, hint: 'Small / “mini” models' },
  mid: { label: 'Mid-range', input: 2, output: 10, hint: 'Sonnet / GPT standard tier' },
  flagship: { label: 'Flagship', input: 5, output: 25, hint: 'Opus / top-tier models' },
  custom: { label: 'Custom', input: 0, output: 0, hint: 'Enter your model’s prices' },
} as const;
type Tier = keyof typeof TIERS;

export default function AiTokenCounter() {
  const [text, setText] = useState('');
  const [tier, setTier] = useState<Tier>('mid');
  const [inPrice, setInPrice] = useState(String(TIERS.mid.input));
  const [outPrice, setOutPrice] = useState(String(TIERS.mid.output));
  const [outTokens, setOutTokens] = useState('500');
  const [calls, setCalls] = useState('1');
  const { fmt } = useNumberFormat();

  const stats = useMemo(() => ({
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    tokens: estimateTokens(text),
  }), [text]);

  function pickTier(t: Tier) {
    setTier(t);
    if (t !== 'custom') { setInPrice(String(TIERS[t].input)); setOutPrice(String(TIERS[t].output)); }
  }

  const n = Math.max(1, num(calls) || 1);
  const inCost = (stats.tokens / 1e6) * (num(inPrice) || 0) * n;
  const outCost = ((num(outTokens) || 0) / 1e6) * (num(outPrice) || 0) * n;
  const money = (v: number) => (v === 0 ? '$0' : v < 0.01 ? `$${v.toFixed(5)}` : `$${fmt(v, 4)}`);

  return (
    <div className="space-y-4">
      <Panel>
        <Label htmlFor="prompt">Prompt or text</Label>
        <TextArea id="prompt" rows={10} value={text} onChange={e => setText(e.target.value)} placeholder="Paste your prompt, document or chat history…" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Tokens (est.)" value={fmt(stats.tokens, 0)} highlight />
          <Stat label="Words" value={fmt(stats.words, 0)} />
          <Stat label="Characters" value={fmt(stats.chars, 0)} />
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div>
          <Label>Price tier</Label>
          <Segmented value={tier} onChange={pickTier} options={(Object.keys(TIERS) as Tier[]).map(k => ({ value: k, label: TIERS[k].label }))} />
          <p className="text-xs text-slate-500 mt-1.5">{TIERS[tier].hint}. Prices change often — check your provider’s pricing page and edit the numbers below.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <NumberField id="inp" label="Input $ / 1M tokens" value={inPrice} onChange={v => { setInPrice(v); setTier('custom'); }} prefix="$" />
          <NumberField id="outp" label="Output $ / 1M tokens" value={outPrice} onChange={v => { setOutPrice(v); setTier('custom'); }} prefix="$" />
          <NumberField id="outt" label="Expected reply tokens" value={outTokens} onChange={setOutTokens} />
          <NumberField id="calls" label="Number of requests" value={calls} onChange={setCalls} min={1} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Input cost" value={money(inCost)} />
          <Stat label="Output cost" value={money(outCost)} />
          <Stat label={n > 1 ? `Total for ${fmt(n, 0)} requests` : 'Total per request'} value={money(inCost + outCost)} highlight />
        </div>
      </Panel>
    </div>
  );
}
