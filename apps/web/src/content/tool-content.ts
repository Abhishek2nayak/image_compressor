import type { Faq } from '@/lib/faq';

export interface Step {
  title: string;
  body: string;
}

export interface ToolContent {
  /** H2 for the article block. */
  heading: string;
  /** Lead paragraphs. */
  intro: string[];
  steps: Step[];
  limits: string[];
  faqs: Faq[];
}

export const TOOL_CONTENT: Record<string, ToolContent> = {
  '/compress-image': {
    heading: 'About this image compressor',
    intro: [
      'Most upload forms cap the file size rather than the dimensions, so a 4 MB photo straight off a phone gets rejected even though it looks fine. This tool re-encodes the image at a quality setting you choose, which removes detail the eye barely registers and brings the file size down with it.',
      'The quality slider runs from 1 to 100 and shows an estimated output size as you drag, so you can aim at a target before you commit. If you need a photo under 20 KB for an application form, or a JPG under 100 KB for a portal upload, start around 40 and adjust from there. For images going on a website, 70 to 80 is usually the point where the file gets meaningfully smaller and the picture still looks right.',
      'JPEG, PNG, WebP and AVIF are all accepted. PNG is lossless, so a PNG full of flat colour and transparency will not shrink as much as a photo will — if the image is a photograph saved as PNG, converting it to JPEG first will do far more than any quality setting.',
    ],
    steps: [
      {
        title: 'Add your images',
        body: 'Drag up to 20 files onto the drop zone, or click to browse. You can also pull a file in from Google Drive.',
      },
      {
        title: 'Set the quality',
        body: 'Drag the slider and watch the estimated output size. Lower means a smaller file; the label tells you roughly where you are on the quality scale.',
      },
      {
        title: 'Compress and download',
        body: 'Each image is processed separately and appears with its before and after size, so you can see what you actually saved. Download them one by one as they finish.',
      },
    ],
    limits: [
      'Up to 20 images per batch.',
      'As a guest: 3 operations a day and 10 MB per file. Signed in: 20 a day and 25 MB. Pro: unlimited, up to 100 MB.',
      'This tool uploads your image to our server, because the encoder does not run in a browser. Originals and compressed copies are deleted automatically after 24 hours.',
    ],
    faqs: [
      {
        q: 'How do I reduce an image to 20 KB for a form?',
        a: 'Drag the quality slider down to roughly 30–40 and check the estimated size shown beside it. Small target sizes are easier to hit when the image is not huge to begin with, so if the photo is very large, crop it to just the area you need first.',
      },
      {
        q: 'Will compressing make my photo blurry?',
        a: 'At high quality settings the difference is hard to see. As you go lower you will start to notice soft edges and blocky patches, most visibly in smooth areas like skin or sky. Compress from the original file rather than from an already-compressed copy, since the loss builds up each time.',
      },
      {
        q: 'Can I compress a PNG without losing transparency?',
        a: 'Yes. PNG compression here is lossless and the alpha channel is preserved, so transparency survives. The trade-off is that the savings on a PNG are usually smaller than on a JPEG.',
      },
    ],
  },

  '/jpg-to-pdf': {
    heading: 'About this JPG to PDF converter',
    intro: [
      'Plenty of application forms and office workflows will only take a PDF, even when what you have is a phone photo of a document. This tool lays your images out onto PDF pages and saves the result, without adding a watermark or a footer.',
      'Everything happens inside your browser. The images are read with JavaScript and the PDF is assembled on your own device, which means nothing is uploaded, there is no daily limit, and the tool keeps working if your connection drops partway through.',
      'You can add several images and drag them into the order you want, which matters when you are putting together a multi-page document from separate photos. Each image can be rotated in 90 degree steps, useful when a phone has saved a page sideways. Page size can be A4, Letter or A3, in portrait or landscape, and you can set how the image sits on the page: filling it, fitting inside it, or keeping its own proportions.',
    ],
    steps: [
      {
        title: 'Add your images',
        body: 'Drop in JPEG, PNG, WebP or AVIF files. Add as many as you need — one per page.',
      },
      {
        title: 'Order and rotate',
        body: 'Drag the thumbnails to reorder. Use the rotate buttons on any image that came out sideways.',
      },
      {
        title: 'Choose the page setup',
        body: 'Pick A4, Letter or A3, portrait or landscape, a margin, and how the image should fit the page. Then convert and download.',
      },
    ],
    limits: [
      'No daily limit — this tool runs entirely in your browser.',
      'Up to 25 MB per image.',
      'Nothing is uploaded, so nothing is stored.',
    ],
    faqs: [
      {
        q: 'Can I put several photos into one PDF?',
        a: 'Yes. Add all of them, drag the thumbnails into the order you want, and you get a single PDF with one image per page.',
      },
      {
        q: 'Which page size should I use for a government form?',
        a: 'A4 portrait is the standard size for official documents in India and most of the world outside North America. Letter is the US standard. If the instructions do not say, A4 is the safer default.',
      },
      {
        q: 'Why is my PDF larger than the images I added?',
        a: 'The images are embedded at their original resolution, so the PDF is roughly the sum of the files plus a little overhead. If the result needs to be smaller, compress the images first and then convert.',
      },
    ],
  },

  '/merge-pdf': {
    heading: 'About this PDF merger',
    intro: [
      'Documents often arrive in pieces — a form, a photo ID, a certificate, each saved separately — while whatever you are submitting to wants one file. This tool joins them into a single PDF in the order you choose.',
      'The merge runs in your browser using pdf-lib. Your files are read on your own device and the combined PDF is built there too, so nothing is uploaded to a server and there is no daily cap on how many times you can use it.',
      'As you add each PDF the tool reads how many pages it has and shows the count on the card, which is a quick way to confirm you picked the right file before merging. Drag the cards to set the order; the merged document follows that order exactly, top to bottom. Encrypted PDFs are loaded where possible, so a file with a permissions flag set will usually still merge.',
    ],
    steps: [
      {
        title: 'Add your PDFs',
        body: 'Drop in two or more files. Each one shows its page count once it has loaded.',
      },
      {
        title: 'Put them in order',
        body: 'Drag the cards up and down. The first card becomes the first pages of the merged file.',
      },
      {
        title: 'Merge and download',
        body: 'Click merge and the combined PDF is built in your browser, then saved straight to your device.',
      },
    ],
    limits: [
      'No daily limit — this tool runs entirely in your browser.',
      'Up to 100 MB per file.',
      'Nothing is uploaded, so nothing is stored.',
    ],
    faqs: [
      {
        q: 'Does merging reduce the quality of the pages?',
        a: 'No. The pages are copied across as they are, so text stays selectable and images keep their original resolution. The merged file is about as large as the originals added together.',
      },
      {
        q: 'Can I merge a password-protected PDF?',
        a: 'A PDF with permission restrictions will usually load. One that needs a password just to open has to be unlocked in a PDF reader first — the tool cannot read its contents without the password.',
      },
      {
        q: 'Is there a limit on how many PDFs I can combine?',
        a: 'There is no fixed count. The practical limit is your device memory, since the merge happens locally. Very large scanned files are the ones to watch.',
      },
    ],
  },

  '/split-pdf': {
    heading: 'About this PDF splitter',
    intro: [
      'Sometimes you only need part of a document — one page of a bank statement, the two pages of a certificate out of a longer scan, or a chapter from a report. This tool pulls out the pages you want instead of making you send the whole file.',
      'Every page is rendered as a thumbnail first, using PDF.js, so you can see what you are selecting rather than guessing at page numbers. The rendering and the splitting both happen in your browser; the file is never uploaded, and there is no daily limit.',
      'There are two ways to work. Extract mode lets you click the pages you want and save just those. Range mode takes ranges like 1-3, 5, 8-10 and produces a separate PDF for each range, which is the faster route when you are breaking one long scan into several documents. Either way the original file on your device is left untouched.',
    ],
    steps: [
      {
        title: 'Add your PDF',
        body: 'Drop in one file. Thumbnails of every page are rendered so you can see what is in it.',
      },
      {
        title: 'Pick pages or ranges',
        body: 'In extract mode, click the pages you want. In range mode, type ranges such as 1-3, 5, 8-10.',
      },
      {
        title: 'Split and download',
        body: 'Extract gives you one PDF with the pages you chose. Ranges give you a separate PDF per range.',
      },
    ],
    limits: [
      'No daily limit — this tool runs entirely in your browser.',
      'Up to 100 MB per file.',
      'Nothing is uploaded, so nothing is stored.',
    ],
    faqs: [
      {
        q: 'How do I pull a single page out of a PDF?',
        a: 'Use extract mode, click that one page in the thumbnail grid, and split. You get a one-page PDF containing just it.',
      },
      {
        q: 'Can I split one PDF into several separate files?',
        a: 'Yes — that is what range mode does. Enter the ranges separated by commas and you get one PDF per range, all downloaded together.',
      },
      {
        q: 'Why are the thumbnails slow on a big file?',
        a: 'Each page is being drawn in your browser, so a long or image-heavy scan takes a moment. It is a one-time cost when the file loads; selecting pages afterwards is instant.',
      },
    ],
  },

  '/compress-pdf': {
    heading: 'About this PDF compressor',
    intro: [
      'Upload forms and email attachments usually have a size cap, and a scanned PDF can easily run past it. This tool rebuilds the internal structure of the file — the way objects are stored and cross-referenced — to bring the size down without touching the page content.',
      'There are three levels. Low re-saves the file and normalises its structure, which is the safest option and keeps all metadata. Medium turns on object stream compression, and is the setting to reach for most of the time. High does that and also strips the document metadata — title, author, producer, timestamps — for the smallest result.',
      'How much you save depends almost entirely on what is inside. A PDF produced by a word processor or exported from a design tool often has redundancy to remove and can shrink noticeably. A PDF that is really a stack of scanned photographs is mostly image data already, so expect a modest saving — in that case, compressing the images before converting them to PDF will do far more.',
      'Unlike the merge, split and JPG to PDF tools, this one uploads your file, because the work happens on our server. The uploaded copy is deleted as soon as the compressed version is sent back to you.',
    ],
    steps: [
      {
        title: 'Add your PDF',
        body: 'Drop in one file, up to 100 MB. You can also bring one in from Google Drive.',
      },
      {
        title: 'Choose a level',
        body: 'Low to stay closest to the original, medium for the usual balance, high for the smallest file and no metadata.',
      },
      {
        title: 'Compress and download',
        body: 'The result shows the original size, the new size and the percentage saved, so you can try another level if you need more.',
      },
    ],
    limits: [
      'One file at a time, up to 100 MB.',
      'As a guest: 3 operations a day, 10 MB per file and 15 pages. Signed in: 20 a day, 25 MB and 50 pages. Pro: unlimited, up to 100 MB with no page limit.',
      'Your file is uploaded for processing and deleted from the server as soon as the download is sent. It is never stored.',
    ],
    faqs: [
      {
        q: 'How do I get a PDF under 100 KB?',
        a: 'Try high first and look at the resulting size. If it is still too big, the bulk is almost certainly scanned images rather than structure — compress those images individually and rebuild the PDF, which gets you much further than any setting here.',
      },
      {
        q: 'Will the text still be selectable afterwards?',
        a: 'Yes. None of the three levels rasterises or rewrites the page content, so text stays as text and stays searchable.',
      },
      {
        q: 'Why did my file barely get smaller?',
        a: 'The compression works on how the PDF stores its objects, not on the images inside it. A scan-heavy PDF is already mostly compressed image data, so there is little structural overhead left to remove.',
      },
    ],
  },
};
