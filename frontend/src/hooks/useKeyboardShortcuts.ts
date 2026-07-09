import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (pending.current === 'g') {
        clearTimeout(timer.current);
        pending.current = null;

        const routes: Record<string, string> = {
          d: '/',
          a: '/applications',
          r: '/resumes',
          i: '/interviews',
          n: '/network',
          t: '/ai',
          g: '/goals',
          l: '/analytics',
          s: '/settings',
        };

        if (routes[key]) {
          e.preventDefault();
          navigate(routes[key]);
        }
        return;
      }

      if (key === 'g') {
        pending.current = 'g';
        timer.current = setTimeout(() => { pending.current = null; }, 600);
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer.current);
    };
  }, [navigate]);
}
