'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Env vars (set in .env.local) ──────────────────────────────────────────────
const DROPBOX_APP_KEY  = process.env['NEXT_PUBLIC_DROPBOX_APP_KEY']  ?? '';
const GOOGLE_API_KEY   = process.env['NEXT_PUBLIC_GOOGLE_API_KEY']   ?? '';
const GOOGLE_CLIENT_ID = process.env['NEXT_PUBLIC_GOOGLE_CLIENT_ID'] ?? '';

// ── Minimal ambient types ─────────────────────────────────────────────────────
declare global {
  interface Window {
    Dropbox?: {
      choose(opts: {
        success: (files: Array<{ name: string; link: string }>) => void;
        cancel?: () => void;
        linkType: 'direct';
        multiselect: boolean;
        extensions?: string[];
      }): void;
    };
    gapi?: {
      load(api: string, cb: () => void): void;
    };
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(cfg: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(): void };
        };
      };
      picker: {
        PickerBuilder: new () => {
          setOAuthToken(token: string): ReturnType<Window['google']['picker']['PickerBuilder']['prototype']['setOAuthToken']>;
          setDeveloperKey(key: string): ReturnType<Window['google']['picker']['PickerBuilder']['prototype']['setDeveloperKey']>;
          addView(view: unknown): ReturnType<Window['google']['picker']['PickerBuilder']['prototype']['addView']>;
          enableFeature(feature: unknown, enabled: boolean): ReturnType<Window['google']['picker']['PickerBuilder']['prototype']['enableFeature']>;
          setCallback(cb: (data: GooglePickerData) => void): ReturnType<Window['google']['picker']['PickerBuilder']['prototype']['setCallback']>;
          build(): { setVisible(v: boolean): void };
        };
        DocsView: new () => {
          setMimeTypes(types: string): unknown;
          setSelectFolderEnabled(v: boolean): unknown;
        };
        Feature: { MULTISELECT_ENABLED: unknown };
        Action: { PICKED: string };
      };
    };
  }
}

interface GooglePickerData {
  action: string;
  docs?: Array<{ id: string; name: string; mimeType: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadScript(src: string, id: string, attrs?: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function urlToFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || 'application/octet-stream' });
}

// ── Dropbox ───────────────────────────────────────────────────────────────────

