// Shared by the server layout and the client theme store (kept out of the
// 'use client' module so the server can read these as plain strings).
export const THEME_KEY = 'vyooom:theme';

/** Runs in <head> before first paint so the saved theme never flashes. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;
