'use client';

import { useMemo, useState } from 'react';
import { NumberField, Panel, Segmented, Stat } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';
import { cn } from '@/lib/utils';

type Units = 'metric' | 'imperial';

const BANDS = [
  { max: 18.5, label: 'Underweight', color: 'bg-violet-400', text: 'text-violet-700' },
  { max: 25, label: 'Healthy weight', color: 'bg-emerald-500', text: 'text-emerald-700' },
  { max: 30, label: 'Overweight', color: 'bg-amber-400', text: 'text-amber-700' },
  { max: Infinity, label: 'Obese', color: 'bg-red-500', text: 'text-red-700' },
];
const SCALE_MIN = 15, SCALE_MAX = 40;

export default function BmiCalculator() {
  const [units, setUnits] = useState<Units>('metric');
  const [cm, setCm] = useState('170');
  const [kg, setKg] = useState('65');
  const [ft, setFt] = useState('5');
  const [inch, setInch] = useState('7');
  const [lb, setLb] = useState('143');
  const { fmt } = useNumberFormat();

  const r = useMemo(() => {
    const meters = units === 'metric' ? num(cm) / 100 : ((num(ft) || 0) * 12 + (num(inch) || 0)) * 0.0254;
    const weightKg = units === 'metric' ? num(kg) : num(lb) * 0.45359237;
    if (!(meters > 0.5 && meters < 3) || !(weightKg > 0)) return null;
    const bmi = weightKg / (meters * meters);
    const band = BANDS.find(b => bmi < b.max)!;
    const toUnit = (k: number) => (units === 'metric' ? k : k / 0.45359237);
    return { bmi, band, low: toUnit(18.5 * meters * meters), high: toUnit(24.9 * meters * meters) };
  }, [units, cm, kg, ft, inch, lb]);

  const wUnit = units === 'metric' ? 'kg' : 'lb';
  const pos = r ? ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, r.bmi)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="space-y-5">
        <Segmented value={units} onChange={setUnits} options={[{ value: 'metric', label: 'Metric (cm, kg)' }, { value: 'imperial', label: 'Imperial (ft, lb)' }]} />
        {units === 'metric' ? (
          <>
            <NumberField id="cm" label="Height" suffix="cm" value={cm} onChange={setCm} min={0} />
            <NumberField id="kg" label="Weight" suffix="kg" value={kg} onChange={setKg} min={0} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="ft" label="Height" suffix="ft" value={ft} onChange={setFt} min={0} />
              <NumberField id="in" label={<span className="invisible">Inches</span>} suffix="in" value={inch} onChange={setInch} min={0} />
            </div>
            <NumberField id="lb" label="Weight" suffix="lb" value={lb} onChange={setLb} min={0} />
          </>
        )}
      </Panel>

      <div className="space-y-4">
        {!r ? <Panel className="text-sm text-slate-400">Enter your height and weight.</Panel> : (
          <>
            <Panel>
              <div className="text-sm text-slate-500">Your BMI</div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-black text-slate-900 tabular-nums">{fmt(r.bmi, 1)}</span>
                <span className={cn('font-bold', r.band.text)}>{r.band.label}</span>
              </div>
              <div className="relative mt-6">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {/* widths proportional to each band on the 15–40 scale */}
                  <div className="bg-violet-400" style={{ width: `${((18.5 - SCALE_MIN) / 25) * 100}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${(6.5 / 25) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${(5 / 25) * 100}%` }} />
                  <div className="bg-red-500 flex-1" />
                </div>
                <div className="absolute -top-1.5 w-1 h-6 bg-slate-900 rounded-full -translate-x-1/2 ring-2 ring-white" style={{ left: `${pos}%` }} />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 tabular-nums">
                  <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                </div>
              </div>
            </Panel>
            <Stat label="Healthy weight for your height" value={`${fmt(r.low, 1)} – ${fmt(r.high, 1)} ${wUnit}`} sub="BMI 18.5 – 24.9 (WHO adult range)" />
          </>
        )}
      </div>
    </div>
  );
}
