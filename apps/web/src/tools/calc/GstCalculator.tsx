'use client';

import { useMemo, useState } from 'react';
import { ErrorNote, Label, NumberField, Panel, Segmented, Stat } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';
import { cn } from '@/lib/utils';

// Slabs after the GST rate rationalisation effective 22 Sept 2025 (5%, 18%, 40%),
// plus special rates. Any custom rate can be typed in.
const PRESETS = [0.25, 3, 5, 18, 40];

export default function GstCalculator() {
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState('18');
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const { fmt } = useNumberFormat();

  const r = useMemo(() => {
    const A = num(amount);
    const R = num(rate);
    if (!(A >= 0) || !(R >= 0)) return null;
    const gst = mode === 'exclusive' ? (A * R) / 100 : (A * R) / (100 + R);
    const net = mode === 'exclusive' ? A : A - gst;
    return { gst, net, total: net + gst };
  }, [amount, rate, mode]);

  const rs = (n: number) => `₹${fmt(n, 2)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="space-y-5">
        <Segmented value={mode} onChange={setMode} options={[
          { value: 'exclusive', label: 'Add GST' },
          { value: 'inclusive', label: 'Remove GST' },
        ]} />
        <NumberField id="amt" label={mode === 'exclusive' ? 'Amount (before GST)' : 'Amount (GST inclusive)'} prefix="₹" value={amount} onChange={setAmount} min={0} />
        <div>
          <Label>GST rate</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map(p => (
              <button key={p} type="button" onClick={() => setRate(String(p))}
                className={cn('px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                  num(rate) === p ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300')}>
                {p}%
              </button>
            ))}
          </div>
          <NumberField id="rate" label="Custom rate" suffix="%" value={rate} onChange={setRate} min={0} />
        </div>
      </Panel>

      <div className="space-y-4">
        {!r ? <ErrorNote>Enter an amount and a GST rate of 0 or more.</ErrorNote> : (
          <>
            <Stat highlight label="Total amount (incl. GST)" value={rs(r.total)} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Net amount (excl. GST)" value={rs(r.net)} />
              <Stat label={`GST @ ${fmt(num(rate), 2)}%`} value={rs(r.gst)} />
            </div>
            <Panel>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Tax breakdown</h3>
              <dl className="text-sm divide-y divide-slate-100">
                <Row k={`CGST (${fmt(num(rate) / 2, 3)}%)`} v={rs(r.gst / 2)} />
                <Row k={`SGST / UTGST (${fmt(num(rate) / 2, 3)}%)`} v={rs(r.gst / 2)} />
                <Row k={`or IGST (${fmt(num(rate), 2)}%) for inter-state`} v={rs(r.gst)} />
              </dl>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-semibold tabular-nums text-slate-900">{v}</dd>
    </div>
  );
}
