'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Download, Loader2, RotateCcw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, CopyButton, ErrorNote, FileDrop, Panel, Segmented, Select, Stat, TextInput } from '@/components/tool/ui';
import { downloadText, useNumberFormat } from '@/lib/tool-helpers';
import { isZip, listZip, readZipText } from '@/lib/zip';

interface Account { username: string; at?: number }
type ListKind = 'followers' | 'following' | 'pending' | 'unfollowed';

const KIND_OF = (path: string): ListKind | null => {
  const name = path.split('/').pop()!.toLowerCase();
  if (/^followers(?:_\d+)?\.(json|html)$/.test(name)) return 'followers';
  if (/^following\.(json|html)$/.test(name)) return 'following';
  if (/^pending_follow_requests\.(json|html)$/.test(name)) return 'pending';
  if (/^recently_unfollowed_(?:profiles|accounts)\.(json|html)$/.test(name)) return 'unfollowed';
  return null;
};

function userFromHref(href?: string): string | undefined {
  if (!href) return;
  const m = /instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)/.exec(href);
  return m?.[1];
}

/** Pull every account out of an Instagram export file, JSON or HTML. */
function extract(text: string, path: string): Account[] {
  const out: Account[] = [];
  if (/\.json$/i.test(path)) {
    let data: unknown;
    try { data = JSON.parse(text); } catch { return out; }
    const walk = (v: unknown) => {
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (!v || typeof v !== 'object') return;
      const o = v as Record<string, unknown>;
      if (Array.isArray(o.string_list_data)) {
        const s = (o.string_list_data[0] ?? {}) as { href?: string; value?: string; timestamp?: number };
        const username = s.value || (typeof o.title === 'string' && o.title) || userFromHref(s.href);
        if (username) out.push({ username: String(username), at: s.timestamp ? s.timestamp * 1000 : undefined });
        return;
      }
      Object.values(o).forEach(walk);
    };
    walk(data);
  } else {
    const re = /href="https?:\/\/(?:www\.)?instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)\/?"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) out.push({ username: m[1] });
  }
  return out;
}

type Lists = Record<ListKind, Map<string, Account>>;

async function readExport(files: File[]): Promise<Lists> {
  const lists: Lists = { followers: new Map(), following: new Map(), pending: new Map(), unfollowed: new Map() };
  const add = (kind: ListKind, accounts: Account[]) => {
    for (const a of accounts) {
      const key = a.username.toLowerCase();
      if (!lists[kind].has(key)) lists[kind].set(key, a);
    }
  };
  for (const f of files) {
    if (isZip(f)) {
      const entries = await listZip(f);
      for (const e of entries) {
        const kind = KIND_OF(e.name);
        if (kind) add(kind, extract(await readZipText(f, e), e.name));
      }
    } else {
      const kind = KIND_OF(f.name) ?? (/follower/i.test(f.name) ? 'followers' : /following/i.test(f.name) ? 'following' : null);
      if (kind) add(kind, extract(await f.text(), f.name));
    }
  }
  return lists;
}

type Tab = 'notBack' | 'fans' | 'mutual' | 'pending' | 'unfollowed';
type Sort = 'recent' | 'oldest' | 'az';

