/**
 * Long-form content for tool pages: what the tool is for, how to use it and
 * its real limits. Rendered server-side under the tool by ToolShell, and its
 * FAQs join the page's FAQPage structured data.
 *
 * Ported from the earlier "My PDF Hub" work and rewritten to match what each
 * VYOOOM tool actually does. Every claim here must stay true to the component:
 * check the code before editing limits or modes.
 */
import type { Faq } from '@/lib/tools';

export interface ToolStep {
  title: string;
  body: string;
}

export interface ToolContent {
  /** H2 for the article block. */
  heading: string;
  intro: string[];
  steps: ToolStep[];
  limits: string[];
  faqs: Faq[];
}

const LOCAL = 'No daily limit and nothing is uploaded — the work happens on your device.';

export const TOOL_CONTENT: Record<string, ToolContent> = {
  'compress-image': {
    heading: 'About this image compressor',
    intro: [
      'Most upload forms cap the file size rather than the dimensions, so a 4 MB photo straight off a phone gets rejected even though it looks fine. This tool re-encodes the image at a quality you choose, which removes detail the eye barely registers and brings the file size down with it.',
      'Compression runs in your browser on a canvas, so your photos never leave your device and you can compress as many as you like. Add several at once and each one shows its size before and after.',
      'JPEG and WebP files are re-encoded at the quality you set; 70 to 80 is usually where the file gets much smaller and the picture still looks right. PNG is lossless, so the quality slider does not apply and a PNG of a photo will not shrink much — converting it to JPEG first does far more.',
    ],
    steps: [
      { title: 'Add your images', body: 'Drop in JPG, PNG or WebP files, or tap to choose them. You can add several at once.' },
      { title: 'Set the quality', body: 'Lower quality means a smaller file. Around 75–85 is a safe balance for photos.' },
      { title: 'Compress and download', body: 'Each image shows its original and new size, so you can see what you saved. Download them one by one or all together.' },
    ],
    limits: [LOCAL, 'Up to 50 MB per image.', 'PNG files are saved losslessly, so they shrink far less than JPEGs.'],
    faqs: [
      { q: 'How do I reduce an image to 20 KB for a form?', a: 'Lower the quality to around 30–40 and check the new size. Small targets are easier to hit when the image isn’t huge, so crop or resize a very large photo first.' },
      { q: 'Will compressing make my photo blurry?', a: 'At high quality the difference is hard to see. Lower settings start to show soft edges and blocky patches in smooth areas like sky or skin. Always compress from the original, since the loss builds up each time.' },
    ],
  },

  'resize-image': {
    heading: 'About this image resizer',
    intro: [
      'Resizing and compressing are two different jobs. Compressing re-encodes an image at lower quality; resizing changes how many pixels it has. If a portal asks for a photo of an exact size, such as 200 × 230 pixels, this is the tool for it.',
      'Everything runs in your browser on a canvas element. Nothing is uploaded, there is no daily limit, and the original file on your device is never changed.',
      'There are two ways to work. Pixels lets you type an exact width and height, with an aspect-ratio lock so the picture doesn’t come out stretched. Percentage scales the whole image by a factor, the quickest way to halve a photo. The resized image keeps its original format.',
    ],
    steps: [
      { title: 'Add an image', body: 'Drop in a photo or tap to choose one. Its current dimensions and file size are shown straight away.' },
      { title: 'Choose the new size', body: 'Type exact pixels with the aspect lock on or off, or switch to percentage and scale it.' },
      { title: 'Resize and download', body: 'The new dimensions and file size are shown, so you can adjust and try again before downloading.' },
    ],
    limits: [LOCAL, 'One image at a time, up to 50 MB.'],
    faqs: [
      { q: 'How do I resize to an exact size like 200 × 230 pixels?', a: 'Use pixel mode, turn the aspect-ratio lock off, then enter both numbers. With the lock off the image is stretched to fit exactly, so crop to roughly the right shape first if that matters.' },
      { q: 'Will resizing make the image blurry?', a: 'Making an image smaller is generally safe. Making it larger cannot invent detail, so anything scaled well above 100% looks soft. Resize down from the largest original you have.' },
    ],
  },

  'jpg-to-pdf': {
    heading: 'About this JPG to PDF converter',
    intro: [
      'Plenty of application forms and offices only accept a PDF, even when what you have is a phone photo of a document. This tool lays your images out onto PDF pages and saves the result, with no watermark or footer.',
      'Everything happens inside your browser. The images are read with JavaScript and the PDF is assembled on your own device, so nothing is uploaded, there is no daily limit, and it keeps working if your connection drops.',
      'Add several images and drag them into order to build a multi-page document. Each image can be rotated in 90° steps, useful when a phone saved a page sideways. Page size can be A4, Letter or A3, portrait or landscape, with no, small or large margins, and the image can fill the page, fit inside it or keep its original size.',
    ],
    steps: [
      { title: 'Add your images', body: 'Drop in JPG, PNG or WebP files — one per page.' },
      { title: 'Order and rotate', body: 'Drag the thumbnails to reorder, and rotate any image that came out sideways.' },
      { title: 'Choose the page setup', body: 'Pick A4, Letter or A3, portrait or landscape, a margin and how the image fits. Then convert and download.' },
    ],
    limits: [LOCAL, 'Up to 25 MB per image.'],
    faqs: [
      { q: 'Can I put several photos into one PDF?', a: 'Yes. Add them all, drag the thumbnails into order, and you get one PDF with one image per page.' },
      { q: 'Which page size should I use for a government form?', a: 'A4 portrait is the standard for official documents in India and most of the world outside North America. Letter is the US standard. If the instructions don’t say, A4 is the safer choice.' },
      { q: 'Why is my PDF larger than the images I added?', a: 'Images are embedded at their original resolution, so the PDF is roughly the sum of the files. If it needs to be smaller, compress the images first and then convert.' },
    ],
  },

  'merge-pdf': {
    heading: 'About this PDF merger',
    intro: [
      'Documents often arrive in pieces — a form, a photo ID, a certificate, each saved separately — while wherever you’re submitting wants one file. This tool joins them into a single PDF in the order you choose.',
      'The merge runs in your browser using pdf-lib. Your files are read on your own device and the combined PDF is built there too, so nothing is uploaded and there is no daily cap.',
      'Each PDF shows its page count once it loads, a quick way to check you picked the right file. Drag the cards to set the order; the merged document follows it exactly. PDFs with permission restrictions usually still merge.',
    ],
    steps: [
      { title: 'Add your PDFs', body: 'Drop in two or more files. Each shows its page count once loaded.' },
      { title: 'Put them in order', body: 'Drag the cards. The first card becomes the first pages of the merged file.' },
      { title: 'Merge and download', body: 'The combined PDF is built in your browser and saved straight to your device.' },
    ],
    limits: [LOCAL, 'No fixed file limit — very large scans are limited only by your device’s memory.'],
    faqs: [
      { q: 'Does merging reduce the quality of the pages?', a: 'No. Pages are copied across as they are, so text stays selectable and images keep their resolution. The merged file is about as large as the originals combined.' },
      { q: 'Can I merge a password-protected PDF?', a: 'A PDF with permission restrictions usually loads. One that needs a password just to open must be unlocked in a PDF reader first.' },
    ],
  },

  'split-pdf': {
    heading: 'About this PDF splitter',
    intro: [
      'Sometimes you only need part of a document — one page of a bank statement, two pages of a certificate from a longer scan, or one chapter of a report. This tool pulls out just the pages you want.',
      'Every page is shown as a thumbnail first, using PDF.js, so you can see what you’re selecting instead of guessing page numbers. Rendering and splitting both happen in your browser; the file is never uploaded.',
      'There are two modes. Extract lets you tap the pages you want and save them as one PDF. Ranges takes entries like 1-3, 5, 8-10 and saves a separate PDF for each range — the fast way to break one long scan into several documents. The original file is left untouched.',
    ],
    steps: [
      { title: 'Add your PDF', body: 'Drop in one file. Thumbnails of every page appear so you can see what’s in it.' },
      { title: 'Pick pages or ranges', body: 'In Extract mode, tap the pages you want. In Ranges mode, type ranges such as 1-3, 5, 8-10.' },
      { title: 'Split and download', body: 'Extract gives one PDF of your chosen pages. Ranges gives a separate PDF per range.' },
    ],
    limits: [LOCAL, 'One PDF at a time, up to 100 MB.'],
    faqs: [
      { q: 'How do I pull a single page out of a PDF?', a: 'Use Extract mode, tap that page in the thumbnail grid and split. You get a one-page PDF.' },
      { q: 'Can I split one PDF into several files?', a: 'Yes — that’s Ranges mode. Enter ranges separated by commas and you get one PDF per range.' },
      { q: 'Why are the thumbnails slow on a big file?', a: 'Each page is drawn in your browser, so a long or image-heavy scan takes a moment to load. Selecting pages afterwards is instant.' },
    ],
  },

  'pdf-to-images': {
    heading: 'About this PDF to image converter',
    intro: [
      'Sometimes an image is what’s needed, not a document — a page to send in a chat, paste into a slide, or upload to a form that only takes JPG. This tool draws each page of a PDF and saves it as an image.',
      'Rendering is done by PDF.js inside your browser, the same engine Firefox uses to show PDFs. Your file is never uploaded and there is no daily limit.',
      'Resolution matters most: 1× is light and fine for phones, 2× is a sensible default, and 3× stays sharp when printed or zoomed, at the cost of bigger files. Choose JPEG for scans and photos, and PNG for pages of text or line drawings, where it keeps edges crisp.',
    ],
    steps: [
      { title: 'Add a PDF', body: 'Drop in one file, up to 100 MB.' },
      { title: 'Set format and resolution', body: 'Pick JPEG or PNG and a resolution from 1× to 3×, then convert.' },
      { title: 'Download', body: 'Save a single page from its own button, or download every page at once.' },
    ],
    limits: [LOCAL, 'One PDF at a time, up to 100 MB.', 'Long documents at 3× take a while and use a lot of memory, since every page is drawn on your device.'],
    faqs: [
      { q: 'How do I convert just one page of a PDF to JPG?', a: 'Convert the PDF, then use the download button on that page’s thumbnail.' },
      { q: 'Why does my browser ask permission to download several files?', a: 'Saving every page means several downloads, and browsers ask before allowing a batch. Allow it once, or download pages one at a time.' },
    ],
  },
};

export function toolContent(slug: string): ToolContent | undefined {
  return TOOL_CONTENT[slug];
}
