'use client';

import { useMemo, useState } from 'react';
import { ErrorNote, Label, Panel, Select, SliderField, SplitBar, Stat } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';

const FREQ = [
  { n: 1, label: 'Yearly' },
  { n: 2, label: 'Half-yearly' },
  { n: 4, label: 'Quarterly' },
  { n: 12, label: 'Monthly' },
  { n: 365, label: 'Daily' },
];

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('5');
  const [freq, setFreq] = useState('4');
  const [deposit, setDeposit] = useState('0');
  const { money } = useNumberFormat();

  const r = useMemo(() => {
    const P = num(principal) || 0;
    const R = num(rate) / 100;
    const T = num(years);
    const n = Number(freq);
    const C = num(deposit) || 0;
    if (P < 0 || C < 0 || !(R >= 0) || !(T > 0) || T > 100) return { error: 'Enter a rate of 0% or more and a period between 0 and 100 years.' };
    if (P === 0 && C === 0) return { error: 'Enter a principal or a monthly deposit.' };

    const em = Math.pow(1 + R / n, n / 12) - 1; // equivalent monthly rate
    const at = (t: number) => {
      const months = Math.round(t * 12);
      const fromP = P * Math.pow(1 + R / n, n * t);
      const fromC = em === 0 ? C * months : C * ((Math.pow(1 + em, months) - 1) / em);
      return { value: fromP + fromC, invested: P + C * months };
    };
    const rows = Array.from({ length: Math.ceil(T) }, (_, k) => ({ year: k + 1, ...at(Math.min(k + 1, T)) }));
    const end = at(T);
    return { ...end, interest: end.value - end.invested, rows, effective: (Math.pow(1 + R / n, n) - 1) * 100 };
  }, [principal, rate, years, freq, deposit]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="space-y-6">
        <SliderField id="p" label="Principal" value={principal} onChange={setPrincipal} min={0} max={10000000} step={1000} />
        <SliderField id="r" label="Annual interest rate" value={rate} onChange={setRate} min={0} max={20} step={0.05} suffix="%" />
        <SliderField id="t" label="Time period" value={years} onChange={setYears} min={1} max={40} step={1} suffix="yrs" />
        <div>
          <Label htmlFor="f">Compounding</Label>
          <Select id="f" value={freq} onChange={e => setFreq(e.target.value)}>
            {FREQ.map(f => <option key={f.n} value={f.n}>{f.label}</option>)}
          </Select>
        </div>
        <SliderField id="c" label="Monthly deposit (optional)" value={deposit} onChange={setDeposit} min={0} max={100000} step={500} />
      </Panel>

      <div className="space-y-4">
        {'error' in r ? <ErrorNote>{r.error}</ErrorNote> : (
          <>
            <Stat highlight label="Maturity value" value={money(r.value)} sub={`Effective annual rate ${r.effective.toFixed(2)}%`} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total invested" value={money(r.invested)} />
              <Stat label="Interest earned" value={money(r.interest)} />
            </div>
            <Panel>
              <SplitBar parts={[
                { label: 'Invested', value: r.invested, className: 'bg-brand-600' },
                { label: 'Interest', value: r.interest, className: 'bg-emerald-500' },
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
                      {r.rows.map(row => (
                        <tr key={row.year} className="border-t border-slate-100">
                          <td className="px-5 py-2 text-slate-600">{row.year}</td>
                          <td className="px-5 py-2 text-right">{money(row.invested)}</td>
                          <td className="px-5 py-2 text-right font-semibold">{money(row.value)}</td>
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
