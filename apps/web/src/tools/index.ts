/**
 * slug → tool component for every tool served by app/[slug].
 * Each import is code-split, so a page only loads its own tool's code.
 * Every key here must also exist in src/lib/tools.ts. Tools marked `hidden` there
 * keep their entry here but are not routed (see app/[slug]/page.tsx).
 */
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  // PDF
  'merge-pdf':                    dynamic(() => import('./pdf/MergePdf')),
  'split-pdf':                    dynamic(() => import('./pdf/SplitPdf')),
  'jpg-to-pdf':                   dynamic(() => import('./pdf/JpgToPdf')),
  'pdf-to-images':                dynamic(() => import('./pdf/PdfToImages')),
  'rotate-pdf':                   dynamic(() => import('./pdf/RotatePdf')),
  'compress-pdf':                 dynamic(() => import('./pdf/CompressPdf')),        // hidden: needs backend

  // Image
  'compress-image':               dynamic(() => import('./image/CompressImage')),
  'resize-image':                 dynamic(() => import('./image/ResizeImage')),
  'convert-image':                dynamic(() => import('./image/ConvertImage')),
  'rotate-image':                 dynamic(() => import('./image/RotateImage')),
  'watermark-image':              dynamic(() => import('./image/WatermarkImage')),
  'remove-metadata':              dynamic(() => import('./image/RemoveMetadata')),
  'remove-background':            dynamic(() => import('./image/RemoveBackground')), // hidden: third-party CDN + AGPL
  'digicam-filter':               dynamic(() => import('./image/DigicamFilter')),
  'photo-booth':                  dynamic(() => import('./image/PhotoBoothStrip')),
  'screenshot-beautifier':        dynamic(() => import('./image/ScreenshotBeautifier')),

  // Social & viral
  'whatsapp-chat-analyzer':       dynamic(() => import('./social/WhatsAppChatAnalyzer')),
  'instagram-unfollowers':        dynamic(() => import('./social/InstagramUnfollowers')),

  // AI
  'ai-photo-prompts':             dynamic(() => import('./ai/AiPhotoPrompts')),
  'ai-text-cleaner':              dynamic(() => import('./ai/AiTextCleaner')),
  'ai-token-counter':             dynamic(() => import('./ai/AiTokenCounter')),
  'prompt-builder':               dynamic(() => import('./ai/PromptBuilder')),
  'markdown-converter':           dynamic(() => import('./ai/MarkdownConverter')),

  // Calculators
  'emi-calculator':               dynamic(() => import('./calc/EmiCalculator')),
  'sip-calculator':               dynamic(() => import('./calc/SipCalculator')),
  'gst-calculator':               dynamic(() => import('./calc/GstCalculator')),
  'age-calculator':               dynamic(() => import('./calc/AgeCalculator')),
  'date-difference-calculator':   dynamic(() => import('./calc/DateDifference')),
  'bmi-calculator':               dynamic(() => import('./calc/BmiCalculator')),
  'percentage-calculator':        dynamic(() => import('./calc/PercentageCalculator')),
  'compound-interest-calculator': dynamic(() => import('./calc/CompoundInterest')),
  'discount-calculator':          dynamic(() => import('./calc/DiscountCalculator')),
  'unit-converter':               dynamic(() => import('./calc/UnitConverter')),

  // Text
  'word-counter':                 dynamic(() => import('./text/WordCounter')),
  'case-converter':               dynamic(() => import('./text/CaseConverter')),
  'remove-line-breaks':           dynamic(() => import('./text/RemoveLineBreaks')),
  'remove-duplicate-lines':       dynamic(() => import('./text/RemoveDuplicateLines')),
  'diff-checker':                 dynamic(() => import('./text/DiffChecker')),
  'find-and-replace':             dynamic(() => import('./text/FindReplace')),
  'lorem-ipsum-generator':        dynamic(() => import('./text/LoremIpsum')),
  'fancy-text-generator':         dynamic(() => import('./text/FancyText')),
  'text-to-speech':               dynamic(() => import('./text/TextToSpeech')),
  'online-notepad':               dynamic(() => import('./text/Notepad')),
  'character-counter':            dynamic(() => import('./text/CharacterCounter')),
  'citation-generator':           dynamic(() => import('./text/CitationGenerator')),
  'text-to-handwriting':          dynamic(() => import('./text/TextToHandwriting')),

  // Everyday utilities
  'password-generator':           dynamic(() => import('./utility/PasswordGenerator')),
};
