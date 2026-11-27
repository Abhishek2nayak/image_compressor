/**
 * Single source of truth for every tool on the site.
 * The home page grid, sitemap, per-tool SEO metadata, related-tool links and
 * the dynamic /[slug] route are all generated from this list.
 *
 * Adding a new tool:
 *   1. Add an entry here.
 *   2. Add its component to src/tools/index.ts (unless it has its own app/ folder).
 */
import type { LucideIcon } from 'lucide-react';
import {
  // existing tools
  ImageIcon, FileText, FilePlus2, Scissors, Minimize2, Wand2, RefreshCw, ShieldOff,
  Images, Maximize2, RotateCw, Stamp,
  // text
  Type, CaseSensitive, WrapText, ListX, GitCompare, Pilcrow, Replace, Volume2, StickyNote, Sparkles,
  // utilities
  Lock,
  // new batch
  Layers, ListOrdered, Signature, EyeOff, Target, IdCard, SquareUser, Crop, Palette, Laugh, Droplets, FileImage, ScanText,
  WandSparkles, Coins, MessageSquareText, FileDown, Hash, Quote, PenLine, IndianRupee, Wallet, GraduationCap, CalendarCheck,
  Timer, Globe, ReceiptText, ScreenShare, Mic,
  // calculators
  Cake, CalendarRange, Scale, Percent, Landmark, TrendingUp, Receipt, PiggyBank, Tag, Ruler,
  // social & viral
  MessageCircleHeart, UserMinus, Sparkle, Camera, GalleryVertical, AppWindow,
} from 'lucide-react';

export type CategoryId = 'pdf' | 'image' | 'social' | 'ai' | 'text' | 'calculator' | 'utility';

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export const CATEGORIES: Category[] = [
  { id: 'pdf',        label: 'PDF Tools',        blurb: 'Merge, split, rotate and convert PDFs.' },
  { id: 'image',      label: 'Image Tools',      blurb: 'Compress, resize, convert and edit images.' },
  { id: 'social',     label: 'Social & Viral',   blurb: 'Chat stats, unfollowers, trending photo looks.' },
  { id: 'ai',         label: 'AI Helpers',       blurb: 'Clean, count and convert AI chat output.' },
  { id: 'calculator', label: 'Calculators',      blurb: 'Finance, health, date and everyday maths.' },
  { id: 'text',       label: 'Text Tools',       blurb: 'Count, clean, compare and transform text.' },
  { id: 'utility',    label: 'Everyday Utilities', blurb: 'Timers, recorders, invoices and more.' },
];

export interface Faq { q: string; a: string }

export interface Tool {
  slug: string;
  name: string;
  /** SEO <title>; falls back to name. Keep under ~60 chars. */
  title?: string;
  /** Meta description and the subtitle under the H1. ~150 chars. */
  description: string;
  /** One line for tool cards. */
  short: string;
  category: CategoryId;
  icon: LucideIcon;
  keywords: string[];
  faqs?: Faq[];
  /** Overrides the default "nothing leaves your browser" line under the tool. */
  privacyNote?: string;
  isNew?: boolean;
  /**
   * Temporarily switched off (needs a backend, a third-party service, or has a
   * licensing issue). Hidden tools keep their code and registry entry but are
   * left out of every list, the sitemap and routing. Flip to false to restore.
   */
  hidden?: boolean;
}

const PRIVATE = 'All calculations run in your browser. Nothing you enter is sent anywhere.';

