'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Box, Brush, Camera, Heart, Home, Search, Smile, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyButton, Label, Panel, Segmented, TextInput } from '@/components/tool/ui';

type Cat = 'figure' | 'cartoon' | 'portrait' | 'retro' | 'couple' | 'fun' | 'home';

const CATS: { value: Cat; label: string; icon: LucideIcon }[] = [
  { value: 'figure', label: 'Figures & toys', icon: Box },
  { value: 'cartoon', label: 'Cartoon & anime', icon: Brush },
  { value: 'portrait', label: 'Portraits', icon: UserRound },
  { value: 'retro', label: 'Retro & vintage', icon: Camera },
  { value: 'couple', label: 'Couples & family', icon: Heart },
  { value: 'fun', label: 'Fun & memes', icon: Smile },
  { value: 'home', label: 'Pets & home', icon: Home },
];

interface Prompt {
  id: string;
  title: string;
  cat: Cat;
  /** What it makes, one line. */
  blurb: string;
  /** Use [Field name] or [Field name=default] for fill-in fields. */
  prompt: string;
  photos: string;
  hot?: boolean;
}

const KEEP = 'Keep the face, features, skin tone and expression exactly like the uploaded photo.';

const PROMPTS: Prompt[] = [
  { id: 'desk-figure', cat: 'figure', hot: true, title: '1/7 scale figurine on a desk',
    blurb: 'You as a realistic collectible figure, with its box and a 3D-modelling screen behind it.',
    photos: '1 full-body photo',
    prompt: `Create a 1/7 scale commercialised figurine of the person in the photo, in a realistic style, in a real environment. The figurine is placed on a computer desk and stands on a round transparent acrylic base with no text. On the computer screen is the 3D modelling process of this figurine. Next to the screen is a toy packaging box designed like a high-quality collectible, printed with original artwork of the figure. ${KEEP}` },
  { id: 'action-figure', cat: 'figure', hot: true, title: 'Action figure in a blister pack',
    blurb: 'A boxed toy version of you with accessories that match your life.',
    photos: '1 full-body photo',
    prompt: `Turn the person in the photo into a realistic action figure sealed in a clear plastic blister pack on a cardboard backing. The top of the box says "[Name=YOUR NAME]" in bold letters, with "[Tagline=Starter Pack]" underneath. Inside the pack, next to the figure, place these accessories: [Accessories=a laptop, a coffee mug, headphones, a phone]. Colour theme: [Colour theme=orange and cream]. Studio product photo, soft shadows. ${KEEP}` },
  { id: 'brick-minifig', cat: 'figure', title: 'Toy-brick minifigure',
    blurb: 'You as a plastic building-brick minifigure in a little scene.',
    photos: '1 photo',
    prompt: `Recreate the person in the photo as a plastic toy-brick minifigure with a cylindrical head, C-shaped hands and printed clothing that matches their outfit. Place them in a small brick-built scene of [Scene=a coffee shop]. Macro photography, shallow depth of field. Keep their hairstyle and glasses (if any).` },
  { id: 'bobblehead', cat: 'figure', title: 'Vinyl bobblehead',
    blurb: 'Big-head collectible vinyl figure with a name plate.',
    photos: '1 photo',
    prompt: `Make a cute vinyl bobblehead figure of the person in the photo: oversized head, small body, glossy finish, standing on a round base with a name plate that says "[Name=YOUR NAME]". Product shot on a plain [Background colour=peach] background. ${KEEP}` },
  { id: 'clay', cat: 'figure', title: 'Claymation character',
    blurb: 'Hand-made plasticine look with fingerprints and soft studio light.',
    photos: '1 photo',
    prompt: `Transform the person in the photo into a claymation character made of plasticine, with visible fingerprints and slightly uneven hand-sculpted texture. Stop-motion film look, warm soft lighting, set in [Scene=a cosy bedroom]. Keep their hairstyle and outfit.` },

  { id: 'anime-film', cat: 'cartoon', hot: true, title: 'Ghibli-style anime portrait',
    blurb: 'Soft hand-painted Japanese animation look, watercolour backgrounds.',
    photos: '1 photo',
    prompt: `Redraw this photo in the style of a classic hand-drawn Japanese animated film: soft painted watercolour backgrounds, gentle natural light, warm colours, simple expressive faces and a peaceful, nostalgic mood. Keep the same composition, pose, clothing and setting as the photo.` },
  { id: '3d-movie', cat: 'cartoon', hot: true, title: '3D animated movie character',
    blurb: 'You as the lead in a big-studio 3D animated film.',
    photos: '1 photo',
    prompt: `Turn the person in the photo into a 3D animated movie character: big expressive eyes, smooth stylised skin, soft subsurface lighting, cinematic depth of field. Place them in [Scene=a magical city street at golden hour]. Keep their hairstyle, outfit and recognisable features.` },
  { id: 'manga', cat: 'cartoon', title: 'Manga comic page',
    blurb: 'Black-and-white manga panels starring you.',
    photos: '1 photo',
    prompt: `Create a black-and-white manga page with 4 panels starring the person in the photo. Story: [Story=they find out the canteen has run out of samosas]. Screentone shading, speed lines, expressive reactions, speech bubbles in English.` },
  { id: 'cartoon-caricature', cat: 'cartoon', title: 'Roast caricature',
    blurb: 'Exaggerated, funny caricature based on your vibe.',
    photos: '1 photo',
    prompt: `Create a funny caricature of the person in the photo. Exaggerate their most noticeable features in a playful, good-natured way and add props that roast their personality: [Their habits=always on their phone, drinks too much chai, never on time]. Bright colours, thick outlines, white background.` },

  { id: 'linkedin', cat: 'portrait', hot: true, title: 'Professional headshot',
    blurb: 'Clean studio headshot for LinkedIn, CVs and ID cards.',
    photos: '1–3 clear face photos',
    prompt: `Create a professional corporate headshot of the person in the photo. Wearing [Outfit=a navy blazer and white shirt], shoulders-up framing, soft studio lighting, plain [Background=light grey] background, natural skin texture (no heavy retouching). ${KEEP}` },
  { id: 'bw-cinematic', cat: 'portrait', hot: true, title: 'Black & white cinematic portrait',
    blurb: 'Moody high-contrast portrait with dramatic side light.',
    photos: '1 photo',
    prompt: `Create a black and white cinematic portrait of the person in the photo. Dramatic side lighting with deep shadows, dark background, 85mm lens, high contrast, fine film grain, looking slightly away from the camera. ${KEEP}` },
  { id: 'festive', cat: 'portrait', title: 'Festive portrait',
    blurb: 'Diwali diyas, Christmas lights or Eid lanterns around you.',
    photos: '1 photo',
    prompt: `Create a warm festive portrait of the person in the photo celebrating [Festival=Diwali], wearing [Outfit=traditional festive clothes]. Surround them with the festival’s lights and decorations, with soft bokeh in the background and a golden evening glow. ${KEEP}` },
  { id: 'time-machine', cat: 'portrait', title: 'You at every age',
    blurb: 'One image showing you as a child, teen, adult and senior.',
    photos: '1 photo',
    prompt: `Create a single image showing the person in the photo at 4 ages side by side: age 6, age 16, their current age, and age 75. Same pose and lighting for each, plain studio background, realistic ageing. Keep them clearly recognisable as the same person.` },
  { id: 'movie-poster', cat: 'portrait', title: 'Movie poster',
    blurb: 'You as the hero of a blockbuster poster with a title.',
    photos: '1 photo',
    prompt: `Design a blockbuster movie poster starring the person in the photo as the hero. Genre: [Genre=action thriller]. Title at the bottom in big cinematic letters: "[Movie title=THE DEADLINE]". Dramatic lighting, credits block at the bottom, release text "[Release text=Coming this Friday]". ${KEEP}` },

  { id: 'retro-saree', cat: 'retro', hot: true, title: 'Vintage saree portrait',
    blurb: 'Retro 90s Bollywood-style portrait with grain and warm light.',
    photos: '1 photo',
    prompt: `Convert the person in the photo into a retro vintage portrait wearing a flowing [Saree=red chiffon saree], with a flower tucked in their hair. 90s Bollywood film aesthetic: warm golden-hour light, soft grain, dreamy shadows, against a plain textured wall. ${KEEP}` },
  { id: 'digicam', cat: 'retro', title: '2016 digicam flash photo',
    blurb: 'Harsh flash, date stamp, slightly overexposed. (Or use our free filter.)',
    photos: '1 photo',
    prompt: `Make this look like it was taken on a cheap 2000s point-and-shoot digital camera at night: harsh direct on-camera flash, slightly overexposed skin, dark background falloff, mild noise, red-eye-free, and an orange date stamp in the bottom right corner that reads "[Date stamp=12 31 '16]". Keep everything else the same.` },
  { id: 'polaroid-younger', cat: 'retro', hot: true, title: 'Hugging your younger self',
    blurb: 'Polaroid of you now hugging you as a kid.',
    photos: '2 photos: one childhood, one recent',
    prompt: `Create a realistic Polaroid photo of the adult (second photo) hugging their younger self (first photo). Both look at the camera, smiling. Slight blur, soft flash, plain white curtain background, Polaroid frame with a little grain. Keep both faces exactly as in the photos.` },

  { id: 'couple-poster', cat: 'couple', title: 'Retro couple film poster',
    blurb: 'Hand-painted 90s romance poster of you two.',
    photos: '1 photo of the couple',
    prompt: `Turn this couple photo into a hand-painted 1990s Indian romance film poster. Big painted title "[Title=DIL SE DIL TAK]" in retro lettering, dramatic sunset sky, painterly brush strokes. Keep both faces recognisable.` },
  { id: 'family-portrait', cat: 'couple', title: 'Royal family oil painting',
    blurb: 'Your family as a classical oil painting in a palace.',
    photos: '1 family photo',
    prompt: `Repaint this family photo as a classical royal oil portrait in a palace hall, everyone in elegant period clothing, rich textures, warm candlelight, ornate gold frame. Keep every face recognisable and in the same positions.` },

  { id: 'starter-pack', cat: 'fun', title: '“Starter pack” meme',
    blurb: 'A grid of items that sum up a person, job or city.',
    photos: 'optional',
    prompt: `Make a "[Who=Bangalore techie] starter pack" meme: a white background with 6–8 isolated items that sum up that person, each with a short funny caption, and the title at the top in bold.` },
  { id: 'tiny-me', cat: 'fun', title: 'Tiny me on a giant phone',
    blurb: 'Miniature you sitting on your own oversized phone.',
    photos: '1 photo',
    prompt: `Create a miniature version of the person in the photo, about 10 cm tall, sitting on the edge of a giant smartphone that shows the original photo on its screen. Realistic tabletop macro shot, shallow depth of field. ${KEEP}` },

  { id: 'pet-human', cat: 'home', title: 'Your pet as a human',
    blurb: 'What your dog or cat would look like as a person.',
    photos: '1 pet photo',
    prompt: `Imagine the pet in the photo as a human. Keep its personality, colouring and vibe in their hair, clothing and expression. Realistic portrait, standing next to the original pet.` },
  { id: 'pet-royal', cat: 'home', title: 'Renaissance pet portrait',
    blurb: 'Your pet as a noble in a classical painting.',
    photos: '1 pet photo',
    prompt: `Paint the pet in the photo as a noble in a Renaissance oil portrait: velvet cloak, lace collar, jewelled medallion, seated on a throne, dark dramatic background, museum-quality brushwork.` },
  { id: 'room', cat: 'home', title: 'Room makeover',
    blurb: 'Redesign your room from one photo.',
    photos: '1 room photo',
    prompt: `Redesign this room in a [Style=warm minimal Japandi] style. Keep the walls, windows, doors and room shape exactly the same. Change the furniture, lighting, colours and decor. Budget-friendly and realistic, photographed in daylight.` },
];

