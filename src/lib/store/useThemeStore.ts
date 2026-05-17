'use client';

import { create } from 'zustand';

export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'cv-theme';

interface ThemeState {
  theme: Theme;
  hydrated: boolean;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  hydrate: () => void;
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // Tailwind class-strategy: 'dark' class enables dark mode, light = no class
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // default จะถูก sync จาก inline script ใน <head> ตอน hydrate
  hydrated: false,

  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
    set({ theme });
  },

  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  hydrate: () => {
    if (typeof window === 'undefined' || get().hydrated) return;
    const isDark = document.documentElement.classList.contains('dark');
    set({ theme: isDark ? 'dark' : 'light', hydrated: true });
  },
}));