export const ALL_TOOLS: Tool[] = [
  // ───────────────────────── PDF ─────────────────────────
  { slug: 'merge-pdf', name: 'Merge PDF', category: 'pdf', icon: FilePlus2,
    short: 'Combine multiple PDFs into one file.',
    description: 'Combine multiple PDF files into one. Drag to reorder pages, then download — entirely in your browser.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf'] },
  { slug: 'split-pdf', name: 'Split PDF', category: 'pdf', icon: Scissors,
    short: 'Extract pages or split by range.',
    description: 'Extract specific pages or split a PDF into multiple files by range.',
    keywords: ['split pdf', 'extract pdf pages'] },
  { slug: 'compress-pdf', name: 'Compress PDF', category: 'pdf', icon: Minimize2,
    short: 'Reduce PDF file size.',
    description: 'Reduce PDF file size by re-optimising its internal structure.',
    keywords: ['compress pdf', 'reduce pdf size'],
    hidden: true /* calls the apps/api backend (/api/v1/pdf-compress) */ },
  { slug: 'jpg-to-pdf', name: 'JPG to PDF', category: 'pdf', icon: FileText,
    short: 'Turn images into a single PDF.',
    description: 'Convert JPEG, PNG, WebP and AVIF images into a single PDF. Reorder pages and rotate images.',
    keywords: ['jpg to pdf', 'image to pdf', 'png to pdf'] },
  { slug: 'pdf-to-images', name: 'PDF to Images', category: 'pdf', icon: Images,
    short: 'Export PDF pages as PNG or JPG.',
    description: 'Convert each page of a PDF into PNG or JPG images.',
    keywords: ['pdf to jpg', 'pdf to png', 'pdf to image'] },
  { slug: 'rotate-pdf', name: 'Rotate PDF', category: 'pdf', icon: RotateCw,
    short: 'Rotate PDF pages 90°, 180° or 270°.',
    description: 'Rotate all pages of a PDF by 90°, 180°, or 270°.',
    keywords: ['rotate pdf'] },
  { slug: 'organize-pdf', hidden: true /* not built yet: no component in src/tools */, name: 'Organize PDF', category: 'pdf', icon: Layers, isNew: true,
    short: 'Reorder, rotate and delete pages.',
    description: 'See every page of a PDF as a thumbnail, then reorder, rotate or delete pages and download the new file.',
    keywords: ['organize pdf', 'reorder pdf pages', 'delete pdf pages', 'rearrange pdf', 'remove pages from pdf'],
    faqs: [{ q: 'Can I move pages on my phone?', a: 'Yes. Use the arrow buttons on each page to move it earlier or later — no dragging needed.' }] },
  { slug: 'add-page-numbers', hidden: true /* not built yet: no component in src/tools */, name: 'Add Page Numbers', category: 'pdf', icon: ListOrdered, isNew: true,
    short: 'Number the pages of a PDF.',
    description: 'Add page numbers to a PDF. Choose the position, format (1, Page 1, 1 of 10), size and starting number.',
    keywords: ['add page numbers to pdf', 'pdf page numbers', 'number pdf pages', 'paginate pdf'] },
  { slug: 'sign-pdf', hidden: true /* not built yet: no component in src/tools */, name: 'Sign PDF', category: 'pdf', icon: Signature, isNew: true,
    short: 'Draw or type a signature onto a PDF.',
    description: 'Sign a PDF without printing it. Draw your signature with a finger or mouse, or type it, then place it on any page.',
    keywords: ['sign pdf', 'esign pdf', 'add signature to pdf', 'sign pdf online free', 'electronic signature'],
    faqs: [
      { q: 'Is this a legally valid digital signature?', a: 'It adds a visual signature image, which many offices accept for everyday documents. It is not a certificate-based digital signature (DSC) used for things like tax filings.' },
      { q: 'Is my document uploaded?', a: 'No. The PDF is opened and signed on your device.' },
    ] },
  { slug: 'redact-pdf', hidden: true /* not built yet: no component in src/tools */, name: 'Redact PDF', category: 'pdf', icon: EyeOff, isNew: true,
    short: 'Permanently black out private details.',
    description: 'Black out account numbers, addresses or names in a PDF. Redacted pages are flattened to images so the hidden text cannot be copied back.',
    keywords: ['redact pdf', 'black out pdf', 'hide text in pdf', 'censor pdf'],
    faqs: [{ q: 'Can someone remove the black boxes?', a: 'No. Pages you redact are re-drawn as images with the boxes burned in, so the original text underneath no longer exists in the file.' }] },

  // ───────────────────────── Image ─────────────────────────
  { slug: 'compress-image', name: 'Image Compressor', category: 'image', icon: ImageIcon,
    hidden: true /* removed 2026-11-27: often produced larger files; rebuild before restoring */,
    short: 'Shrink JPG, PNG, WebP and AVIF files.',
    description: 'Reduce JPEG, PNG, WebP and AVIF file sizes by up to 80% without visible quality loss.',
    keywords: ['compress image', 'image compressor', 'reduce image size'] },
  { slug: 'resize-image', name: 'Resize Image', category: 'image', icon: Maximize2,
    short: 'Resize by pixels or percentage.',
    description: 'Resize images by exact pixel dimensions or percentage. Lock aspect ratio, batch process.',
    keywords: ['resize image', 'image resizer'] },
  { slug: 'convert-image', name: 'Convert Image', category: 'image', icon: RefreshCw,
    short: 'Convert between JPG, PNG, WebP, AVIF.',
    description: 'Convert JPG, PNG, WebP and AVIF to any format with quality control.',
    keywords: ['convert image', 'png to jpg', 'jpg to webp'] },
  { slug: 'remove-background', name: 'Remove Background', category: 'image', icon: Wand2,
    short: 'AI background removal in your browser.',
    description: 'AI-powered background removal that runs entirely in your browser.',
    keywords: ['remove background', 'background remover'],
    hidden: true /* downloads its model from a third-party CDN at runtime; library is AGPL */ },
  { slug: 'rotate-image', name: 'Rotate & Flip Image', category: 'image', icon: RotateCw,
    short: 'Rotate 90° or flip images.',
    description: 'Rotate images 90°, 180°, or flip horizontally and vertically.',
    keywords: ['rotate image', 'flip image'] },
  { slug: 'watermark-image', name: 'Add Watermark', category: 'image', icon: Stamp,
    short: 'Add a text watermark to images.',
    description: 'Add a custom text watermark to images. Control position, size, opacity and colour.',
    keywords: ['watermark image', 'add watermark'] },
  { slug: 'remove-metadata', name: 'Remove Metadata', category: 'image', icon: ShieldOff,
    short: 'Strip EXIF and GPS data from photos.',
    description: 'Strip EXIF, GPS location, timestamps and C2PA labels from images.',
    keywords: ['remove exif', 'remove metadata'] },
  { slug: 'compress-image-to-kb', hidden: true /* not built yet: no component in src/tools */, name: 'Compress Image to KB', title: 'Compress Image to 20KB, 50KB, 100KB — Exact Size',
    category: 'image', icon: Target, isNew: true,
    short: 'Hit an exact size like 20 KB or 50 KB.',
    description: 'Compress a photo to an exact file size — 20 KB, 50 KB, 100 KB or any size you need for forms and uploads.',
    keywords: ['compress image to 20kb', 'compress image to 50kb', 'reduce image size in kb', 'resize image to 100kb', 'photo size reducer'],
    faqs: [
      { q: 'How does it reach an exact size?', a: 'It tries different JPEG quality levels and, if needed, slightly smaller dimensions until the file is just under your target.' },
      { q: 'Why is my result a little smaller than the target?', a: 'The file must not go over the limit, so the result is the largest version that fits — usually within a few percent of the target.' },
    ] },
  { slug: 'exam-photo-resizer', hidden: true /* not built yet: no component in src/tools */, name: 'Exam Photo & Signature Resizer', title: 'Photo & Signature Resizer for SSC, UPSC, NEET, PAN',
    category: 'image', icon: IdCard, isNew: true,
    short: 'SSC, UPSC, NEET, PAN photo sizes.',
    description: 'Resize your photo and signature to the exact pixel size and KB limit for SSC, UPSC, IBPS, NEET, JEE, PAN and passport forms.',
    keywords: ['ssc photo resize', 'upsc photo size', 'neet photo resizer', 'signature resize 20kb', 'pan card photo size', 'exam photo resizer'],
    faqs: [{ q: 'Are the presets official?', a: 'They follow sizes commonly published in recent notifications. Rules change, so always check the current notification for your exam and use “Custom” if it differs.' }] },
  { slug: 'passport-photo-maker', hidden: true /* not built yet: no component in src/tools */, name: 'Passport Photo Maker', category: 'image', icon: SquareUser, isNew: true,
    short: 'Crop and print passport photo sheets.',
    description: 'Crop a photo to passport size (India 35×45 mm, US 2×2 in and more) and lay out copies on a 4×6 in or A4 sheet ready to print.',
    keywords: ['passport photo maker', 'passport size photo', 'passport photo online', '35x45 photo', 'passport photo print sheet'] },
  { slug: 'social-media-image-resizer', hidden: true /* not built yet: no component in src/tools */, name: 'Social Media Image Resizer', category: 'image', icon: Crop, isNew: true,
    short: 'Instagram, YouTube, LinkedIn sizes.',
    description: 'Resize and crop an image to the right size for Instagram posts and stories, YouTube thumbnails, LinkedIn, X, Facebook and WhatsApp.',
    keywords: ['instagram image resizer', 'youtube thumbnail size', 'social media image size', 'resize image for instagram', 'linkedin banner size'] },
  { slug: 'image-color-palette', hidden: true /* not built yet: no component in src/tools */, name: 'Color Palette from Image', category: 'image', icon: Palette, isNew: true,
    short: 'Extract the main colours of a photo.',
    description: 'Pull the dominant colours out of any image and copy them as HEX, RGB or HSL — handy for designs, brands and presentations.',
    keywords: ['color palette from image', 'extract colors from image', 'image color picker', 'hex color from image'] },
  { slug: 'meme-generator', hidden: true /* not built yet: no component in src/tools */, name: 'Meme Generator', category: 'image', icon: Laugh, isNew: true,
    short: 'Add top and bottom text to an image.',
    description: 'Make a meme or add bold captions to any photo. Classic top and bottom text, adjustable size and colour, no watermark.',
    keywords: ['meme generator', 'add text to image', 'caption image', 'meme maker no watermark'] },
  { slug: 'blur-image', hidden: true /* not built yet: no component in src/tools */, name: 'Blur & Pixelate Image', category: 'image', icon: Droplets, isNew: true,
    short: 'Hide faces, plates or details.',
    description: 'Blur or pixelate parts of a photo — faces, number plates, addresses or screens — before you share it.',
    keywords: ['blur image', 'blur face in photo', 'pixelate image', 'censor image', 'blur part of image'] },
  { slug: 'heic-to-jpg', hidden: true /* not built yet: no component in src/tools */, name: 'HEIC to JPG', category: 'image', icon: FileImage, isNew: true,
    short: 'Convert iPhone photos to JPG.',
    description: 'Convert iPhone HEIC/HEIF photos to JPG or PNG so they open everywhere. Convert many at once, right in your browser.',
    keywords: ['heic to jpg', 'heic converter', 'convert iphone photo to jpg', 'heif to jpg'],
    privacyNote: 'Photos are converted on your device. The converter loads from this site the first time you use it.' },
  { slug: 'image-to-text', hidden: true /* not built yet: no component in src/tools */, name: 'Image to Text (OCR)', category: 'image', icon: ScanText, isNew: true,
    short: 'Copy text out of photos and scans.',
    description: 'Extract text from photos, screenshots and scanned documents with on-device OCR. Supports English and Hindi.',
    keywords: ['image to text', 'ocr online', 'extract text from image', 'photo to text', 'screenshot to text'],
    privacyNote: 'Text recognition runs on your device. The OCR engine and language data (a few MB) load from this site the first time and are then cached.',
    faqs: [{ q: 'How accurate is it?', a: 'Clear, straight, well-lit printed text works best. Handwriting and stylised fonts are less reliable.' }] },

  { slug: 'digicam-filter', name: 'Digicam Flash Filter', title: 'Digicam Filter — 2016 Flash Photo Effect with Date Stamp',
    category: 'image', icon: Camera, isNew: true,
    short: 'Old digital camera flash look + date stamp.',
    description: 'Give any photo the viral 2000s digicam look: harsh flash, grain, colour fringing and an orange date stamp. Works on a whole photo dump at once.',
    keywords: ['digicam filter', 'flash filter', 'digital camera filter', '2016 filter', 'y2k photo filter', 'date stamp photo', 'disposable camera filter', 'instagram flash filter'],
    privacyNote: 'Photos are edited on your device and never uploaded.',
    faqs: [
      { q: 'What date does the stamp use?', a: 'Each photo’s own file date by default. Pick any date to override it, for example to make it say 2016.' },
      { q: 'Why is “3 MP” the default size?', a: 'Old point-and-shoot cameras were around 3 megapixels. The smaller size adds the slightly soft look that makes the effect believable.' },
    ] },
  { slug: 'photo-booth', name: 'Photo Booth Strip Maker', title: 'Photo Booth Strip Maker — Online Photobooth with Camera',
    category: 'image', icon: GalleryVertical, isNew: true,
    short: 'Classic photobooth strips from your camera.',
    description: 'Take 3 or 4 photos with a countdown, or upload your own, and turn them into a classic photo booth strip with frames, filters and a caption.',
    keywords: ['photo booth', 'online photobooth', 'photo strip maker', 'photobooth strip', 'photo booth online free', 'polaroid strip'],
    privacyNote: 'Camera and photos stay on your device. Nothing is uploaded or recorded.' },
  { slug: 'screenshot-beautifier', name: 'Screenshot Beautifier', title: 'Screenshot Beautifier — Add Background, Frame & Shadow',
    category: 'image', icon: AppWindow, isNew: true,
    short: 'Gradient background, window frame, shadow.',
    description: 'Make screenshots look polished for posts and slides: gradient backgrounds, rounded corners, shadows and a window or browser frame. Paste and download.',
    keywords: ['screenshot beautifier', 'screenshot mockup', 'beautiful screenshots', 'screenshot background', 'screenshot frame', 'code screenshot background'] },

  // ───────────────────────── AI helpers ─────────────────────────
  { slug: 'ai-text-cleaner', name: 'AI Text Cleaner', title: 'AI Text Cleaner — Remove Markdown, ** and Em Dashes',
    category: 'ai', icon: WandSparkles, isNew: true,
    short: 'Strip **, ## and em dashes from AI output.',
    description: 'Paste text from ChatGPT, Claude or Gemini and remove markdown symbols, em dashes, hidden characters and emoji — ready for Word, WhatsApp or email.',
    keywords: ['remove markdown from chatgpt', 'chatgpt text cleaner', 'remove em dash', 'remove asterisks from text', 'ai text formatter', 'remove hidden characters'],
    faqs: [
      { q: 'What are hidden characters?', a: 'Zero-width spaces, non-breaking spaces and similar invisible Unicode characters that sometimes appear in copied text and break formatting or searches.' },
      { q: 'Does this make AI text undetectable?', a: 'No. It only cleans formatting. It does not rewrite your text.' },
    ] },
  { slug: 'ai-token-counter', name: 'AI Token Counter', category: 'ai', icon: Coins, isNew: true,
    short: 'Estimate tokens and API cost.',
    description: 'Estimate how many tokens your prompt uses and what it costs on popular models from OpenAI, Anthropic and Google.',
    keywords: ['token counter', 'chatgpt token counter', 'claude token counter', 'gpt token calculator', 'llm cost calculator'],
    faqs: [{ q: 'Is the count exact?', a: 'It is an estimate based on typical tokenizer behaviour (about 4 characters per token for English). Exact counts vary by model, especially for code and non-English text.' }] },
  { slug: 'prompt-builder', name: 'Prompt Builder', category: 'ai', icon: MessageSquareText, isNew: true,
    short: 'Ready-made prompts with fill-in fields.',
    description: 'Build better prompts for ChatGPT, Claude or Gemini from proven templates — fill in the blanks, then copy. Save your own templates too.',
    keywords: ['prompt generator', 'chatgpt prompt templates', 'prompt builder', 'ai prompt maker'],
    privacyNote: 'Your saved templates are stored only in this browser.' },
  { slug: 'markdown-converter', name: 'Markdown to PDF & Word', category: 'ai', icon: FileDown, isNew: true,
    short: 'Turn AI answers into PDF or Word.',
    description: 'Paste Markdown — or an answer copied from ChatGPT or Claude — and download it as a clean PDF or Word document with headings, lists and tables intact.',
    keywords: ['markdown to pdf', 'markdown to word', 'chatgpt to pdf', 'chatgpt to word', 'md to docx'] },

  { slug: 'ai-photo-prompts', name: 'Viral AI Photo Prompts', title: 'Viral AI Photo Prompts — Figurine, Ghibli, Saree & More',
    category: 'ai', icon: Sparkle, isNew: true,
    short: 'Copy-ready prompts for trending AI edits.',
    description: 'Copy-ready prompts for the AI photo trends everyone is posting: 3D figurine, action figure box, anime style, vintage saree, headshots and more. Fill in the blanks and paste into ChatGPT or Gemini.',
    keywords: ['ai photo prompts', 'viral ai prompts', 'gemini photo prompt', 'chatgpt image prompt', 'figurine prompt', 'ghibli prompt', 'saree trend prompt', 'nano banana prompt', 'action figure prompt'],
    privacyNote: 'This page doesn’t upload anything. Your photo goes only to the AI app you choose to use.',
    faqs: [
      { q: 'Does VYOOOM generate the image?', a: 'No. These prompts are for ChatGPT, Gemini or any image AI you already use. Upload your photo there, paste the prompt and send.' },
      { q: 'Why did my face change?', a: 'Image AIs sometimes drift. Use a clear front-facing photo and reply “keep my face exactly the same as the photo”.' },
    ] },

  // ───────────────────────── Calculators ─────────────────────────
  { slug: 'emi-calculator', name: 'EMI Calculator', title: 'EMI Calculator — Home, Car & Personal Loan EMI',
    category: 'calculator', icon: Landmark, isNew: true,
    short: 'Monthly loan EMI with full schedule.',
    description: 'Calculate the monthly EMI for a home, car or personal loan. See total interest and a year-by-year repayment schedule.',
    keywords: ['emi calculator', 'loan emi calculator', 'home loan emi', 'car loan emi', 'personal loan calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'How is EMI calculated?', a: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly interest rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly instalments.' },
      { q: 'Does a longer tenure reduce my total cost?', a: 'No. A longer tenure lowers the monthly EMI but increases the total interest you pay over the life of the loan.' },
      { q: 'Are processing fees included?', a: 'No. The result covers principal and interest only. Add processing fees, insurance and other charges separately.' },
    ] },
  { slug: 'sip-calculator', name: 'SIP Calculator', title: 'SIP Calculator — Mutual Fund Returns with Step-Up',
    category: 'calculator', icon: TrendingUp, isNew: true,
    short: 'Estimate SIP and lump-sum returns.',
    description: 'Estimate the future value of a monthly SIP or a lump-sum investment, with optional yearly step-up.',
    keywords: ['sip calculator', 'mutual fund calculator', 'step up sip calculator', 'lumpsum calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'What formula does this SIP calculator use?', a: 'FV = P × ((1 + i)^n − 1) ÷ i × (1 + i), where P is the monthly amount, i is the monthly return (annual ÷ 12) and n is the number of months. With step-up, the monthly amount increases once every 12 months.' },
      { q: 'Are these returns guaranteed?', a: 'No. Mutual fund returns vary with the market. Treat the result as an estimate at a constant assumed return.' },
    ] },
  { slug: 'gst-calculator', name: 'GST Calculator', title: 'GST Calculator — Add or Remove GST (India)',
    category: 'calculator', icon: Receipt, isNew: true,
    short: 'Add or remove GST, with CGST/SGST split.',
    description: 'Add GST to a price or extract GST from a GST-inclusive amount. Shows CGST, SGST and IGST breakdown.',
    keywords: ['gst calculator', 'gst calculator india', 'reverse gst calculator', 'cgst sgst calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'How do I remove GST from an inclusive price?', a: 'GST amount = Price × Rate ÷ (100 + Rate). Net price = Price − GST amount. Choose “GST inclusive” to do this automatically.' },
      { q: 'What is the difference between CGST, SGST and IGST?', a: 'For a sale within the same state, GST is split equally into CGST (central) and SGST (state). For inter-state sales, the full amount is charged as IGST.' },
    ] },
  { slug: 'age-calculator', name: 'Age Calculator', title: 'Age Calculator — Exact Age in Years, Months, Days',
    category: 'calculator', icon: Cake, isNew: true,
    short: 'Exact age in years, months and days.',
    description: 'Find your exact age in years, months and days from your date of birth, plus total days lived and a countdown to your next birthday.',
    keywords: ['age calculator', 'date of birth calculator', 'how old am i', 'age calculator by date of birth'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'How is age calculated?', a: 'Full years are counted first, then full months, then the remaining days — the same way age is stated on official documents.' },
      { q: 'Can I calculate age on a specific date?', a: 'Yes. Change the “Age on” date to find someone’s age on any past or future date, such as an exam cut-off date.' },
    ] },
  { slug: 'date-difference-calculator', name: 'Date Difference Calculator', title: 'Days Between Dates Calculator',
    category: 'calculator', icon: CalendarRange, isNew: true,
    short: 'Days between dates, or add days to a date.',
    description: 'Count the days, weeks, months and working days between two dates, or add and subtract days from a date.',
    keywords: ['days between dates', 'date calculator', 'date difference', 'business days calculator', 'add days to date'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'Does the count include the end date?', a: 'By default, no — the result is the number of days from the start date up to the end date. Tick “Include end date” to add one day.' },
      { q: 'What counts as a working day?', a: 'Monday to Friday. Public holidays are not excluded because they differ by country and region.' },
    ] },
  { slug: 'bmi-calculator', name: 'BMI Calculator', title: 'BMI Calculator — Body Mass Index (kg/cm or lb/ft)',
    category: 'calculator', icon: Scale, isNew: true,
    short: 'Body Mass Index and healthy weight range.',
    description: 'Calculate your Body Mass Index in metric or imperial units and see the healthy weight range for your height.',
    keywords: ['bmi calculator', 'body mass index', 'bmi calculator kg cm', 'healthy weight calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'What is a healthy BMI?', a: 'For most adults, the WHO classifies 18.5–24.9 as a healthy weight, 25–29.9 as overweight and 30 or above as obese.' },
      { q: 'Is BMI accurate for everyone?', a: 'No. BMI does not distinguish muscle from fat and is not designed for children, pregnant women or athletes. Some health bodies use lower cut-offs for South Asian adults.' },
    ] },
  { slug: 'percentage-calculator', name: 'Percentage Calculator', category: 'calculator', icon: Percent, isNew: true,
    short: 'Percent of, percent change and more.',
    description: 'Work out X% of a number, what percent one number is of another, and percentage increase or decrease.',
    keywords: ['percentage calculator', 'percent change calculator', 'percentage increase calculator', 'what percent of'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'How do I calculate percentage change?', a: 'Percentage change = (New − Old) ÷ Old × 100. A positive result is an increase, a negative result is a decrease.' },
      { q: 'How do I find what percent X is of Y?', a: 'Divide X by Y and multiply by 100. For example, 30 is 25% of 120 because 30 ÷ 120 × 100 = 25.' },
    ] },
  { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator', category: 'calculator', icon: PiggyBank, isNew: true,
    short: 'Growth with compounding and deposits.',
    description: 'Calculate compound interest with yearly, quarterly, monthly or daily compounding and optional monthly deposits.',
    keywords: ['compound interest calculator', 'fd calculator', 'interest calculator', 'savings calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'What is the compound interest formula?', a: 'A = P × (1 + r/n)^(n×t), where P is the principal, r the annual rate, n the number of compounding periods per year and t the number of years.' },
      { q: 'How are monthly deposits handled?', a: 'Deposits are added at the end of each month and earn interest at the equivalent monthly rate for your chosen compounding frequency.' },
    ] },
  { slug: 'discount-calculator', name: 'Discount Calculator', category: 'calculator', icon: Tag, isNew: true,
    short: 'Sale price after one or two discounts.',
    description: 'Find the final price after a discount, an extra discount on top, and tax — and how much you save.',
    keywords: ['discount calculator', 'sale price calculator', 'percent off calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'Is 20% + 10% the same as 30% off?', a: 'No. The extra discount is applied to the already-discounted price, so 20% + 10% equals 28% off in total.' },
    ] },
  { slug: 'unit-converter', name: 'Unit Converter', category: 'calculator', icon: Ruler, isNew: true,
    short: 'Length, weight, temperature, data and more.',
    description: 'Convert length, weight, temperature, area, volume, speed, time and digital storage units instantly.',
    keywords: ['unit converter', 'cm to inches', 'kg to lbs', 'celsius to fahrenheit', 'mb to gb'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'Is 1 GB 1000 MB or 1024 MB?', a: 'Both are used. In SI units 1 GB = 1000 MB; in binary units 1 GiB = 1024 MiB. This converter lists both so you can pick the one you need.' },
    ] },

  { slug: 'income-tax-calculator', hidden: true /* not built yet: no component in src/tools */, name: 'Income Tax Calculator', title: 'Income Tax Calculator FY 2026-27 — New vs Old Regime',
    category: 'calculator', icon: IndianRupee, isNew: true,
    short: 'New vs old regime, FY 2026-27.',
    description: 'Calculate income tax under the new and old regimes for FY 2025-26 and FY 2026-27, with deductions, 87A rebate, surcharge and cess — and see which regime saves more.',
    keywords: ['income tax calculator', 'new vs old tax regime calculator', 'income tax calculator 2026-27', 'tax calculator india', 'salary tax calculator'],
    privacyNote: PRIVATE,
    faqs: [
      { q: 'Is income up to ₹12 lakh tax-free?', a: 'Under the new regime, yes for resident individuals: the Section 87A rebate cancels tax on taxable income up to ₹12 lakh. Salaried people also get a ₹75,000 standard deduction, so salary up to ₹12.75 lakh is effectively tax-free.' },
      { q: 'Which regime should I choose?', a: 'The old regime only wins if your deductions (80C, 80D, HRA, home-loan interest and so on) are large. Enter them and the calculator shows both side by side.' },
      { q: 'Is this the final tax I owe?', a: 'It is an estimate for salary and similar income. Capital gains, special-rate income and some exemptions are not included. Check incometax.gov.in or a tax professional before filing.' },
    ] },
  { slug: 'salary-calculator', hidden: true /* not built yet: no component in src/tools */, name: 'Salary Calculator', title: 'Salary Calculator — CTC to In-Hand (India)',
    category: 'calculator', icon: Wallet, isNew: true,
    short: 'CTC to monthly in-hand salary.',
    description: 'Convert your CTC into monthly take-home pay after PF, professional tax and income tax under the new or old regime.',
    keywords: ['ctc to in hand calculator', 'take home salary calculator', 'in hand salary calculator', 'salary calculator india'],
    privacyNote: PRIVATE },
  { slug: 'cgpa-to-percentage', hidden: true /* not built yet: no component in src/tools */, name: 'CGPA to Percentage', category: 'calculator', icon: GraduationCap, isNew: true,
    short: 'CGPA ↔ percentage, CBSE & universities.',
    description: 'Convert CGPA or SGPA to percentage (and back) using the CBSE ×9.5 rule or your university’s formula, and calculate CGPA from semester grades.',
    keywords: ['cgpa to percentage', 'sgpa to percentage', 'cgpa calculator', 'percentage to cgpa', 'cbse cgpa'],
    privacyNote: PRIVATE },
  { slug: 'attendance-calculator', hidden: true /* not built yet: no component in src/tools */, name: 'Attendance Calculator', category: 'calculator', icon: CalendarCheck, isNew: true,
    short: 'How many classes can I skip?',
    description: 'Find your attendance percentage, how many classes you can still miss, or how many you must attend to reach 75%.',
    keywords: ['attendance calculator', '75 attendance calculator', 'how many classes can i bunk', 'attendance percentage'],
    privacyNote: PRIVATE },

  // ───────────────────────── Text ─────────────────────────
  { slug: 'word-counter', name: 'Word Counter', title: 'Word Counter — Count Words & Characters Online',
    category: 'text', icon: Type, isNew: true,
    short: 'Words, characters, reading time.',
    description: 'Count words, characters, sentences and paragraphs as you type. See reading time, speaking time and keyword density.',
    keywords: ['word counter', 'character counter', 'word count', 'count characters', 'letter counter'],
    faqs: [
      { q: 'How is reading time estimated?', a: 'Reading time assumes 238 words per minute (average adult silent reading). Speaking time assumes 130 words per minute.' },
      { q: 'Are spaces counted as characters?', a: 'The “Characters” figure includes spaces; “Without spaces” excludes all spaces, tabs and line breaks.' },
    ] },
  { slug: 'case-converter', name: 'Case Converter', category: 'text', icon: CaseSensitive, isNew: true,
    short: 'UPPER, lower, Title, camelCase and more.',
    description: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case and more.',
    keywords: ['case converter', 'uppercase to lowercase', 'title case converter', 'camelcase converter'],
    faqs: [
      { q: 'What is the difference between Title Case and Sentence case?', a: 'Title Case capitalises the first letter of every word. Sentence case capitalises only the first letter of each sentence.' },
    ] },
  { slug: 'remove-line-breaks', name: 'Remove Line Breaks', category: 'text', icon: WrapText, isNew: true,
    short: 'Fix text copied from PDFs and emails.',
    description: 'Remove line breaks, extra spaces and empty lines from text copied out of PDFs, emails and websites.',
    keywords: ['remove line breaks', 'remove extra spaces', 'text cleaner', 'join lines'],
    faqs: [
      { q: 'Can I keep paragraph breaks?', a: 'Yes. Choose “Keep paragraphs” to join lines inside each paragraph while keeping the blank line between paragraphs.' },
    ] },
  { slug: 'remove-duplicate-lines', name: 'Remove Duplicate Lines', category: 'text', icon: ListX, isNew: true,
    short: 'Dedupe, sort and clean lists.',
    description: 'Remove duplicate lines from a list, then optionally sort alphabetically, by length, or reverse the order.',
    keywords: ['remove duplicate lines', 'dedupe list', 'sort lines', 'alphabetical order'],
    faqs: [
      { q: 'Which copy of a duplicate is kept?', a: 'The first occurrence is kept and later repeats are removed, so the original order is preserved unless you choose to sort.' },
    ] },
  { slug: 'diff-checker', name: 'Diff Checker', title: 'Diff Checker — Compare Two Texts Online',
    category: 'text', icon: GitCompare, isNew: true,
    short: 'Compare two texts line by line.',
    description: 'Compare two blocks of text and highlight added, removed and unchanged lines. Ignore case or whitespace if needed.',
    keywords: ['diff checker', 'compare text', 'text compare', 'find difference between two texts'],
    faqs: [
      { q: 'Is my text uploaded to compare it?', a: 'No. The comparison runs in your browser, so it is safe for code, contracts and other private text.' },
    ] },
  { slug: 'find-and-replace', name: 'Find and Replace', category: 'text', icon: Replace, isNew: true,
    short: 'Replace text, with regex support.',
    description: 'Find and replace words or phrases in text. Supports case-sensitive, whole-word and regular-expression matching.',
    keywords: ['find and replace', 'replace text online', 'regex replace'],
    faqs: [
      { q: 'Can I use capture groups?', a: 'Yes. With “Regex” enabled, use $1, $2 … in the replacement to insert captured groups.' },
    ] },
  { slug: 'lorem-ipsum-generator', name: 'Lorem Ipsum Generator', category: 'text', icon: Pilcrow, isNew: true,
    short: 'Placeholder paragraphs, sentences, words.',
    description: 'Generate lorem ipsum placeholder text by paragraphs, sentences or words for designs and mock-ups.',
    keywords: ['lorem ipsum', 'lorem ipsum generator', 'dummy text', 'placeholder text'] },
  { slug: 'fancy-text-generator', name: 'Fancy Text Generator', category: 'text', icon: Sparkles, isNew: true,
    short: 'Stylish fonts for bios and posts.',
    description: 'Turn plain text into bold, italic, script, gothic, bubble and other Unicode styles you can paste into Instagram, WhatsApp and more.',
    keywords: ['fancy text generator', 'stylish text', 'instagram fonts', 'bold text generator', 'cool fonts'],
    faqs: [
      { q: 'Why do some styles show as boxes?', a: 'These styles use special Unicode characters. Older devices or some apps may not have fonts for every character.' },
      { q: 'Are these real fonts?', a: 'No — they are Unicode symbols that look like letters, which is why they survive copy and paste. Screen readers may read them poorly, so avoid them for important text.' },
    ] },
  { slug: 'text-to-speech', name: 'Text to Speech', category: 'text', icon: Volume2, isNew: true,
    short: 'Read text aloud with built-in voices.',
    description: 'Have any text read aloud using your device’s built-in voices. Adjust voice, speed and pitch.',
    keywords: ['text to speech', 'tts online', 'read text aloud'],
    privacyNote: 'Speech uses your browser’s voices. Local voices run on your device; voices labelled online (e.g. “Google”) may be processed by your browser vendor.',
    faqs: [
      { q: 'Can I download the audio as MP3?', a: 'Not yet. Browsers do not let websites record their built-in speech voices, so the audio can only be played.' },
      { q: 'Why are the voices different on my phone?', a: 'Voices come from your operating system and browser, so the list differs between Windows, macOS, Android and iOS.' },
    ] },
  { slug: 'online-notepad', name: 'Online Notepad', category: 'text', icon: StickyNote, isNew: true,
    short: 'Notes that autosave in your browser.',
    description: 'A distraction-free notepad that autosaves to your browser. Download your notes as a .txt file any time.',
    keywords: ['online notepad', 'notepad online', 'text editor online'],
    privacyNote: 'Notes are saved only in this browser’s local storage. Clearing site data deletes them.',
    faqs: [
      { q: 'Where are my notes stored?', a: 'In your browser’s local storage on this device. They are not synced, so use “Download” to keep a copy.' },
    ] },

  { slug: 'character-counter', name: 'Character Counter', title: 'Character Counter for Instagram, X, LinkedIn & SEO',
    category: 'text', icon: Hash, isNew: true,
    short: 'Check posts against platform limits.',
    description: 'Count characters as you type and see instantly whether your post fits X, Instagram, LinkedIn, YouTube, SMS and SEO title or description limits.',
    keywords: ['character counter', 'twitter character counter', 'instagram caption length', 'meta description length', 'linkedin character limit'] },
  { slug: 'citation-generator', name: 'Citation Generator', category: 'text', icon: Quote, isNew: true,
    short: 'APA, MLA and Chicago citations.',
    description: 'Create citations for websites, books and journal articles in APA 7, MLA 9 and Chicago style. Keep a list and copy your bibliography.',
    keywords: ['citation generator', 'apa citation generator', 'mla citation', 'reference generator', 'bibliography maker'],
    privacyNote: 'Your citation list is stored only in this browser.' },
  { slug: 'text-to-handwriting', name: 'Text to Handwriting', category: 'text', icon: PenLine, isNew: true,
    short: 'Typed text on ruled notebook paper.',
    description: 'Turn typed text into realistic handwriting on ruled paper. Pick a handwriting style, ink colour and paper, then download as images or PDF.',
    keywords: ['text to handwriting', 'handwriting generator', 'assignment handwriting', 'typed to handwritten'] },

  // ───────────────────────── Social & viral ─────────────────────────
  { slug: 'whatsapp-chat-analyzer', name: 'WhatsApp Chat Analyzer', title: 'WhatsApp Chat Analyzer — Chat Wrapped & Stats',
    category: 'social', icon: MessageCircleHeart, isNew: true,
    short: 'Who texts more, streaks, emojis + a Wrapped card.',
    description: 'See who texts more, who replies faster, your longest streak, top emojis and words, then share a Wrapped-style card. Your chat is analysed on your device and never uploaded.',
    keywords: ['whatsapp chat analyzer', 'whatsapp wrapped', 'chat wrapped', 'whatsapp chat stats', 'who texts more', 'whatsapp analysis', 'chat analyzer'],
    privacyNote: 'Your chat is read and analysed entirely in your browser. It is never uploaded, stored or seen by anyone.',
    faqs: [
      { q: 'Is it safe to use with private chats?', a: 'Yes. The file is read by your browser and the stats are worked out on your device. Nothing is sent to a server, which you can check by turning off Wi-Fi after the page loads.' },
      { q: 'Does it work with group chats?', a: 'Yes. You get a leaderboard of the most active members plus head-to-head stats for the top six.' },
      { q: 'How is reply time worked out?', a: 'It’s the typical (median) gap before someone answers the other person, ignoring gaps longer than 12 hours.' },
      { q: 'What does the share card show?', a: 'Names, totals, streaks, the top emoji and awards. It never includes message text.' },
    ] },
  { slug: 'instagram-unfollowers', name: 'Instagram Unfollowers Checker', title: 'Instagram Unfollowers — Who Doesn’t Follow You Back',
    category: 'social', icon: UserMinus, isNew: true,
    short: 'Who doesn’t follow you back. No login.',
    description: 'Find out who doesn’t follow you back on Instagram using your official data download. No password, no app, no risk to your account. Nothing is uploaded.',
    keywords: ['instagram unfollowers', 'who unfollowed me on instagram', 'not following back', 'instagram followers checker', 'unfollowers instagram', 'instagram follow back checker'],
    privacyNote: 'Your Instagram data is read in your browser and never uploaded. This page never asks for your password.',
    faqs: [
      { q: 'Why not just log in?', a: 'Apps that ask for your Instagram password break Instagram’s rules and often get accounts locked or hacked. Instagram’s own data download is free and safe.' },
      { q: 'Can it show who unfollowed me recently?', a: 'It shows who doesn’t follow you back right now. Download your data again later and compare to see changes. If Instagram includes “recently unfollowed”, that list is shown too.' },
      { q: 'Should I pick JSON or HTML?', a: 'Either works. JSON also includes follow dates, so you can sort by when you followed someone.' },
    ] },

  // ───────────────────────── Everyday utilities ─────────────────────────
  { slug: 'password-generator', name: 'Password Generator', category: 'utility', icon: Lock, isNew: true,
    short: 'Strong random passwords.',
    description: 'Generate strong, random passwords with your choice of length and characters, using cryptographically secure randomness.',
    keywords: ['password generator', 'strong password generator', 'random password'],
    privacyNote: 'Passwords are generated on your device with crypto.getRandomValues and are never sent or stored.',
    faqs: [
      { q: 'How long should a password be?', a: 'At least 12–16 characters for everyday accounts. Length matters more than symbols: each extra character multiplies the number of guesses needed.' },
    ] },
  { slug: 'pomodoro-timer', hidden: true /* not built yet: no component in src/tools */, name: 'Pomodoro Timer', category: 'utility', icon: Timer, isNew: true,
    short: 'Focus timer with breaks.',
    description: 'A clean Pomodoro focus timer: 25-minute sessions with short and long breaks, sound alerts and a session counter. Works offline.',
    keywords: ['pomodoro timer', 'focus timer', 'study timer', 'online timer'] },
  { slug: 'time-zone-converter', hidden: true /* not built yet: no component in src/tools */, name: 'Time Zone Converter', category: 'utility', icon: Globe, isNew: true,
    short: 'Compare times across cities.',
    description: 'Convert a time between cities and time zones, and find a meeting time that works for everyone.',
    keywords: ['time zone converter', 'ist to est', 'meeting planner', 'world clock', 'ist to pst'] },
  { slug: 'invoice-generator', hidden: true /* not built yet: no component in src/tools */, name: 'Invoice Generator', category: 'utility', icon: ReceiptText, isNew: true,
    short: 'Create and download PDF invoices.',
    description: 'Create a professional invoice with line items, GST or tax and download it as a PDF. Your business details are remembered for next time.',
    keywords: ['invoice generator', 'gst invoice generator', 'free invoice maker', 'invoice pdf', 'bill generator'],
    privacyNote: 'Your business details are saved only in this browser so you don’t have to retype them.' },
  { slug: 'screen-recorder', hidden: true /* not built yet: no component in src/tools */, name: 'Screen Recorder', category: 'utility', icon: ScreenShare, isNew: true,
    short: 'Record your screen with audio.',
    description: 'Record your screen, a window or a browser tab — with microphone audio if you like — and download the video. No install, no watermark.',
    keywords: ['screen recorder', 'online screen recorder', 'record screen', 'screen recorder no watermark'],
    privacyNote: 'The recording stays on your device until you download it.',
    faqs: [{ q: 'Does it work on phones?', a: 'Mobile browsers do not allow websites to record the screen. Use your phone’s built-in screen recorder instead — this tool works on Windows, macOS, Linux and ChromeOS.' }] },
  { slug: 'voice-recorder', hidden: true /* not built yet: no component in src/tools */, name: 'Voice Recorder', category: 'utility', icon: Mic, isNew: true,
    short: 'Record audio from your mic.',
    description: 'Record your voice with one tap, play it back and download it. Works on phones and computers.',
    keywords: ['voice recorder', 'online voice recorder', 'audio recorder', 'record audio online'],
    privacyNote: 'Recordings stay on your device until you download them.' },
];

