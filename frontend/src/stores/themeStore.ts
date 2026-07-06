import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

/** Applies/removes the `dark` class on <html> to drive the CSS variables. */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

/**
 * Theme preference. Persisted locally for instant application on load; also
 * synced to the user's account (dark_mode) by the settings page so it follows
 * them across devices.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'careeros-theme',
      onRehydrateStorage: () => (state) => {
        // Apply persisted theme as soon as the store hydrates.
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
