'use client';

import { useState, type ReactNode } from 'react';
import { Panel } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';
import { cn } from '@/lib/utils';

function Inline({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <input
      type="number" inputMode="decimal" step="any" aria-label={label} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
    />
  );
}

function Row({ title, children, result, tone }: { title: string; children: ReactNode; result: string; tone?: 'up' | 'down' }) {
  return (
    <Panel className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
      <div className="flex-1">
        <h2 className="text-xs font-semibold text-slate-400 uppercase mb-2">{title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">{children}</div>
      </div>
      <div className={cn('md:w-48 rounded-xl px-4 py-3 text-right font-black text-xl tabular-nums',
        tone === 'up' ? 'bg-emerald-50 text-emerald-700' : tone === 'down' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700')}>
        {result}
      </div>
    </Panel>
  );
}

export default function PercentageCalculator() {
  const { fmt } = useNumberFormat();
  const [a1, setA1] = useState('15'); const [b1, setB1] = useState('200');
  const [a2, setA2] = useState('30'); const [b2, setB2] = useState('120');
  const [a3, setA3] = useState('80'); const [b3, setB3] = useState('100');
  const [a4, setA4] = useState('500'); const [b4, setB4] = useState('10');

  const r1 = (num(a1) * num(b1)) / 100;
  const r2 = (num(a2) / num(b2)) * 100;
  const r3 = ((num(b3) - num(a3)) / Math.abs(num(a3))) * 100;
  const up4 = num(a4) * (1 + num(b4) / 100);
  const down4 = num(a4) * (1 - num(b4) / 100);
  const show = (n: number, suffix = '') => (Number.isFinite(n) ? `${fmt(n, 4)}${suffix}` : '—');

  return (
    <div className="space-y-3">
      <Row title="Percent of a number" result={show(r1)}>
        What is <Inline label="percent" value={a1} onChange={setA1} /> % of <Inline label="number" value={b1} onChange={setB1} /> ?
      </Row>
      <Row title="What percent" result={show(r2, '%')}>
        <Inline label="part" value={a2} onChange={setA2} /> is what % of <Inline label="whole" value={b2} onChange={setB2} /> ?
      </Row>
      <Row title="Percentage change" result={Number.isFinite(r3) ? `${r3 > 0 ? '+' : ''}${fmt(r3, 4)}%` : '—'} tone={r3 > 0 ? 'up' : r3 < 0 ? 'down' : undefined}>
        From <Inline label="old value" value={a3} onChange={setA3} /> to <Inline label="new value" value={b3} onChange={setB3} />
        {Number.isFinite(r3) && r3 !== 0 && <span className="text-slate-400">({r3 > 0 ? 'increase' : 'decrease'})</span>}
      </Row>
      <Row title="Increase / decrease by percent" result={show(up4)} tone="up">
        <Inline label="value" value={a4} onChange={setA4} /> increased by <Inline label="percent" value={b4} onChange={setB4} /> %
        <span className="text-slate-400 w-full md:w-auto">Decreased by the same: <b className="text-slate-700 tabular-nums">{show(down4)}</b></span>
      </Row>
    </div>
  );
}
