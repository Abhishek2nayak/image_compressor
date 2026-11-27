'use client';

import { useMemo, useState } from 'react';
import { ErrorNote, Panel, Segmented, SliderField, SplitBar, Stat } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';

type Mode = 'sip' | 'lumpsum';

export default function SipCalculator() {
  const [mode, setMode] = useState<Mode>('sip');
  const [amount, setAmount] = useState('10000');
  const [lump, setLump] = useState('500000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [stepUp, setStepUp] = useState('0');
  const { money } = useNumberFormat();

  const result = useMemo(() => {
    const R = num(rate);
    const Y = num(years);
    if (!(R >= 0) || !(Y > 0) || Y > 60) return { error: 'Enter a return of 0% or more and a period between 1 and 60 years.' };
    const rows: { year: number; invested: number; value: number }[] = [];

    if (mode === 'sip') {
      const P = num(amount);
      const S = num(stepUp) || 0;
      if (!(P > 0)) return { error: 'Enter a monthly investment greater than zero.' };
      const i = R / 12 / 100;
      const months = Math.round(Y * 12);
      let monthly = P, value = 0, invested = 0;
      for (let m = 0; m < months; m++) {
        if (m > 0 && m % 12 === 0) monthly *= 1 + S / 100;
        // Investment at the start of each month (annuity due), then a month of growth.
        invested += monthly;
        value = (value + monthly) * (1 + i);
        if ((m + 1) % 12 === 0 || m === months - 1) rows.push({ year: Math.ceil((m + 1) / 12), invested, value });
      }
      return { invested, value, gains: value - invested, rows };
    }

    const P = num(lump);
    if (!(P > 0)) return { error: 'Enter an investment amount greater than zero.' };
    for (let y = 1; y <= Math.ceil(Y); y++) {
      const t = Math.min(y, Y);
      rows.push({ year: y, invested: P, value: P * Math.pow(1 + R / 100, t) });
    }
    const value = P * Math.pow(1 + R / 100, Y);
    return { invested: P, value, gains: value - P, rows };
  }, [mode, amount, lump, rate, years, stepUp]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="space-y-6">
        <Segmented value={mode} onChange={setMode} options={[{ value: 'sip', label: 'SIP (monthly)' }, { value: 'lumpsum', label: 'Lump sum' }]} />
        {mode === 'sip'
          ? <SliderField id="amt" label="Monthly investment" value={amount} onChange={setAmount} min={500} max={200000} step={500} />
          : <SliderField id="lump" label="Total investment" value={lump} onChange={setLump} min={1000} max={10000000} step={1000} />}
        <SliderField id="rate" label="Expected return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderField id="yrs" label="Time period" value={years} onChange={setYears} min={1} max={40} step={1} suffix="yrs" />
        {mode === 'sip' && (
          <SliderField id="step" label="Annual step-up" value={stepUp} onChange={setStepUp} min={0} max={25} step={1} suffix="%" />
        )}
      </Panel>

      <div className="space-y-4">
        {'error' in result ? <ErrorNote>{result.error}</ErrorNote> : (
          <>
            <Stat highlight label="Estimated value" value={money(result.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Amount invested" value={money(result.invested)} />
              <Stat label="Estimated returns" value={money(result.gains)} />
            </div>
            <Panel>
              <SplitBar parts={[
                { label: 'Invested', value: result.invested, className: 'bg-brand-600' },
                { label: 'Returns', value: result.gains, className: 'bg-emerald-500' },
              ]} />
            </Panel>
            <Panel className="p-0 overflow-hidden">
              <details>
                <summary className="px-5 py-4 cursor-pointer font-semibold text-sm text-slate-800">Year-by-year growth</summary>
                <div className="max-h-80 overflow-y-auto border-t border-slate-100">
                  <table className="w-full text-sm tabular-nums">
                    <thead className="bg-slate-50 text-slate-500 text-xs sticky top-0">
                      <tr><th className="text-left px-5 py-2 font-semibold">Year</th><th className="text-right px-5 py-2 font-semibold">Invested</th><th className="text-right px-5 py-2 font-semibold">Value</th></tr>
                    </thead>
                    <tbody>
                      {result.rows.map(r => (
                        <tr key={r.year} className="border-t border-slate-100">
                          <td className="px-5 py-2 text-slate-600">{r.year}</td>
                          <td className="px-5 py-2 text-right">{money(r.invested)}</td>
                          <td className="px-5 py-2 text-right font-semibold">{money(r.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}
