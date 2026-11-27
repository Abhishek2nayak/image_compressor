'use client';

import { useEffect, useMemo, useState } from 'react';
import { ErrorNote, Label, Panel, Stat, TextInput } from '@/components/tool/ui';
import { daysBetween, parseDateInput, toDateInput, useNumberFormat, ymdDiff } from '@/lib/tool-helpers';

export default function AgeCalculator() {
  const [dob, setDob] = useState('2000-01-01');
  const [asOf, setAsOf] = useState('');
  const { fmt } = useNumberFormat();

  // "Today" is set on the client so server and browser time zones can't disagree.
  useEffect(() => setAsOf(toDateInput(new Date())), []);

  const r = useMemo(() => {
    const from = parseDateInput(dob);
    const to = parseDateInput(asOf);
    if (!from || !to) return null;
    if (from > to) return { error: 'Date of birth must be on or before the “Age on” date.' };

    const age = ymdDiff(from, to);
    const totalDays = daysBetween(from, to);

    // Next birthday (29 Feb birthdays fall on 28 Feb in non-leap years)
    const birthdayIn = (year: number) => {
      const d = new Date(year, from.getMonth(), from.getDate());
      return d.getMonth() !== from.getMonth() ? new Date(year, from.getMonth() + 1, 0) : d;
    };
    let next = birthdayIn(to.getFullYear());
    if (next < to) next = birthdayIn(to.getFullYear() + 1);
    const untilNext = daysBetween(to, next);

    return {
      age, totalDays,
      totalMonths: age.years * 12 + age.months,
      weeks: Math.floor(totalDays / 7),
      untilNext,
      nextAge: age.years + (untilNext === 0 ? 0 : 1),
      bornOn: from.toLocaleDateString(undefined, { weekday: 'long' }),
    };
  }, [dob, asOf]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <Panel className="space-y-4 h-fit">
        <div>
          <Label htmlFor="dob">Date of birth</Label>
          <TextInput id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} max={asOf || undefined} />
        </div>
        <div>
          <Label htmlFor="asof">Age on</Label>
          <TextInput id="asof" type="date" value={asOf} onChange={e => setAsOf(e.target.value)} />
        </div>
      </Panel>

      <div className="space-y-4">
        {!r ? <Panel className="text-sm text-slate-400">Pick a date of birth to see the age.</Panel>
          : 'error' in r ? <ErrorNote>{r.error}</ErrorNote> : (
            <>
              <div className="rounded-2xl bg-brand-600 text-white p-6">
                <div className="text-sm text-brand-100">Age</div>
                <div className="text-3xl md:text-4xl font-black mt-1">
                  {r.age.years} <span className="text-lg font-semibold text-brand-100">years</span>{' '}
                  {r.age.months} <span className="text-lg font-semibold text-brand-100">months</span>{' '}
                  {r.age.days} <span className="text-lg font-semibold text-brand-100">days</span>
                </div>
                <div className="text-sm text-brand-100 mt-2">Born on a {r.bornOn}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Total months" value={fmt(r.totalMonths)} />
                <Stat label="Total weeks" value={fmt(r.weeks)} />
                <Stat label="Total days" value={fmt(r.totalDays)} />
                <Stat label="Total hours" value={fmt(r.totalDays * 24)} />
              </div>
              <Stat
                label="Next birthday"
                value={r.untilNext === 0 ? 'Today! 🎉' : `${fmt(r.untilNext)} days`}
                sub={r.untilNext === 0 ? `You turn ${r.age.years} today` : `You will turn ${r.nextAge}`}
              />
            </>
          )}
      </div>
    </div>
  );
}
