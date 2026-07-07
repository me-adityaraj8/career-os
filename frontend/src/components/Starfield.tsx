import { useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/themeStore';

interface Star {
  x: number; // 0..1 normalized
  y: number;
  r: number; // radius px
  layer: number; // 0 = far/slow, 1 = near/faster
  tw: number; // twinkle phase offset
}

/**
 * Very subtle animated starfield: tiny dots on two parallax layers drifting
 * slowly, with a faint twinkle. Renders behind all content, never intercepts
 * pointer events, and pauses entirely for prefers-reduced-motion users.
 */
export function Starfield({
  density = 1,
  mode,
}: {
  density?: number;
  /** Force star color regardless of app theme (e.g. always-dark panels). */
  mode?: 'light' | 'dark';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appTheme = useThemeStore((s) => s.theme);
  const theme = mode ?? appTheme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function seed() {
      const count = Math.round(((w * h) / 18000) * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 0.9 + 0.4,
        layer: Math.random() < 0.65 ? 0 : 1,
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      const rect = canvas!.parentElement?.getBoundingClientRect();
      w = rect?.width ?? window.innerWidth;
      h = rect?.height ?? window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    // Stars are near-white in dark mode, near-black in light mode.
    const starColor = theme === 'dark' ? '255, 255, 255' : '10, 10, 12';
    const baseAlpha = theme === 'dark' ? 0.35 : 0.18;

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (const s of stars) {
        // Slow horizontal drift; near layer moves slightly faster (parallax).
        const speed = s.layer === 0 ? 0.0022 : 0.005;
        const x = ((s.x + time * speed) % 1) * w;
        const y = s.y * h;
        const twinkle = reduced ? 1 : 0.75 + 0.25 * Math.sin(time * 0.8 + s.tw);
        const alpha = baseAlpha * twinkle * (s.layer === 0 ? 0.6 : 1);
        ctx!.beginPath();
        ctx!.arc(x, y, s.r * (s.layer === 0 ? 0.8 : 1.1), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${starColor}, ${alpha})`;
        ctx!.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if (reduced) {
      draw(0); // single static frame
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [theme, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
