'use client';

/**
 * Small shared UI kit for tool pages, so every tool looks and behaves the same.
 */
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6', className)}>{children}</div>;
}

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return <label htmlFor={htmlFor} className={cn('text-sm font-semibold text-slate-700 mb-1.5 block', className)}>{children}</label>;
}

export const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent disabled:bg-slate-50';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, className)} />;
}

export function TextArea({ className, mono, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea
      spellCheck={mono ? false : undefined}
      {...props}
      className={cn(inputCls, 'resize-y leading-relaxed', mono && 'font-mono text-[13px]', className)}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, 'pr-8 cursor-pointer', className)}>{children}</select>;
}

export function NumberField({
  id, label, value, onChange, prefix, suffix, min, max, step, hint,
}: {
  id: string; label: ReactNode; value: string; onChange: (v: string) => void;
  prefix?: string; suffix?: string; min?: number; max?: number; step?: number | 'any'; hint?: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{prefix}</span>}
        <input
          id={id} type="number" inputMode="decimal" value={value} min={min} max={max} step={step ?? 'any'}
          onChange={e => onChange(e.target.value)}
          className={cn(inputCls, prefix && 'pl-8', suffix && 'pr-14')}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

/** Number input + range slider, for calculators. The slider is clamped to
 *  [min, max] but the input accepts any value. */
export function SliderField({
  id, label, value, onChange, min, max, step = 1, prefix, suffix,
}: {
  id: string; label: ReactNode; value: string; onChange: (v: string) => void;
  min: number; max: number; step?: number; prefix?: string; suffix?: string;
}) {
  const n = Number(value);
  const sliderVal = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
        <div className="relative w-40">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{prefix}</span>}
          <input
            id={id} type="number" inputMode="decimal" value={value} step="any"
            onChange={e => onChange(e.target.value)}
            className={cn(inputCls, 'py-1.5 text-right font-semibold', prefix && 'pl-7', suffix && 'pr-12')}
          />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{suffix}</span>}
        </div>
      </div>
      <input
        type="range" aria-label={typeof label === 'string' ? label : undefined}
        min={min} max={max} step={step} value={sliderVal}
        onChange={e => onChange(e.target.value)}
        className="w-full accent-brand-600"
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value, onChange, options, className, size = 'md',
}: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string; size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1', className)}>
      {options.map(o => (
        <button
          key={o.value} type="button" role="radio" aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg font-semibold transition-colors',
            size === 'sm' ? 'px-2.5 py-1 min-h-8 text-xs' : 'px-3.5 py-1.5 min-h-10 sm:min-h-9 text-sm',
            value === o.value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 min-h-11 sm:min-h-10 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
        variant === 'secondary' && 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
        className,
      )}
    />
  );
}

export function CopyButton({ text, label = 'Copy', className, variant = 'secondary' }: { text: string; label?: string; className?: string; variant?: ButtonVariant }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts / older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant={variant} onClick={copy} disabled={!text} className={className} aria-label={label}>
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );
}

export function Stat({ label, value, sub, highlight, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; highlight?: boolean; className?: string }) {
  return (
    <div className={cn('rounded-xl border p-4', highlight ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200', className)}>
      <div className={cn('text-xs font-medium', highlight ? 'text-brand-100' : 'text-slate-500')}>{label}</div>
      <div className={cn('text-2xl font-black tabular-nums mt-0.5 break-all', highlight ? 'text-white' : 'text-slate-900')}>{value}</div>
      {sub && <div className={cn('text-xs mt-0.5', highlight ? 'text-brand-100' : 'text-slate-400')}>{sub}</div>}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; className?: string }) {
  return (
    <label className={cn('inline-flex items-center gap-2 min-h-9 text-sm text-slate-700 cursor-pointer select-none', className)}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 sm:w-4 sm:h-4 accent-brand-600 rounded shrink-0" />
      {label}
    </label>
  );
}

/**
 * Tap/click-or-drop file picker. Files are read locally, never uploaded.
 * `paste` also accepts an image pasted with Ctrl/⌘+V anywhere on the page.
 */
export function FileDrop({ onFile, onFiles, accept, hint, file, multiple, paste, label, compact }: {
  onFile?: (f: File) => void; onFiles?: (f: File[]) => void; accept?: string; hint?: ReactNode; file?: File | null;
  multiple?: boolean; paste?: boolean; label?: ReactNode; compact?: boolean;
}) {
  const [over, setOver] = useState(false);
  const emit = (list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    if (onFiles) onFiles(multiple ? files : files.slice(0, 1));
    else onFile?.(files[0]);
  };
  const emitRef = useRef(emit);
  emitRef.current = emit;

  useEffect(() => {
    if (!paste) return;
    function onPaste(e: ClipboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'));
      if (files.length) { e.preventDefault(); emitRef.current(files); }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [paste]);

  return (
    <label
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); emit(e.dataTransfer.files); }}
      className={cn(
        'flex flex-col items-center justify-center text-center gap-1.5 rounded-2xl border-2 border-dashed cursor-pointer transition-colors',
        compact ? 'px-4 py-5' : 'px-5 py-10 sm:py-12',
        over ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-300 hover:bg-slate-50',
      )}
    >
      <input type="file" accept={accept} multiple={multiple} className="sr-only" onChange={e => { emit(e.target.files); e.target.value = ''; }} />
      {!file && (
        <span className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl bg-brand-600 text-white text-sm font-semibold mb-1">
          {label ?? (multiple ? 'Choose files' : 'Choose a file')}
        </span>
      )}
      <span className="text-sm font-medium text-slate-700 break-all">
        {file ? file.name : <><span className="hidden sm:inline">or drop {multiple ? 'them' : 'it'} here{paste ? ' · paste with Ctrl+V' : ''}</span><span className="sm:hidden">from your phone or files</span></>}
      </span>
      <span className="text-xs text-slate-500">{file ? `${(file.size / 1024).toFixed(1)} KB · tap to change` : hint ?? 'Read on your device — never uploaded.'}</span>
    </label>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{children}</p>;
}

/** Horizontal split bar, e.g. principal vs interest. */
export function SplitBar({ parts }: { parts: { label: string; value: number; className: string }[] }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {parts.map(p => (
          <div key={p.label} className={p.className} style={{ width: `${(Math.max(0, p.value) / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {parts.map(p => (
          <span key={p.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('w-2.5 h-2.5 rounded-full', p.className)} />
            {p.label} · {Math.round((Math.max(0, p.value) / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}