const FIELD = /\[([^\]=]+)(?:=([^\]]*))?\]/g;

function fieldsOf(p: string) {
  const seen = new Map<string, string>();
  for (const m of p.matchAll(FIELD)) if (!seen.has(m[1])) seen.set(m[1], m[2] ?? '');
  return [...seen.entries()];
}

function fill(p: string, values: Record<string, string>) {
  return p.replace(FIELD, (_, name: string, def = '') => values[name]?.trim() || def || name);
}

function PromptCard({ p, open, onOpen }: { p: Prompt; open: boolean; onOpen: () => void }) {
  const fields = useMemo(() => fieldsOf(p.prompt), [p.prompt]);
  const [values, setValues] = useState<Record<string, string>>({});
  const text = fill(p.prompt, values);
  const Icon = CATS.find(c => c.value === p.cat)!.icon;

  return (
    <div className={cn('rounded-2xl border bg-white transition-shadow', open ? 'border-brand-300 shadow-md sm:col-span-2' : 'border-slate-200 hover:border-slate-300')}>
      <button type="button" onClick={onOpen} className="w-full text-left p-4 flex gap-3 items-start" aria-expanded={open}>
        <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0"><Icon className="w-[18px] h-[18px]" /></span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{p.title}</span>
            {p.hot && <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 rounded-md px-1.5 py-0.5">Trending</span>}
          </span>
          <span className="block text-sm text-slate-500 mt-0.5">{p.blurb}</span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-500">Upload: <b className="text-slate-700">{p.photos}</b></p>
          {fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map(([name, def]) => (
                <div key={name}>
                  <Label htmlFor={`${p.id}-${name}`}>{name}</Label>
                  <TextInput id={`${p.id}-${name}`} placeholder={def || name} value={values[name] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [name]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{text}</div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={text} label="Copy prompt" variant="primary" />
            <a href={`https://chatgpt.com/?q=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 min-h-11 sm:min-h-10 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              Open in ChatGPT <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 min-h-11 sm:min-h-10 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              Open Gemini <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiPhotoPrompts() {
  const [cat, setCat] = useState<Cat | 'all' | 'hot'>('hot');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROMPTS.filter(p =>
      (cat === 'all' || (cat === 'hot' ? p.hot : p.cat === cat)) &&
      (!needle || `${p.title} ${p.blurb} ${p.prompt}`.toLowerCase().includes(needle)));
  }, [cat, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <TextInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search prompts (figurine, saree, anime…)" className="pl-9" />
        </div>
        <Segmented size="sm" value={cat} onChange={v => { setCat(v); setOpen(null); }}
          options={[{ value: 'hot', label: 'Trending' }, { value: 'all', label: 'All' }, ...CATS.map(c => ({ value: c.value, label: c.label }))]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {list.map(p => <PromptCard key={p.id} p={p} open={open === p.id} onOpen={() => setOpen(o => (o === p.id ? null : p.id))} />)}
        {!list.length && <p className="text-sm text-slate-500 py-6">No prompts match. Try another word.</p>}
      </div>

      <Panel>
        <h2 className="font-semibold text-slate-900 mb-2">Getting good results</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
          <li>Upload a sharp, well-lit photo where your face is clearly visible. Front-facing works best.</li>
          <li>Upload the photo first, then paste the prompt in the same message.</li>
          <li>If the face changes, reply: “Keep my face exactly the same as the photo, only change the style.”</li>
          <li>Free plans limit image generations per day. If you hit the limit, try Gemini or come back tomorrow.</li>
          <li>Don’t upload photos of other people without their permission.</li>
        </ul>
      </Panel>
    </div>
  );
}
