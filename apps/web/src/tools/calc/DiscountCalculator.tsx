'use client';

import { useMemo, useState } from 'react';
import { NumberField, Panel, Stat } from '@/components/tool/ui';
import { num, useNumberFormat } from '@/lib/tool-helpers';

export default function DiscountCalculator() {
  const [price, setPrice] = useState('2499');
  const [d1, setD1] = useState('20');
  const [d2, setD2] = useState('');
  const [tax, setTax] = useState('');
  const { fmt } = useNumberFormat();

  const r = useMemo(() => {
    const P = num(price);
    if (!(P >= 0)) return null;
    const a = (num(d1) || 0) / 100;
    const b = (num(d2) || 0) / 100;
    const t = (num(tax) || 0) / 100;
    const afterDiscount = P * (1 - a) * (1 - b);
    const saved = P - afterDiscount;
    return { afterDiscount, saved, effective: P > 0 ? (saved / P) * 100 : 0, taxAmount: afterDiscount * t, final: afterDiscount * (1 + t), hasTax: t > 0 };
  }, [price, d1, d2, tax]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel className="space-y-4">
        <NumberField id="price" label="Original price" value={price} onChange={setPrice} min={0} />
        <NumberField id="d1" label="Discount" suffix="%" value={d1} onChange={setD1} min={0} max={100} />
        <NumberField id="d2" label="Extra discount (optional)" suffix="%" value={d2} onChange={setD2} min={0} max={100} hint="Applied on the already-discounted price." />
        <NumberField id="tax" label="Tax (optional)" suffix="%" value={tax} onChange={setTax} min={0} />
      </Panel>
      {r && (
        <div className="space-y-4">
          <Stat highlight label={r.hasTax ? 'Final price (incl. tax)' : 'Final price'} value={fmt(r.final, 2)} />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="You save" value={fmt(r.saved, 2)} />
            <Stat label="Total discount" value={`${fmt(r.effective, 2)}%`} />
          </div>
          {r.hasTax && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Price after discount" value={fmt(r.afterDiscount, 2)} />
              <Stat label="Tax" value={fmt(r.taxAmount, 2)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