/** Our other free tool sites — linked from the home page and footers, never duplicated here. */
export const SISTER_SITES = [
  { name: 'JSON Workspace', url: 'https://jsonworkspace.mythosh.com/', short: 'Format, validate, convert and explore JSON.', keywords: ['json', 'formatter', 'validator', 'csv', 'yaml', 'xml', 'developer', 'jwt', 'base64'] },
  { name: 'Free QR Generator', url: 'https://freeqrgenerator.mythosh.com/', short: 'Create QR codes for links, Wi-Fi, UPI and more.', keywords: ['qr', 'qr code', 'barcode', 'upi', 'wifi'] },
];

/** Every tool that is switched on. Everything user-facing reads from this. */
export const TOOLS: Tool[] = ALL_TOOLS.filter(t => !t.hidden);

/** Most-searched tools: the home page "Popular" row and the dock's default shortcuts. */
export const POPULAR_SLUGS = [
  'merge-pdf', 'jpg-to-pdf', 'whatsapp-chat-analyzer', 'resize-image', 'ai-text-cleaner', 'digicam-filter', 'instagram-unfollowers', 'word-counter',
];

const BY_SLUG = new Map(TOOLS.map(t => [t.slug, t]));

export function popularTools(): Tool[] {
  return POPULAR_SLUGS.map(s => BY_SLUG.get(s)).filter((t): t is Tool => !!t);
}

