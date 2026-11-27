'use client';

/**
 * Runs user-supplied regular expressions in a Web Worker with a timeout,
 * so a catastrophic-backtracking pattern can't freeze the page.
 */
import { useCallback, useEffect, useRef } from 'react';

export interface RegexMatch {
  index: number;
  text: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined> | null;
}

const WORKER_SRC = `
function advance(s, i, unicode) {
  if (!unicode || i + 1 >= s.length) return i + 1;
  var c = s.charCodeAt(i);
  if (c >= 0xd800 && c <= 0xdbff) { var d = s.charCodeAt(i + 1); if (d >= 0xdc00 && d <= 0xdfff) return i + 2; }
  return i + 1;
}
self.onmessage = function (e) {
  var msg = e.data;
  try {
    var re = new RegExp(msg.pattern, msg.flags);
    if (msg.op === 'match') {
      var out = [];
      var global = re.global || re.sticky;
      var m;
      while ((m = re.exec(msg.text)) !== null) {
        out.push({ index: m.index, text: m[0], groups: Array.prototype.slice.call(m, 1), named: m.groups ? Object.assign({}, m.groups) : null });
        if (!global || out.length >= msg.limit) break;
        if (m[0] === '') re.lastIndex = advance(msg.text, re.lastIndex, re.unicode);
      }
      self.postMessage({ id: msg.id, ok: true, matches: out, truncated: global && out.length >= msg.limit });
    } else {
      var counter = new RegExp(msg.pattern, msg.flags.indexOf('g') >= 0 ? msg.flags : msg.flags + 'g');
      var count = (msg.text.match(counter) || []).length;
      self.postMessage({ id: msg.id, ok: true, result: msg.text.replace(re, msg.replacement), count: re.global ? count : Math.min(count, 1) });
    }
  } catch (err) {
    self.postMessage({ id: msg.id, ok: false, error: (err && err.message) || String(err) });
  }
};
`;

export class RegexTimeoutError extends Error {
  constructor() { super('The pattern took too long to run (possible catastrophic backtracking).'); }
}

function createRunner(timeoutMs: number) {
  let worker: Worker | null = null;
  let url: string | null = null;
  let seq = 0;

  const ensure = () => {
    if (!worker) {
      url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
      worker = new Worker(url);
    }
    return worker;
  };
  const kill = () => {
    worker?.terminate();
    worker = null;
    if (url) URL.revokeObjectURL(url);
    url = null;
  };

  function send<T>(payload: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const w = ensure();
      const id = ++seq;
      const timer = setTimeout(() => { w.removeEventListener('message', onMsg); kill(); reject(new RegexTimeoutError()); }, timeoutMs);
      function onMsg(e: MessageEvent) {
        if (e.data.id !== id) return;
        clearTimeout(timer);
        w.removeEventListener('message', onMsg);
        if (e.data.ok) resolve(e.data as T);
        else reject(new Error(e.data.error));
      }
      w.addEventListener('message', onMsg);
      w.postMessage({ ...payload, id });
    });
  }

  return {
    match: (pattern: string, flags: string, text: string, limit = 1000) =>
      send<{ matches: RegexMatch[]; truncated: boolean }>({ op: 'match', pattern, flags, text, limit }),
    replace: (pattern: string, flags: string, text: string, replacement: string) =>
      send<{ result: string; count: number }>({ op: 'replace', pattern, flags, text, replacement }),
    dispose: kill,
  };
}

export type RegexRunner = ReturnType<typeof createRunner>;

/** One worker per component; terminated on unmount. The returned getter is
 *  stable, so it is safe to list in effect dependencies. */
export function useRegexRunner(timeoutMs = 1500) {
  const ref = useRef<RegexRunner | null>(null);
  useEffect(() => () => { ref.current?.dispose(); ref.current = null; }, []);
  return useCallback(() => (ref.current ??= createRunner(timeoutMs)), [timeoutMs]);
}

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}
