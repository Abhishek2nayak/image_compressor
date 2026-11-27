'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Pencil, Save, Trash2 } from 'lucide-react';
import { Button, CopyButton, Label, Panel, Select, TextArea, TextInput } from '@/components/tool/ui';

interface Template { id: string; name: string; group: string; text: string; custom?: boolean }

/** `{{Field}}` is a one-line field, `{{Field:long}}` a paragraph field, `{{Field|a|b}}` a choice. */
const BUILT_IN: Template[] = [
  { id: 'email', group: 'Writing', name: 'Write an email', text: 'Write a {{Tone|friendly|professional|formal|apologetic|persuasive}} email to {{Recipient}} about {{Topic}}.\n\nKey points to include:\n{{Key points:long}}\n\nKeep it under {{Length|100|150|250}} words, with a clear subject line and a polite sign-off.' },
  { id: 'rewrite', group: 'Writing', name: 'Rewrite in a different tone', text: 'Rewrite the text below so it sounds {{Tone|more professional|simpler and clearer|more friendly|more confident|shorter}}. Keep the meaning and all facts the same. Do not add new information.\n\nText:\n"""\n{{Text:long}}\n"""' },
  { id: 'summary', group: 'Writing', name: 'Summarise a document', text: 'Summarise the following {{Type|article|report|meeting transcript|email thread|research paper}} for {{Audience|a busy manager|a student|a beginner|my team}}.\n\nGive me:\n1. A one-sentence summary\n2. {{Number|3|5|7}} key points as bullets\n3. Any action items or decisions\n\n"""\n{{Text:long}}\n"""' },
  { id: 'social', group: 'Content', name: 'Social media post', text: 'Write {{Number|3|5}} different {{Platform|LinkedIn|Instagram|X (Twitter)|Facebook}} posts about {{Topic}}.\n\nAudience: {{Audience}}\nGoal: {{Goal|get engagement|drive clicks|announce something|share a lesson}}\nTone: {{Tone|conversational|professional|witty|inspiring}}\n\nStart each with a strong hook, keep within the platform’s length limit and suggest 3–5 relevant hashtags.' },
  { id: 'blog', group: 'Content', name: 'Blog post outline', text: 'Create a detailed outline for a blog post titled "{{Title}}" for {{Audience}}.\n\nInclude an engaging introduction, {{Sections|4|6|8}} sections with H2 headings and 2–3 bullet points each, a conclusion and a call to action. Target keyword: {{Keyword}}.' },
  { id: 'youtube', group: 'Content', name: 'YouTube video script', text: 'Write a {{Length|60-second|5-minute|10-minute}} YouTube script about {{Topic}} for {{Audience}}.\n\nStructure: a hook in the first 5 seconds, the main content broken into clear sections, and an ending that asks viewers to subscribe. Use simple spoken language and add [B-roll] notes where visuals would help.' },
  { id: 'explain', group: 'Learning', name: 'Explain a concept simply', text: 'Explain {{Concept}} as if I am {{Level|10 years old|a complete beginner|a high-school student|a university student}}.\n\nUse one everyday analogy, a short example, and finish with 3 quick questions to check my understanding.' },
  { id: 'notes', group: 'Learning', name: 'Study notes and quiz', text: 'Turn the material below into revision notes for {{Exam}}.\n\n1. Short, clear notes with headings and bullet points\n2. Key terms with one-line definitions\n3. {{Number|5|10|15}} multiple-choice questions with answers at the end\n\nMaterial:\n"""\n{{Material:long}}\n"""' },
  { id: 'interview', group: 'Career', name: 'Interview practice', text: 'Act as an interviewer for a {{Role}} position at {{Company type|a startup|a large company|a government organisation|an agency}}. My experience: {{Experience}}.\n\nAsk me one question at a time — a mix of behavioural and technical questions. After each answer, give brief feedback and a better sample answer, then ask the next question.' },
  { id: 'resume', group: 'Career', name: 'Resume bullet points', text: 'Rewrite these job duties as {{Number|3|5}} strong resume bullet points for a {{Role}} role. Start each with an action verb, include numbers or results where possible and keep each under 25 words.\n\nDuties:\n{{Duties:long}}' },
  { id: 'product', group: 'Business', name: 'Product description', text: 'Write a product description for {{Product}}, sold on {{Channel|my website|Amazon|Flipkart|Instagram}}.\n\nTarget customer: {{Customer}}\nKey features:\n{{Features:long}}\n\nGive a catchy title, a 2-sentence summary, 5 benefit-focused bullet points and a short closing line.' },
  { id: 'image', group: 'Images', name: 'AI image prompt', text: 'A {{Style|photorealistic photo|digital illustration|watercolour painting|3D render|anime-style artwork|flat vector illustration}} of {{Subject}}, {{Setting}}. {{Lighting|soft natural light|golden hour|dramatic studio lighting|neon glow}}, {{Mood}} mood, highly detailed, {{Aspect|square 1:1|portrait 4:5|landscape 16:9}} composition.' },
];