/** Ranked search used by the home page, command palette and dock menu. */
export function searchTools(query: string, list: Tool[] = TOOLS): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const words = q.split(/\s+/);
  const scored: { t: Tool; score: number }[] = [];
  for (const t of list) {
    const name = t.name.toLowerCase();
    const hay = `${name} ${t.short.toLowerCase()} ${t.keywords.join(' ')} ${getCategory(t.category).label.toLowerCase()}`;
    if (!words.every(w => hay.includes(w))) continue;
    let score = 0;
    if (name === q) score += 100;
    else if (name.startsWith(q)) score += 60;
    else if (name.includes(q)) score += 40;
    if (t.keywords.some(k => k.startsWith(q))) score += 25;
    if (words.every(w => name.includes(w))) score += 15;
    scored.push({ t, score });
  }
  return scored.sort((a, b) => b.score - a.score).map(s => s.t);
}

export function getTool(slug: string): Tool | undefined {
  return BY_SLUG.get(slug);
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find(c => c.id === id)!;
}

export function toolsInCategory(id: CategoryId): Tool[] {
  return TOOLS.filter(t => t.category === id);
}

export function relatedTools(tool: Tool, limit = 6): Tool[] {
  return TOOLS.filter(t => t.category === tool.category && t.slug !== tool.slug).slice(0, limit);
}
