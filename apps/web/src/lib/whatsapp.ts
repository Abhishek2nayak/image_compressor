/**
 * WhatsApp "Export chat" parser and stats.
 *
 * Handles the Android format   `31/12/23, 9:41 pm - Name: text`
 * and the iPhone format        `[31/12/23, 9:41:05 PM] Name: text`
 * in any day/month order, 2- or 4-digit years, 12/24-hour clocks and the
 * invisible characters WhatsApp sprinkles in (U+200E, U+202F, NBSP).
 */

export interface ChatMessage {
  at: Date;
  author: string;
  text: string;
  media: boolean;
  deleted: boolean;
}

const HEADER =
  /^\[?(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\]?\s*(?:[-–]\s*)?(.*)$/;

const MEDIA = /^(?:<Media omitted>|<attached: .*>|(?:image|video|audio|sticker|GIF|document|Contact card) omitted|.*\(file attached\)|.* document omitted)$/i;
const DELETED = /^(?:This message was deleted\.?|You deleted this message\.?|This message was deleted by admin.*)$/i;

function clean(line: string) {
  return line.replace(/[‎‏‪-‮⁦-⁩]/g, '').replace(/[  ]/g, ' ');
}

/** Decide day/month order from the dates in the file itself. */
function detectOrder(heads: [number, number, number][]): 'dmy' | 'mdy' | 'ymd' {
  let firstOver12 = false, secondOver12 = false;
  for (const [a, b] of heads) {
    if (a > 31) return 'ymd';
    if (a > 12) firstOver12 = true;
    if (b > 12) secondOver12 = true;
  }
  if (secondOver12 && !firstOver12) return 'mdy';
  return 'dmy';
}

export function parseChat(raw: string): ChatMessage[] {
  const lines = raw.split(/\r?\n/);
  type Pending = { parts: [number, number, number]; h: number; m: number; s: number; ampm?: string; rest: string };
  const parsed: (Pending | string)[] = [];

  for (const original of lines) {
    const line = clean(original);
    const m = HEADER.exec(line);
    if (m && m[8] !== undefined) {
      parsed.push({
        parts: [Number(m[1]), Number(m[2]), Number(m[3])],
        h: Number(m[4]), m: Number(m[5]), s: Number(m[6] ?? 0), ampm: m[7], rest: m[8],
      });
    } else {
      parsed.push(line);
    }
  }

  const order = detectOrder(parsed.filter((p): p is Pending => typeof p !== 'string').map(p => p.parts));
  const out: ChatMessage[] = [];
  let last: ChatMessage | null = null;

  for (const p of parsed) {
    if (typeof p === 'string') {
      if (last && p.length) last.text += '\n' + p;
      continue;
    }
    const [a, b, c] = p.parts;
    let day: number, month: number, year: number;
    if (order === 'ymd') { year = a; month = b; day = c; }
    else if (order === 'mdy') { month = a; day = b; year = c; }
    else { day = a; month = b; year = c; }
    if (year < 100) year += 2000;

    let hour = p.h;
    if (p.ampm) {
      const pm = /p/i.test(p.ampm);
      if (pm && hour < 12) hour += 12;
      if (!pm && hour === 12) hour = 0;
    }
    const at = new Date(year, month - 1, day, hour, p.m, p.s);
    if (Number.isNaN(at.getTime())) { last = null; continue; }

    // "Name: text" — system lines ("X added Y", encryption notice) have no colon-space.
    const sep = p.rest.indexOf(': ');
    if (sep <= 0) { last = null; continue; }
    const author = p.rest.slice(0, sep).trim();
    const text = p.rest.slice(sep + 2).replace(/\s*<This message was edited>$/, '');
    if (!author || author.length > 60) { last = null; continue; }

    const msg: ChatMessage = {
      at, author, text,
      media: MEDIA.test(text.trim()),
      deleted: DELETED.test(text.trim()),
    };
    out.push(msg);
    last = msg;
  }
  return out;
}

// ───────────────────────────── Stats ─────────────────────────────

const EMOJI = /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*/gu;
const LAUGH = /(?:\b(?:a?ha(?:ha)+h*|he(?:he)+|lol+|lmao+|rofl|hihi+)\b|😂|🤣|😆|😹)/gi;
const LOVE = /(?:\b(?:love (?:you|u)|luv (?:you|u)|i love|miss (?:you|u)|ily)\b|❤️|❤|😘|🥰|😍|💕|💖|💗)/gi;
const SORRY = /\b(?:sorry|sry|sowwy|maaf|maafi)\b/gi;
const LINK = /https?:\/\/\S+/g;

const STOP = new Set((
  // English
  'the a an and or but if so to of in on at for with from by is am are was were be been being it its this that these those ' +
  'i me my mine you your yours u ur he him his she her we us our they them their what which who whom when where why how ' +
  'do does did doing done have has had not no yes yeah yea ok okay okk k kk hmm hm oh ah ya yup nope just also too very ' +
  'can could will would shall should may might must there here then than now up down out about into over all any some ' +
  'one get got go going gonna wanna like dont im its thats youre ill ive cant wont didnt doesnt isnt wasnt na nah ' +
  'media omitted message deleted edited null http https www com ' +
  // Hinglish / Hindi (romanised)
  'hai hain ha haan han ho hoga hogi tha thi the ka ki ke ko se me mein main mai mera meri mere tera teri tere tu tum ' +
  'aap ap apna apni hum ham wo woh vo ye yeh yah kya kyu kyun kaise kab kaha kahan nahi nhi nahin na mat bhi to toh ' +
  'aur or par pe hi ek bas abhi kar karo kr karna kiya kia raha rahi rahe rha rhi h hn acha accha achha thik theek sahi'
).split(/\s+/));

export interface PersonStats {
  name: string;
  messages: number;
  words: number;
  media: number;
  deleted: number;
  emojis: number;
  laughs: number;
  love: number;
  sorry: number;
  nightMessages: number;
  starts: number;
  medianReplyMs: number | null;
  longestMessage: number;
  topEmojis: [string, number][];
}

export interface ChatStats {
  total: number;
  first: Date;
  last: Date;
  daySpan: number;
  activeDays: number;
  longestStreak: number;
  busiestDay: { date: Date; count: number };
  byHour: number[];
  byWeekday: number[];
  byMonth: { key: string; label: string; count: number }[];
  people: PersonStats[];
  topEmojis: [string, number][];
  topWords: [string, number][];
  links: number;
  media: number;
  longestSilenceDays: number;
}

/** One key per emoji: drop variation selectors, then re-add one to single
 *  text-default symbols (❤ → ❤️) so they render in colour. */
function normEmoji(e: string) {
  const k = e.replace(/\uFE0F/g, '');
  return Array.from(k).length === 1 && !/\p{Emoji_Presentation}/u.test(k) ? k + '\uFE0F' : k;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const inc = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
const count = (re: RegExp, s: string) => (s.match(re) ?? []).length;

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** A new conversation starts after this much silence. */
const CONVO_GAP = 4 * 3600_000;
/** Replies slower than this aren't counted toward reply time. */
const REPLY_CAP = 12 * 3600_000;

export function computeStats(msgs: ChatMessage[], dateRange?: { from?: Date; to?: Date }): ChatStats | null {
  const list = msgs.filter(m =>
    (!dateRange?.from || m.at >= dateRange.from) && (!dateRange?.to || m.at <= dateRange.to));
  if (!list.length) return null;
  list.sort((a, b) => a.at.getTime() - b.at.getTime());

  const people = new Map<string, PersonStats & { _emoji: Map<string, number>; _replies: number[] }>();
  const person = (name: string) => {
    let p = people.get(name);
    if (!p) {
      p = { name, messages: 0, words: 0, media: 0, deleted: 0, emojis: 0, laughs: 0, love: 0, sorry: 0, nightMessages: 0,
        starts: 0, medianReplyMs: null, longestMessage: 0, topEmojis: [], _emoji: new Map(), _replies: [] };
      people.set(name, p);
    }
    return p;
  };

  const byHour = Array(24).fill(0);
  const byWeekday = Array(7).fill(0);
  const byDay = new Map<string, { date: Date; count: number }>();
  const byMonth = new Map<string, { key: string; label: string; count: number; t: number }>();
  const emojis = new Map<string, number>();
  const words = new Map<string, number>();
  let links = 0, media = 0;
  let prev: ChatMessage | null = null;

  for (const m of list) {
    const p = person(m.author);
    p.messages++;
    byHour[m.at.getHours()]++;
    byWeekday[m.at.getDay()]++;
    if (m.at.getHours() < 5) p.nightMessages++;

    const dk = dayKey(m.at);
    const d = byDay.get(dk);
    if (d) d.count++; else byDay.set(dk, { date: new Date(m.at.getFullYear(), m.at.getMonth(), m.at.getDate()), count: 1 });

    const mk = `${m.at.getFullYear()}-${String(m.at.getMonth() + 1).padStart(2, '0')}`;
    const mo = byMonth.get(mk);
    if (mo) mo.count++;
    else byMonth.set(mk, { key: mk, count: 1, t: new Date(m.at.getFullYear(), m.at.getMonth(), 1).getTime(),
      label: new Date(m.at.getFullYear(), m.at.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });

    if (!prev || m.at.getTime() - prev.at.getTime() > CONVO_GAP) p.starts++;
    else if (prev.author !== m.author) {
      const gap = m.at.getTime() - prev.at.getTime();
      if (gap <= REPLY_CAP) p._replies.push(gap);
    }
    prev = m;

    if (m.media) { p.media++; media++; continue; }
    if (m.deleted) { p.deleted++; continue; }

    const t = m.text;
    links += count(LINK, t);
    p.laughs += count(LAUGH, t);
    p.love += count(LOVE, t);
    p.sorry += count(SORRY, t);
    for (const e of t.match(EMOJI) ?? []) {
      const k = normEmoji(e);
      inc(emojis, k); inc(p._emoji, k); p.emojis++;
    }
    const ws = t.replace(LINK, ' ').toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
    p.words += ws.length;
    p.longestMessage = Math.max(p.longestMessage, ws.length);
    for (const w of ws) {
      const word = w.replace(/^'+|'+$/g, '');
      if (word.length < 3 || STOP.has(word) || /^\d+$/.test(word)) continue;
      inc(words, word);
    }
  }

  // Streaks and silences over calendar days.
  const days = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  let longestStreak = 1, streak = 1, longestSilenceDays = 0;
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round((Date.UTC(days[i].date.getFullYear(), days[i].date.getMonth(), days[i].date.getDate())
      - Date.UTC(days[i - 1].date.getFullYear(), days[i - 1].date.getMonth(), days[i - 1].date.getDate())) / 86_400_000);
    if (gap === 1) { streak++; longestStreak = Math.max(longestStreak, streak); }
    else { streak = 1; longestSilenceDays = Math.max(longestSilenceDays, gap - 1); }
  }
  const busiestDay = days.reduce((a, b) => (b.count > a.count ? b : a));
  const first = list[0].at, last = list[list.length - 1].at;

  const ppl: PersonStats[] = [...people.values()]
    .map(({ _emoji, _replies, ...p }) => ({ ...p, topEmojis: top(_emoji, 5), medianReplyMs: median(_replies) }))
    .sort((a, b) => b.messages - a.messages);

  return {
    total: list.length,
    first, last,
    daySpan: Math.round((Date.UTC(last.getFullYear(), last.getMonth(), last.getDate())
      - Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86_400_000) + 1,
    activeDays: days.length,
    longestStreak: days.length ? longestStreak : 0,
    busiestDay,
    byHour, byWeekday,
    byMonth: [...byMonth.values()].sort((a, b) => a.t - b.t).map(({ t: _t, ...m }) => m),
    people: ppl,
    topEmojis: top(emojis, 10),
    topWords: top(words, 20),
    links, media,
    longestSilenceDays,
  };
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