const FIELD = /\{\{([^}|:]+)(?::(long))?((?:\|[^}|]+)*)\}\}/g;
interface Field { name: string; long: boolean; options: string[] }

function fieldsOf(text: string): Field[] {
  const seen = new Map<string, Field>();
  for (const m of text.matchAll(FIELD)) {
    const name = m[1].trim();
    if (!seen.has(name)) seen.set(name, { name, long: !!m[2], options: m[3] ? m[3].split('|').filter(Boolean) : [] });
  }
  return [...seen.values()];
}

function fill(text: string, values: Record<string, string>, fields: Field[]) {
  return text.replace(FIELD, (_, n: string) => {
    const name = n.trim();
    const v = values[name] ?? fields.find(f => f.name === name)?.options[0] ?? '';
    return v.trim() ? v : `[${name}]`;
  });
}

const STORE = 'vyooom:prompts:v1';

export default function PromptBuilder() {
  const [mine, setMine] = useState<Template[]>([]);
  const [id, setId] = useState(BUILT_IN[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    try { setMine(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch { /* ignore */ }
  }, []);
  const saveMine = (list: Template[]) => { setMine(list); try { localStorage.setItem(STORE, JSON.stringify(list)); } catch { /* ignore */ } };

  const all = [...mine, ...BUILT_IN];
  const tpl = all.find(t => t.id === id) ?? BUILT_IN[0];
  const fields = useMemo(() => fieldsOf(tpl.text), [tpl.text]);
  const prompt = useMemo(() => fill(tpl.text, values, fields), [tpl.text, values, fields]);
  const missing = fields.filter(f => !f.options.length && !values[f.name]?.trim()).length;

  function choose(newId: string) { setId(newId); setValues({}); setEditing(false); }
  function startEdit() { setDraft(tpl.text); setDraftName(tpl.custom ? tpl.name : `${tpl.name} (my version)`); setEditing(true); }
  function saveDraft() {
    const t: Template = { id: tpl.custom ? tpl.id : `my-${Date.now()}`, name: draftName.trim() || 'My template', group: 'My templates', text: draft, custom: true };
    saveMine([t, ...mine.filter(m => m.id !== t.id)]);
    setId(t.id); setEditing(false);
  }

  const groups = [...new Set(all.map(t => t.group))];
  const q = encodeURIComponent(prompt);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
      <Panel className="space-y-4">
        <div>
          <Label htmlFor="tpl">Template</Label>
          <Select id="tpl" value={tpl.id} onChange={e => choose(e.target.value)}>
            {groups.map(g => (
              <optgroup key={g} label={g}>
                {all.filter(t => t.group === g).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
            ))}
          </Select>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="dname">Template name</Label>
              <TextInput id="dname" value={draftName} onChange={e => setDraftName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="draft">Template text</Label>
              <TextArea id="draft" rows={10} value={draft} onChange={e => setDraft(e.target.value)} mono />
              <p className="text-xs text-slate-500 mt-1">Use <code>{'{{Name}}'}</code> for a field, <code>{'{{Name:long}}'}</code> for a paragraph and <code>{'{{Name|option 1|option 2}}'}</code> for a choice.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveDraft}><Save className="w-4 h-4" />Save template</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            {fields.map(f => (
              <div key={f.name}>
                <Label htmlFor={`f-${f.name}`}>{f.name}</Label>
                {f.options.length ? (
                  <Select id={`f-${f.name}`} value={values[f.name] ?? f.options[0]} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </Select>
                ) : f.long ? (
                  <TextArea id={`f-${f.name}`} rows={4} value={values[f.name] ?? ''} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} />
                ) : (
                  <TextInput id={`f-${f.name}`} value={values[f.name] ?? ''} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} />
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" onClick={startEdit}><Pencil className="w-4 h-4" />{tpl.custom ? 'Edit template' : 'Customise template'}</Button>
              {tpl.custom && (
                <Button variant="ghost" onClick={() => { saveMine(mine.filter(m => m.id !== tpl.id)); choose(BUILT_IN[0].id); }}>
                  <Trash2 className="w-4 h-4" />Delete
                </Button>
              )}
            </div>
          </>
        )}
      </Panel>

      <Panel className="flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Label className="mb-0">Your prompt</Label>
          {missing > 0 && <span className="text-xs text-amber-700">{missing} field{missing > 1 ? 's' : ''} still empty</span>}
        </div>
        <pre className="flex-1 min-h-[200px] whitespace-pre-wrap break-words rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800 font-sans leading-relaxed">{prompt}</pre>
        <div className="flex flex-wrap gap-2 mt-3">
          <CopyButton text={prompt} label="Copy prompt" variant="primary" />
          <a href={`https://chatgpt.com/?q=${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 min-h-11 sm:min-h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            ChatGPT <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a href={`https://claude.ai/new?q=${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 min-h-11 sm:min-h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Claude <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-2">The ChatGPT and Claude buttons open their site with this prompt filled in.</p>
      </Panel>
    </div>
  );
}
