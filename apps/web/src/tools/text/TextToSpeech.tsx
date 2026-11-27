'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Button, ErrorNote, Label, Panel, Select, TextArea } from '@/components/tool/ui';

/** Split long text into sentence-sized chunks: some browsers silently stop
 *  speaking a single utterance after ~15 seconds. */
function chunk(text: string, max = 220): string[] {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?。！？]+[.!?。！？]*\s*/g) ?? [];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { out.push(cur.trim()); cur = ''; }
    if (s.length > max) {
      for (const piece of s.match(new RegExp(`.{1,${max}}(\\s|$)`, 'g')) ?? [s]) out.push(piece.trim());
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

type Status = 'idle' | 'speaking' | 'paused';

export default function TextToSpeech() {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState('Hello! Paste or type any text here and press Play to hear it read aloud.');
  const [status, setStatus] = useState<Status>('idle');
  const runId = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { setSupported(false); return; }
    const synth = window.speechSynthesis;
    const load = () => {
      const list = synth.getVoices().slice().sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
      setVoices(list);
      setVoiceURI(cur => {
        if (cur && list.some(v => v.voiceURI === cur)) return cur;
        const lang = navigator.language.toLowerCase();
        return (list.find(v => v.lang.toLowerCase() === lang) ?? list.find(v => v.lang.toLowerCase().startsWith(lang.slice(0, 2))) ?? list.find(v => v.default) ?? list[0])?.voiceURI ?? '';
      });
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => { synth.removeEventListener('voiceschanged', load); synth.cancel(); };
  }, []);

  function play() {
    const synth = window.speechSynthesis;
    if (status === 'paused') { synth.resume(); setStatus('speaking'); return; }
    synth.cancel();
    const parts = chunk(text);
    if (!parts.length) return;
    const voice = voices.find(v => v.voiceURI === voiceURI);
    const id = ++runId.current;
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = rate;
      u.pitch = pitch;
      if (i === parts.length - 1) u.onend = () => { if (runId.current === id) setStatus('idle'); };
      u.onerror = e => { if (runId.current === id && e.error !== 'interrupted' && e.error !== 'canceled') setStatus('idle'); };
      synth.speak(u);
    });
    setStatus('speaking');
  }

  function pause() { window.speechSynthesis.pause(); setStatus('paused'); }
  function stop() { runId.current++; window.speechSynthesis.cancel(); setStatus('idle'); }

  if (!supported) return <ErrorNote>Your browser doesn’t support speech synthesis. Try the latest Chrome, Edge, Safari or Firefox.</ErrorNote>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div>
        <TextArea rows={14} value={text} onChange={e => setText(e.target.value)} aria-label="Text to read" placeholder="Type or paste text…" className="text-[15px]" />
        <div className="flex flex-wrap gap-2 mt-3">
          {status === 'speaking'
            ? <Button onClick={pause}><Pause className="w-4 h-4" /> Pause</Button>
            : <Button onClick={play} disabled={!text.trim()}><Play className="w-4 h-4" /> {status === 'paused' ? 'Resume' : 'Play'}</Button>}
          <Button variant="secondary" onClick={stop} disabled={status === 'idle'}><Square className="w-4 h-4" /> Stop</Button>
        </div>
      </div>
      <Panel className="space-y-5 h-fit">
        <div>
          <Label htmlFor="voice">Voice</Label>
          <Select id="voice" value={voiceURI} onChange={e => setVoiceURI(e.target.value)} disabled={!voices.length}>
            {!voices.length && <option>Loading voices…</option>}
            {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang}){v.localService ? '' : ' · online'}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="rate">Speed · {rate.toFixed(1)}×</Label>
          <input id="rate" type="range" min={0.5} max={2} step={0.1} value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
        <div>
          <Label htmlFor="pitch">Pitch · {pitch.toFixed(1)}</Label>
          <input id="pitch" type="range" min={0} max={2} step={0.1} value={pitch} onChange={e => setPitch(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
        <p className="text-xs text-slate-400">Speed and pitch changes apply the next time you press Play.</p>
      </Panel>
    </div>
  );
}
