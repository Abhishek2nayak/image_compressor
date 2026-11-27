'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button, Label, Panel, Select, TextInput } from '@/components/tool/ui';
import { num, useMounted } from '@/lib/tool-helpers';
import { cn } from '@/lib/utils';

type Unit = { id: string; label: string; factor: number };
type Cat = { id: string; label: string; units: Unit[]; defaults: [string, string] };

const CATS: Cat[] = [
  { id: 'length', label: 'Length', defaults: ['cm', 'in'], units: [
    { id: 'mm', label: 'Millimetre (mm)', factor: 0.001 }, { id: 'cm', label: 'Centimetre (cm)', factor: 0.01 },
    { id: 'm', label: 'Metre (m)', factor: 1 }, { id: 'km', label: 'Kilometre (km)', factor: 1000 },
    { id: 'in', label: 'Inch (in)', factor: 0.0254 }, { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
    { id: 'yd', label: 'Yard (yd)', factor: 0.9144 }, { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
    { id: 'nmi', label: 'Nautical mile', factor: 1852 },
  ] },
  { id: 'weight', label: 'Weight', defaults: ['kg', 'lb'], units: [
    { id: 'mg', label: 'Milligram (mg)', factor: 1e-6 }, { id: 'g', label: 'Gram (g)', factor: 0.001 },
    { id: 'kg', label: 'Kilogram (kg)', factor: 1 }, { id: 'q', label: 'Quintal (q)', factor: 100 },
    { id: 't', label: 'Tonne (t)', factor: 1000 }, { id: 'oz', label: 'Ounce (oz)', factor: 0.028349523125 },
    { id: 'lb', label: 'Pound (lb)', factor: 0.45359237 }, { id: 'st', label: 'Stone (st)', factor: 6.35029318 },
  ] },
  { id: 'temperature', label: 'Temperature', defaults: ['c', 'f'], units: [
    { id: 'c', label: 'Celsius (°C)', factor: 1 }, { id: 'f', label: 'Fahrenheit (°F)', factor: 1 }, { id: 'k', label: 'Kelvin (K)', factor: 1 },
  ] },
  { id: 'area', label: 'Area', defaults: ['m2', 'ft2'], units: [
    { id: 'cm2', label: 'Square centimetre', factor: 1e-4 }, { id: 'm2', label: 'Square metre (m²)', factor: 1 },
    { id: 'km2', label: 'Square kilometre', factor: 1e6 }, { id: 'ha', label: 'Hectare (ha)', factor: 1e4 },
    { id: 'acre', label: 'Acre', factor: 4046.8564224 }, { id: 'in2', label: 'Square inch', factor: 0.00064516 },
    { id: 'ft2', label: 'Square foot (ft²)', factor: 0.09290304 }, { id: 'yd2', label: 'Square yard', factor: 0.83612736 },
    { id: 'mi2', label: 'Square mile', factor: 2589988.110336 },
  ] },
  { id: 'volume', label: 'Volume', defaults: ['l', 'galus'], units: [
    { id: 'ml', label: 'Millilitre (mL)', factor: 0.001 }, { id: 'l', label: 'Litre (L)', factor: 1 },
    { id: 'm3', label: 'Cubic metre (m³)', factor: 1000 }, { id: 'tsp', label: 'Teaspoon (US)', factor: 0.00492892159375 },
    { id: 'tbsp', label: 'Tablespoon (US)', factor: 0.01478676478125 }, { id: 'floz', label: 'Fluid ounce (US)', factor: 0.0295735295625 },
    { id: 'cup', label: 'Cup (US)', factor: 0.2365882365 }, { id: 'pt', label: 'Pint (US)', factor: 0.473176473 },
    { id: 'qt', label: 'Quart (US)', factor: 0.946352946 }, { id: 'galus', label: 'Gallon (US)', factor: 3.785411784 },
    { id: 'galuk', label: 'Gallon (UK)', factor: 4.54609 },
  ] },
  { id: 'speed', label: 'Speed', defaults: ['kmh', 'mph'], units: [
    { id: 'ms', label: 'Metre/second', factor: 1 }, { id: 'kmh', label: 'Kilometre/hour', factor: 1 / 3.6 },
    { id: 'mph', label: 'Mile/hour', factor: 0.44704 }, { id: 'kn', label: 'Knot', factor: 1852 / 3600 },
    { id: 'fts', label: 'Foot/second', factor: 0.3048 },
  ] },
  { id: 'time', label: 'Time', defaults: ['h', 'min'], units: [
    { id: 'ms', label: 'Millisecond', factor: 0.001 }, { id: 's', label: 'Second', factor: 1 },
    { id: 'min', label: 'Minute', factor: 60 }, { id: 'h', label: 'Hour', factor: 3600 },
    { id: 'd', label: 'Day', factor: 86400 }, { id: 'wk', label: 'Week', factor: 604800 },
    { id: 'mo', label: 'Month (avg)', factor: 2629746 }, { id: 'yr', label: 'Year (avg)', factor: 31556952 },
  ] },
  { id: 'data', label: 'Data', defaults: ['mb', 'gb'], units: [
    { id: 'bit', label: 'Bit', factor: 0.125 }, { id: 'b', label: 'Byte (B)', factor: 1 },
    { id: 'kb', label: 'Kilobyte (KB)', factor: 1e3 }, { id: 'mb', label: 'Megabyte (MB)', factor: 1e6 },
    { id: 'gb', label: 'Gigabyte (GB)', factor: 1e9 }, { id: 'tb', label: 'Terabyte (TB)', factor: 1e12 },
    { id: 'kib', label: 'Kibibyte (KiB)', factor: 1024 }, { id: 'mib', label: 'Mebibyte (MiB)', factor: 1024 ** 2 },
    { id: 'gib', label: 'Gibibyte (GiB)', factor: 1024 ** 3 }, { id: 'tib', label: 'Tebibyte (TiB)', factor: 1024 ** 4 },
  ] },
];

function toBase(cat: string, unit: Unit, v: number) {
  if (cat === 'temperature') return unit.id === 'c' ? v : unit.id === 'f' ? ((v - 32) * 5) / 9 : v - 273.15;
  return v * unit.factor;
}
function fromBase(cat: string, unit: Unit, v: number) {
  if (cat === 'temperature') return unit.id === 'c' ? v : unit.id === 'f' ? (v * 9) / 5 + 32 : v + 273.15;
  return v / unit.factor;
}

export default function UnitConverter() {
  const [catId, setCatId] = useState('length');
  const cat = CATS.find(c => c.id === catId)!;
  const [from, setFrom] = useState(cat.defaults[0]);
  const [to, setTo] = useState(cat.defaults[1]);
  const [value, setValue] = useState('1');
  const mounted = useMounted();

  const nf = useMemo(() => new Intl.NumberFormat(mounted ? navigator.language : 'en-US', { maximumSignificantDigits: 10 }), [mounted]);
  const show = (n: number) => {
    if (!Number.isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a !== 0 && (a >= 1e15 || a < 1e-6)) return n.toExponential(6).replace(/\.?0+e/, 'e');
    return nf.format(n);
  };

  const fromUnit = cat.units.find(u => u.id === from) ?? cat.units[0];
  const toUnit = cat.units.find(u => u.id === to) ?? cat.units[1];
  const v = num(value);
  const base = toBase(cat.id, fromUnit, v);

  function pickCat(id: string) {
    const c = CATS.find(x => x.id === id)!;
    setCatId(id);
    setFrom(c.defaults[0]);
    setTo(c.defaults[1]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATS.map(c => (
          <button key={c.id} type="button" onClick={() => pickCat(c.id)}
            className={cn('px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
              c.id === catId ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300')}>
            {c.label}
          </button>
        ))}
      </div>

      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="val">From</Label>
            <TextInput id="val" type="number" inputMode="decimal" step="any" value={value} onChange={e => setValue(e.target.value)} className="text-lg font-semibold" />
            <Select aria-label="From unit" value={fromUnit.id} onChange={e => setFrom(e.target.value)}>
              {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </Select>
          </div>
          <Button variant="secondary" onClick={() => { setFrom(toUnit.id); setTo(fromUnit.id); }} aria-label="Swap units" className="md:mb-[52px]">
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
          <div className="space-y-2">
            <Label>To</Label>
            <div className="border border-brand-200 bg-brand-50 rounded-xl px-3 py-2.5 text-lg font-black text-brand-700 tabular-nums break-all min-h-[46px]">
              {show(fromBase(cat.id, toUnit, base))}
            </div>
            <Select aria-label="To unit" value={toUnit.id} onChange={e => setTo(e.target.value)}>
              {cat.units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </Select>
          </div>
        </div>
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <h2 className="px-5 pt-4 pb-2 text-sm font-semibold text-slate-700">{Number.isFinite(v) ? show(v) : '—'} {fromUnit.label} equals</h2>
        <table className="w-full text-sm tabular-nums">
          <tbody>
            {cat.units.filter(u => u.id !== fromUnit.id).map(u => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-5 py-2 text-slate-500">{u.label}</td>
                <td className="px-5 py-2 text-right font-semibold text-slate-900 break-all">{show(fromBase(cat.id, u, base))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
