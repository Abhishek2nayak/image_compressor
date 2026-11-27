/**
 * Indian personal income tax — FY 2025-26 and FY 2026-27 (unchanged by Budget 2026).
 * New regime: 0–4L nil, then 5% steps every 4L up to 30% above 24L; 87A rebate makes
 * taxable income up to ₹12L tax-free (with marginal relief just above).
 * Old regime: 2.5L / 3L / 5L exemption by age, 5% / 20% / 30%; 87A up to ₹5L.
 * Surcharge 10/15/25/37% (new regime capped at 25%) with marginal relief; 4% cess.
 */

export type Regime = 'new' | 'old';
export type AgeGroup = 'below60' | '60to80' | 'above80';

export const STANDARD_DEDUCTION: Record<Regime, number> = { new: 75_000, old: 50_000 };

const NEW_SLABS: [number, number][] = [
  [400_000, 0], [800_000, 0.05], [1_200_000, 0.10], [1_600_000, 0.15], [2_000_000, 0.20], [2_400_000, 0.25], [Infinity, 0.30],
];
function oldSlabs(age: AgeGroup): [number, number][] {
  const exempt = age === 'above80' ? 500_000 : age === '60to80' ? 300_000 : 250_000;
  return [[exempt, 0], [500_000, 0.05], [1_000_000, 0.20], [Infinity, 0.30]].filter(([lim], i, a) => i === 0 || lim > a[0][0]) as [number, number][];
}

function slabTax(income: number, slabs: [number, number][]): number {
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, limit) - prev) * rate;
    prev = limit;
  }
  return tax;
}

const SURCHARGE: [number, number][] = [[5_000_000, 0], [10_000_000, 0.10], [20_000_000, 0.15], [50_000_000, 0.25], [Infinity, 0.37]];

function surchargeRate(income: number, regime: Regime) {
  let r = 0;
  for (const [limit, rate] of SURCHARGE) { if (income > limit) continue; r = rate; break; }
  if (income > 50_000_000) r = 0.37;
  return regime === 'new' ? Math.min(r, 0.25) : r;
}

export interface TaxBreakdown {
  regime: Regime;
  gross: number;
  deductions: number;
  taxable: number;
  slabTax: number;
  rebate: number;
  surcharge: number;
  cess: number;
  total: number;
  effectiveRate: number;
  slabs: { from: number; to: number; rate: number; tax: number }[];
}

export function computeTax(gross: number, deductions: number, regime: Regime, age: AgeGroup = 'below60'): TaxBreakdown {
  const taxable = Math.max(0, Math.floor(gross - deductions));
  const slabs = regime === 'new' ? NEW_SLABS : oldSlabs(age);
  const base = slabTax(taxable, slabs);

  // Section 87A rebate (resident individuals) with marginal relief in the new regime.
  let rebate = 0;
  if (regime === 'new') {
    if (taxable <= 1_200_000) rebate = Math.min(base, 60_000);
    else if (base > taxable - 1_200_000) rebate = base - (taxable - 1_200_000); // marginal relief
  } else if (taxable <= 500_000) rebate = Math.min(base, 12_500);
  const afterRebate = Math.max(0, base - rebate);

  // Surcharge with marginal relief at each threshold.
  let surcharge = 0;
  const rate = surchargeRate(taxable, regime);
  if (rate > 0) {
    surcharge = afterRebate * rate;
    const thresholds = SURCHARGE.map(s => s[0]).filter(t => t < taxable && Number.isFinite(t));
    const t = thresholds[thresholds.length - 1];
    if (t) {
      const atT = slabTax(t, slabs);
      const atTWith = atT * (1 + surchargeRate(t, regime));
      const maxAllowed = atTWith + (taxable - t);
      if (afterRebate + surcharge > maxAllowed) surcharge = Math.max(0, maxAllowed - afterRebate);
    }
  }
  const cess = (afterRebate + surcharge) * 0.04;
  const total = Math.round(afterRebate + surcharge + cess);

  const rows: TaxBreakdown['slabs'] = [];
  let prev = 0;
  for (const [limit, r] of slabs) {
    if (taxable <= prev) break;
    const upto = Math.min(taxable, limit);
    rows.push({ from: prev, to: limit, rate: r, tax: (upto - prev) * r });
    prev = limit;
  }

  return {
    regime, gross, deductions, taxable, slabTax: base, rebate, surcharge, cess, total,
    effectiveRate: gross > 0 ? total / gross : 0, slabs: rows,
  };
}

/** Old-regime deduction caps. */
export const CAPS = { sec80C: 150_000, sec80CCD1B: 50_000, homeLoanInterest: 200_000 };
