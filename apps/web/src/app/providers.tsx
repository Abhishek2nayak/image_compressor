'use client';

import { Toaster } from 'sonner';
import { useThemeChoice } from '@/lib/prefs';

// Auth and React Query were removed while the backend is off: no visible tool
// uses them, and dropping them keeps them out of every page's JavaScript.
// The previous version is kept at app/_disabled/providers.with-auth.tsx.
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeChoice();
  return (
    <>
      {children}
      <Toaster position="top-center" richColors theme={theme} />
    </>
  );
}