async function openDropbox(
  onFiles: (files: File[]) => void,
  accept: 'pdf' | 'image',
  multiple: boolean,
  setLoading: (v: boolean) => void,
) {
  if (!DROPBOX_APP_KEY) {
    toast.error('Dropbox is not configured (missing NEXT_PUBLIC_DROPBOX_APP_KEY)');
    return;
  }
  try {
    setLoading(true);
    await loadScript(
      'https://www.dropbox.com/static/api/2/dropins.js',
      'dropboxjs',
      { 'data-app-key': DROPBOX_APP_KEY },
    );
    if (!window.Dropbox) throw new Error('Dropbox SDK failed to load');

    const extensions = accept === 'pdf'
      ? ['.pdf']
      : ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

    window.Dropbox.choose({
      linkType:   'direct',
      multiselect: multiple,
      extensions,
      success: async (picked) => {
        try {
          setLoading(true);
          const files = await Promise.all(
            picked.map((f) => urlToFile(f.link, f.name)),
          );
          onFiles(files);
          toast.success(`Imported ${files.length} file${files.length !== 1 ? 's' : ''} from Dropbox`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to import from Dropbox');
        } finally {
          setLoading(false);
        }
      },
      cancel: () => setLoading(false),
    });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to open Dropbox');
    setLoading(false);
  }
}

// ── Google Drive ──────────────────────────────────────────────────────────────

async function openGoogleDrive(
  onFiles: (files: File[]) => void,
  accept: 'pdf' | 'image',
  multiple: boolean,
  setLoading: (v: boolean) => void,
) {
  if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
    toast.error('Google Drive is not configured (missing NEXT_PUBLIC_GOOGLE_API_KEY / CLIENT_ID)');
    return;
  }
  try {
    setLoading(true);

    await Promise.all([
      loadScript('https://apis.google.com/js/api.js', 'gapi-script'),
      loadScript('https://accounts.google.com/gsi/client', 'gsi-script'),
    ]);

    // Load the picker library
    await new Promise<void>((res) => window.gapi!.load('picker', res));

    // Request an OAuth access token (pops up a Google sign-in consent)
    const accessToken = await new Promise<string>((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (r) => {
          if (r.access_token) resolve(r.access_token);
          else reject(new Error(r.error ?? 'Google auth failed'));
        },
      });
      client.requestAccessToken();
    });

    const mimeTypes =
      accept === 'pdf'
        ? 'application/pdf'
        : 'image/jpeg,image/png,image/webp,image/avif';

    const docsView = new window.google!.picker.DocsView()
      .setMimeTypes(mimeTypes)
      .setSelectFolderEnabled(false);

    let builder = new window.google!.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_API_KEY)
      .addView(docsView)
      .setCallback(async (data: GooglePickerData) => {
        if (data.action !== window.google!.picker.Action.PICKED || !data.docs?.length) {
          setLoading(false);
          return;
        }
        try {
          setLoading(true);
          const files = await Promise.all(
            data.docs.map(async (doc) => {
              const res = await fetch(
                `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                { headers: { Authorization: `Bearer ${accessToken}` } },
              );
              if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
              const blob = await res.blob();
              return new File([blob], doc.name, { type: blob.type || doc.mimeType });
            }),
          );
          onFiles(files);
          toast.success(`Imported ${files.length} file${files.length !== 1 ? 's' : ''} from Google Drive`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to import from Google Drive');
        } finally {
          setLoading(false);
        }
      });

    if (multiple) {
      builder = builder.enableFeature(
        window.google!.picker.Feature.MULTISELECT_ENABLED,
        true,
      );
    }

    builder.build().setVisible(true);
    setLoading(false);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to open Google Drive');
    setLoading(false);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CloudFilePickerProps {
  /** Called with the imported File objects once the user confirms in the picker */
  onFiles: (files: File[]) => void;
  /** Filter what can be picked */
  accept: 'pdf' | 'image';
  /** Allow picking multiple files (default: false) */
  multiple?: boolean;
  className?: string;
}

export function CloudFilePicker({
  onFiles,
  accept,
  multiple = false,
  className,
}: CloudFilePickerProps) {
  const [loadingDropbox, setLoadingDropbox] = useState(false);
  const [loadingDrive,   setLoadingDrive]   = useState(false);

  const loading = loadingDropbox || loadingDrive;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Dropbox */}
      <button
        type="button"
        disabled={loading}
        onClick={() => openDropbox(onFiles, accept, multiple, setLoadingDropbox)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-[#0061FF] hover:bg-[#f0f5ff] text-slate-600 hover:text-[#0061FF] text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Import from Dropbox"
      >
        {loadingDropbox ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <DropboxIcon />
        )}
        Dropbox
      </button>

      {/* Google Drive */}
      <button
        type="button"
        disabled={loading}
        onClick={() => openGoogleDrive(onFiles, accept, multiple, setLoadingDrive)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Import from Google Drive"
      >
        {loadingDrive ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <GoogleDriveIcon />
        )}
        Google Drive
      </button>
    </div>
  );
}

// ── Brand icons ───────────────────────────────────────────────────────────────

function DropboxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L12 6L6 10L0 6L6 2Z" fill="#0061FF"/>
      <path d="M18 2L24 6L18 10L12 6L18 2Z" fill="#0061FF"/>
      <path d="M0 14L6 10L12 14L6 18L0 14Z" fill="#0061FF"/>
      <path d="M24 14L18 10L12 14L18 18L24 14Z" fill="#0061FF"/>
      <path d="M6 19.5L12 15.5L18 19.5L12 23.5L6 19.5Z" fill="#0061FF"/>
    </svg>
  );
}

function GoogleDriveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.433 22l2.033-3.5H22l-2.033 3.5H4.433z" fill="#4285F4"/>
      <path d="M2 18.5L8 8l4 6.928-4 3.072H2z" fill="#0F9D58"/>
      <path d="M16 2L22 12.5l-6 1.5-4-6.928L16 2z" fill="#FBBC04"/>
      <path d="M8 8L16 8l-4 6.928L8 8z" fill="#EA4335"/>
      <path d="M12 14.928L16 8l6 4.5-6 1.5-4 .928z" fill="#4285F4" opacity=".5"/>
    </svg>
  );
}
