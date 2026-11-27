'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button, Checkbox, Label, NumberField, Panel, Segmented, Select, Stat, TextInput } from '@/components/tool/ui';
import { daysBetween, num, parseDateInput, toDateInput, useNumberFormat, ymdDiff } from '@/lib/tool-helpers';

type Tab = 'between' | 'add';
type Unit = 'days' | 'weeks' | 'months' | 'years';

function countWeekdays(a: Date, b: Date, inclusive: boolean) {
  const total = daysBetween(a, b) + (inclusive ? 1 : 0);
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  const d = new Date(a.getFullYear(), a.getMonth(), a.getDate() + fullWeeks * 7);
  for (let i = 0; i < total % 7; i++) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function addToDate(date: Date, amount: number, unit: Unit): Date {
  if (unit === 'days' || unit === 'weeks') {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount * (unit === 'weeks' ? 7 : 1));
  }
  const months = unit === 'years' ? amount * 12 : amount;
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay)); // 31 Jan + 1 month → 28/29 Feb
  return target;
}

const longDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function DateDifference() {
  const [tab, setTab] = useState<Tab>('between');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [inclusive, setInclusive] = useState(false);
  const [base, setBase] = useState('');
  const [op, setOp] = useState<'add' | 'sub'>('add');
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState<Unit>('days');
  const { fmt } = useNumberFormat();

  useEffect(() => {
    const today = new Date();
    setStart(toDateInput(today));
    setEnd(toDateInput(new Date(today.getFullYear(), 11, 31)));
    setBase(toDateInput(today));
  }, []);

  const between = useMemo(() => {
    let a = parseDateInput(start);
    let b = parseDateInput(end);
    if (!a || !b) return null;
    const swapped = a > b;
    if (swapped) [a, b] = [b, a];
    const days = daysBetween(a, b) + (inclusive ? 1 : 0);
    const bInc = inclusive ? new Date(b.getFullYear(), b.getMonth(), b.getDate() + 1) : b;
    return { days, swapped, ymd: ymdDiff(a, bInc), weekdays: countWeekdays(a, b, inclusive) };
  }, [start, end, inclusive]);

  const added = useMemo(() => {
    const d = parseDateInput(base);
    const n = num(amount);
    if (!d || !Number.isFinite(n)) return null;
    return addToDate(d, Math.trunc(n) * (op === 'sub' ? -1 : 1), unit);
  }, [base, op, amount, unit]);

  return (
    <div className="space-y-4">
      <Segmented value={tab} onChange={setTab} options={[{ value: 'between', label: 'Days between dates' }, { value: 'add', label: 'Add / subtract' }]} />

      {tab === 'between' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <Panel className="space-y-4 h-fit">
            <div>
              <Label htmlFor="start">Start date</Label>
              <TextInput id="start" type="date" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => { setStart(end); setEnd(start); }} aria-label="Swap dates"><ArrowLeftRight className="w-4 h-4 rotate-90" /> Swap</Button>
            </div>
            <div>
              <Label htmlFor="end">End date</Label>
              <TextInput id="end" type="date" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
            <Checkbox checked={inclusive} onChange={setInclusive} label="Include end date (+1 day)" />
          </Panel>
          {between && (
            <div className="space-y-4">
              <Stat highlight label="Total days" value={fmt(between.days)}
                sub={between.swapped ? 'End date is before start date — showing the absolute difference.' : undefined} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Years, months, days" value={<span className="text-lg">{between.ymd.years}y {between.ymd.months}m {between.ymd.days}d</span>} />
                <Stat label="Weeks" value={<span className="text-lg">{fmt(Math.floor(between.days / 7))}w {between.days % 7}d</span>} />
                <Stat label="Working days" value={fmt(between.weekdays)} sub="Mon–Fri" />
                <Stat label="Hours" value={fmt(between.days * 24)} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <Panel className="space-y-4 h-fit">
            <div>
              <Label htmlFor="base">Start date</Label>
              <TextInput id="base" type="date" value={base} onChange={e => setBase(e.target.value)} />
            </div>
            <Segmented value={op} onChange={setOp} options={[{ value: 'add', label: 'Add' }, { value: 'sub', label: 'Subtract' }]} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="amount" label="Amount" value={amount} onChange={setAmount} step={1} />
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select id="unit" value={unit} onChange={e => setUnit(e.target.value as Unit)}>
                  <option value="days">Days</option><option value="weeks">Weeks</option>
                  <option value="months">Months</option><option value="years">Years</option>
                </Select>
              </div>
            </div>
          </Panel>
          {added && <Stat highlight label="Resulting date" value={<span className="text-xl md:text-2xl">{longDate(added)}</span>} />}
        </div>
      )}
    </div>
  );
}
