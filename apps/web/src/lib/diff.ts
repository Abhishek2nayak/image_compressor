/**
 * Line diff using Myers' O(ND) algorithm.
 * Common prefix/suffix are trimmed first, and the search gives up after
 * `maxEdits` edits so wildly different inputs can't exhaust memory.
 */

export type DiffLine =
  | { type: 'equal'; text: string; aLine: number; bLine: number }
  | { type: 'delete'; text: string; aLine: number }
  | { type: 'insert'; text: string; bLine: number };

export interface DiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  maxEdits?: number;
}

type Op = { t: '='; a: number; b: number } | { t: '-'; a: number } | { t: '+'; b: number };

function myers(a: string[], b: string[], maxD: number): Op[] | null {
  const n = a.length;
  const m = b.length;
  if (n === 0) return b.map((_, j) => ({ t: '+', b: j }));
  if (m === 0) return a.map((_, i) => ({ t: '-', a: i }));

  const max = n + m;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  // trace[d] = v[-d-1 .. d+1] as it was before step d
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d++) {
    if (d > maxD) return null;
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) return backtrack(trace, n, m);
    }
  }
  return null;
}

function backtrack(trace: Int32Array[], n: number, m: number): Op[] {
  const out: Op[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const snap = trace[d];
    const g = (k: number) => snap[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && g(k - 1) < g(k + 1)) ? k + 1 : k - 1;
    const prevX = g(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      out.push({ t: '=', a: x - 1, b: y - 1 });
      x--; y--;
    }
    if (d > 0) out.push(x === prevX ? { t: '+', b: y - 1 } : { t: '-', a: x - 1 });
    x = prevX;
    y = prevY;
  }
  return out.reverse();
}

/** Returns null if the inputs differ by more than `maxEdits` lines. */
export function diffLines(aText: string, bText: string, opts: DiffOptions = {}): DiffLine[] | null {
  const a = aText.split(/\r?\n/);
  const b = bText.split(/\r?\n/);
  const norm = (s: string) => {
    let t = s;
    if (opts.ignoreWhitespace) t = t.replace(/\s+/g, ' ').trim();
    if (opts.ignoreCase) t = t.toLowerCase();
    return t;
  };
  const ka = a.map(norm);
  const kb = b.map(norm);

  let start = 0;
  while (start < ka.length && start < kb.length && ka[start] === kb[start]) start++;
  let endA = ka.length;
  let endB = kb.length;
  while (endA > start && endB > start && ka[endA - 1] === kb[endB - 1]) { endA--; endB--; }

  const middle = myers(ka.slice(start, endA), kb.slice(start, endB), opts.maxEdits ?? 3000);
  if (!middle) return null;

  const out: DiffLine[] = [];
  for (let i = 0; i < start; i++) out.push({ type: 'equal', text: b[i], aLine: i + 1, bLine: i + 1 });
  for (const op of middle) {
    if (op.t === '=') out.push({ type: 'equal', text: b[start + op.b], aLine: start + op.a + 1, bLine: start + op.b + 1 });
    else if (op.t === '-') out.push({ type: 'delete', text: a[start + op.a], aLine: start + op.a + 1 });
    else out.push({ type: 'insert', text: b[start + op.b], bLine: start + op.b + 1 });
  }
  for (let i = 0; i < ka.length - endA; i++) {
    out.push({ type: 'equal', text: b[endB + i], aLine: endA + i + 1, bLine: endB + i + 1 });
  }
  return out;
}
