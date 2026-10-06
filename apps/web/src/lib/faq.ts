export interface Faq {
  q: string;
  a: string;
}

/**
 * Shared by the rendered FAQ and the FAQPage JSON-LD, so the schema can never
 * claim an answer that is not visible on the page.
 */
export const HOME_FAQS: Faq[] = [
  {
    q: 'Do I need an account to use these tools?',
    a: 'No. All five tools work without signing in. Merge PDF, Split PDF and JPG to PDF run in your browser and are not metered at all. Compress Image and Compress PDF run on our server, where guests get 3 operations a day; a free account raises that to 20 a day.',
  },
  {
    q: 'Which tools upload my files and which do not?',
    a: 'Merge PDF, Split PDF and JPG to PDF do all the work in your browser using JavaScript — the file never leaves your device, which is also why they keep working if your connection drops. Compress Image and Compress PDF send the file to our server, because they use image and PDF libraries that do not run in a browser.',
  },
  {
    q: 'How long do you keep the files I upload?',
    a: 'A compressed PDF is deleted from the server the moment the download is sent back to you — it is never stored. Compressed images are kept so you can fetch them from the download link, then deleted automatically after 24 hours. The three browser-side tools store nothing, because nothing is uploaded.',
  },
  {
    q: 'How do I compress an image to a specific size, like 20 KB or 100 KB?',
    a: 'Open Compress Image and drag the quality slider. The estimated output size updates as you drag, so you can aim for a target before you compress. Lower quality means a smaller file. This is the usual way to get a photo under the size cap on a government or exam application form.',
  },
  {
    q: 'What are the file size and page limits?',
    a: 'For the server-side compressors: guests can send files up to 10 MB and 15 pages per operation, a free account raises that to 25 MB and 50 pages, and Pro to 100 MB with no page limit. The browser-side tools accept PDFs up to 100 MB and images up to 25 MB.',
  },
  {
    q: 'Which image formats are supported?',
    a: 'JPEG (JPG), PNG, WebP and AVIF. The same four work as input to the JPG to PDF converter.',
  },
];
