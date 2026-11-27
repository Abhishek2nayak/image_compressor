'use client';

import { useMemo, useState } from 'react';
import { Panel, Segmented, SliderField, SplitBar, Stat, ErrorNote } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';

export default function EmiCalculator() {
  const [amount, setAmount] = useState('1000000');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('20');
  const [unit, setUnit] = useState<'years' | 'months'>('years');
  const { money } = useNumberFormat();

  const result = useMemo(() => {
    const P = num(amount);
    const R = num(rate);
    const T = num(tenure);
    const n = Math.round(unit === 'years' ? T * 12 : T);
    if (!(P > 0) || !(R >= 0) || !(n > 0)) return { error: 'Enter a loan amount, interest rate and tenure greater than zero.' };
    if (n > 1200) return { error: 'Tenure can be at most 100 years.' };

    const i = R / 12 / 100;
    const emi = i === 0 ? P / n : (P * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

    const rows: { year: number; principal: number; interest: number; balance: number }[] = [];
    let balance = P, yPrin = 0, yInt = 0, totalPaid = 0;
    for (let m = 1; m <= n; m++) {
      const interest = balance * i;
      const principal = m === n ? balance : emi - interest;
      balance -= principal;
      yPrin += principal;
      yInt += interest;
      totalPaid += principal + interest;
      if (m % 12 === 0 || m === n) {
        rows.push({ year: Math.ceil(m / 12), principal: yPrin, interest: yInt, balance: Math.max(0, balance) });
        yPrin = 0;
        yInt = 0;
      }
    }
    return { emi, P, totalPaid, totalInterest: totalPaid - P, rows };
  }, [amount, rate, tenure, unit]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="space-y-6">
        <SliderField id="amt" label="Loan amount" value={amount} onChange={setAmount} min={10000} max={20000000} step={10000} />
        <SliderField id="rate" label="Interest rate (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.05} suffix="%" />
        <div>
          <SliderField id="ten" label="Loan tenure" value={tenure} onChange={setTenure}
            min={1} max={unit === 'years' ? 30 : 360} step={1} suffix={unit === 'years' ? 'yrs' : 'mo'} />
          <Segmented size="sm" className="mt-3" value={unit}
            onChange={u => { setUnit(u); setTenure(t => { const v = num(t); return Number.isFinite(v) ? String(u === 'months' ? Math.round(v * 12) : +(v / 12).toFixed(2)) : t; }); }}
            options={[{ value: 'years', label: 'Years' }, { value: 'months', label: 'Months' }]} />
        </div>
      </Panel>

      <div className="space-y-4">
        {'error' in result ? <ErrorNote>{result.error}</ErrorNote> : (
          <>
            <Stat highlight label="Monthly EMI" value={money(result.emi)} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total interest" value={money(result.totalInterest)} />
              <Stat label="Total payment" value={money(result.totalPaid)} sub="Principal + interest" />
            </div>
            <Panel>
              <SplitBar parts={[
                { label: 'Principal', value: result.P, className: 'bg-brand-600' },
                { label: 'Interest', value: result.totalInterest, className: 'bg-amber-400' },
              ]} />
            </Panel>
          </>
        )}
      </div>

      {!('error' in result) && (
        <Panel className="lg:col-span-2 p-0 overflow-hidden">
          <details>
            <summary className="px-5 py-4 cursor-pointer font-semibold text-sm text-slate-800">Year-by-year repayment schedule</summary>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm tabular-nums">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr><th className="text-left px-5 py-2 font-semibold">Year</th><th className="text-right px-5 py-2 font-semibold">Principal</th><th className="text-right px-5 py-2 font-semibold">Interest</th><th className="text-right px-5 py-2 font-semibold">Balance</th></tr>
                </thead>
                <tbody>
                  {result.rows.map(r => (
                    <tr key={r.year} className="border-t border-slate-100">
                      <td className="px-5 py-2 text-slate-600">{r.year}</td>
                      <td className="px-5 py-2 text-right">{money(r.principal)}</td>
                      <td className="px-5 py-2 text-right">{money(r.interest)}</td>
                      <td className="px-5 py-2 text-right font-semibold">{money(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Panel>
      )}
    </div>
  );
}
