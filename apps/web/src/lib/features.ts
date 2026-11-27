/**
 * Feature switches for things that depend on outside services.
 * Everything here is off while VYOOOM runs with no backend and no API keys.
 */
export const FEATURES = {
  /** "Import from Google Drive / Dropbox" buttons. Needs NEXT_PUBLIC_GOOGLE_* / NEXT_PUBLIC_DROPBOX_APP_KEY. */
  cloudImport: false,
} as const;
