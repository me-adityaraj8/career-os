import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;

      if (e.altKey) return;

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('main-content')?.focus();
        return;
      }

      if (e.metaKey || e.ctrlKey) return;

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
        timer.current = setTimeout(() => {
          pending.current = null;
        }, 600);
        return;
      }

      if (key === '?') {
        e.preventDefault();
        window.dispatchEvent(new Event('rys:command-palette'));
        return;
      }

      if (key === 'c') {
        e.preventDefault();
        navigate('/applications');
        setTimeout(() => window.dispatchEvent(new Event('rys:new-application')), 100);
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
