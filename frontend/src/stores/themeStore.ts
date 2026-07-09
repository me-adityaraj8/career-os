import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  toggleWithTransition: (x: number, y: number) => void;
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

function startCircularTransition(x: number, y: number, apply: () => void): void {
  const doc = document as any;
  if (!doc.startViewTransition) {
    apply();
    return;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  root.style.setProperty('--vt-x', `${x}px`);
  root.style.setProperty('--vt-y', `${y}px`);
  root.style.setProperty('--vt-r', `${endRadius}px`);

  const transition = doc.startViewTransition(apply);

  transition.ready.then(() => {
    root.classList.add('vt-active');
  });

  transition.finished.then(() => {
    root.classList.remove('vt-active');
    root.style.removeProperty('--vt-x');
    root.style.removeProperty('--vt-y');
    root.style.removeProperty('--vt-r');
  });
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
      toggleWithTransition: (x, y) => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        startCircularTransition(x, y, () => {
          applyTheme(next);
          set({ theme: next });
        });
      },
    }),
    {
      name: 'careeros-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