export default function InstagramUnfollowers() {
  const { fmt } = useNumberFormat();
  const [lists, setLists] = useState<Lists | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('notBack');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [done, setDone] = useState<Set<string>>(new Set());

  async function onFiles(files: File[]) {
    setBusy(true); setError(''); setLists(null); setDone(new Set());
    try {
      const l = await readExport(files);
      if (!l.followers.size && !l.following.size) {
        throw new Error('No followers or following lists found. Choose the ZIP from Instagram’s “Download your information”, or the followers_1 and following files inside it.');
      }
      if (!l.followers.size) throw new Error('Found your following list but not your followers. Add the followers_1 file too (and followers_2… if there are more).');
      if (!l.following.size) throw new Error('Found your followers but not the following file. Add following.json (or following.html) too.');
      setLists(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read these files.');
    } finally {
      setBusy(false);
    }
  }

  const groups = useMemo(() => {
    if (!lists) return null;
    const { followers, following } = lists;
    const notBack = [...following.entries()].filter(([k]) => !followers.has(k)).map(([, a]) => a);
    const fans = [...followers.entries()].filter(([k]) => !following.has(k)).map(([, a]) => a);
    const mutual = [...following.entries()].filter(([k]) => followers.has(k)).map(([, a]) => a);
    return { notBack, fans, mutual, pending: [...lists.pending.values()], unfollowed: [...lists.unfollowed.values()] };
  }, [lists]);

  const shown = useMemo(() => {
    if (!groups) return [];
    const needle = q.trim().toLowerCase().replace(/^@/, '');
    const list = groups[tab].filter(a => !needle || a.username.toLowerCase().includes(needle));
    return [...list].sort((a, b) =>
      sort === 'az' ? a.username.localeCompare(b.username)
        : sort === 'recent' ? (b.at ?? 0) - (a.at ?? 0)
          : (a.at ?? Infinity) - (b.at ?? Infinity));
  }, [groups, tab, q, sort]);

  if (!lists || !groups) {
    return (
      <div className="space-y-5">
        <FileDrop
          onFiles={onFiles} multiple accept=".zip,.json,.html,application/zip,application/json,text/html"
          label="Choose your Instagram data"
          hint="The ZIP from Instagram, or the followers_1 + following files · never uploaded"
        />
        {busy && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Reading your export…</p>}
        {error && <ErrorNote>{error}</ErrorNote>}
        <Panel>
          <h2 className="font-semibold text-slate-900 mb-3">Get your followers list from Instagram (free, official)</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600">
            <li>In the Instagram app, go to your profile and tap <b>☰</b> → <b>Accounts Center</b>.</li>
            <li>Tap <b>Your information and permissions</b> → <b>Download your information</b>.</li>
            <li>Tap <b>Download or transfer information</b>, pick your account, then <b>Some of your information</b>.</li>
            <li>Tick only <b>Followers and following</b> and choose <b>Download to device</b>.</li>
            <li>Set <b>Date range: All time</b> and <b>Format: JSON</b>, then <b>Create files</b>.</li>
            <li>Instagram emails you when it’s ready (usually minutes). Download the ZIP and drop it above.</li>
          </ol>
          <p className="text-xs text-slate-500 mt-3">You never give this page your password. Apps that ask for your Instagram login to “check unfollowers” can get your account locked.</p>
        </Panel>
      </div>
    );
  }

  const tabs: { value: Tab; label: string; n: number }[] = [
    { value: 'notBack', label: 'Don’t follow you back', n: groups.notBack.length },
    { value: 'fans', label: 'You don’t follow back', n: groups.fans.length },
    { value: 'mutual', label: 'Mutuals', n: groups.mutual.length },
    ...(groups.pending.length ? [{ value: 'pending' as Tab, label: 'Pending requests', n: groups.pending.length }] : []),
    ...(groups.unfollowed.length ? [{ value: 'unfollowed' as Tab, label: 'You unfollowed', n: groups.unfollowed.length }] : []),
  ];
  const hasDates = groups[tab].some(a => a.at);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat highlight label="Don’t follow you back" value={fmt(groups.notBack.length)} />
        <Stat label="Followers" value={fmt(lists.followers.size)} />
        <Stat label="Following" value={fmt(lists.following.size)} />
        <Stat label="Mutuals" value={fmt(groups.mutual.length)} sub={`${Math.round((groups.mutual.length / Math.max(1, lists.following.size)) * 100)}% of who you follow`} />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Segmented size="sm" value={tab} onChange={v => { setTab(v); setQ(''); }}
            options={tabs.map(t => ({ value: t.value, label: <>{t.label} <span className="opacity-60 tabular-nums">{fmt(t.n)}</span></> }))} />
          <Button variant="ghost" className="ml-auto" onClick={() => { setLists(null); setError(''); }}><RotateCcw className="w-4 h-4" /> New export</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <TextInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search username" className="pl-9" />
          </div>
          {hasDates && (
            <Select value={sort} onChange={e => setSort(e.target.value as Sort)} className="w-auto" aria-label="Sort">
              <option value="recent">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A–Z</option>
            </Select>
          )}
          <CopyButton text={shown.map(a => a.username).join('\n')} label="Copy" />
          <Button variant="secondary" disabled={!shown.length}
            onClick={() => downloadText(`instagram-${tab}.csv`, 'username,profile,date\n' + shown.map(a =>
              `${a.username},https://www.instagram.com/${a.username}/,${a.at ? new Date(a.at).toISOString().slice(0, 10) : ''}`).join('\n'), 'text/csv')}>
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>

        {tab === 'notBack' && shown.length > 0 && (
          <p className="text-xs text-slate-500 mb-3">Tick people off as you go. Open a profile, unfollow in Instagram, come back. Ticks aren’t saved after you leave.</p>
        )}

        {shown.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">{q ? 'No matches.' : tab === 'notBack' ? 'Everyone you follow follows you back. 🎉' : 'Nobody here.'}</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[32rem] overflow-y-auto -mx-2">
            {shown.slice(0, 2000).map(a => {
              const key = a.username.toLowerCase();
              const isDone = done.has(key);
              return (
                <li key={key} className="flex items-center gap-3 px-2 py-2">
                  <input type="checkbox" checked={isDone} aria-label={`Mark ${a.username} done`}
                    onChange={() => setDone(s => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                    className="w-5 h-5 sm:w-4 sm:h-4 accent-brand-600 shrink-0" />
                  <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                    {a.username.replace(/[^a-z0-9]/gi, '').slice(0, 2) || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-sm font-medium truncate', isDone ? 'text-slate-400 line-through' : 'text-slate-900')}>@{a.username}</div>
                    {a.at && <div className="text-xs text-slate-400">{tab === 'fans' ? 'followed you' : 'since'} {new Date(a.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  </div>
                  <a href={`https://www.instagram.com/${a.username}/`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 px-2 py-1.5 rounded-lg hover:bg-brand-50 shrink-0">
                    Open <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        {shown.length > 2000 && <p className="text-xs text-slate-400 mt-2">Showing the first 2,000. Search or download the CSV to see everyone.</p>}
      </Panel>
    </div>
  );
}
