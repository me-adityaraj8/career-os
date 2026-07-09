import { useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/themeStore';

interface Star {
  x: number;
  y: number;
  r: number;
  layer: number; // 0 = deep/slowest, 1 = mid, 2 = near/fastest
  tw: number;
}

export function Starfield({
  density = 1,
  mode,
}: {
  density?: number;
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
      const count = Math.round(((w * h) / 9000) * density);
      stars = Array.from({ length: count }, () => {
        const rand = Math.random();
        const layer = rand < 0.5 ? 0 : rand < 0.82 ? 1 : 2;
        return {
          x: Math.random(),
          y: Math.random(),
          r: layer === 0 ? Math.random() * 0.5 + 0.2
           : layer === 1 ? Math.random() * 0.7 + 0.3
           : Math.random() * 0.9 + 0.5,
          layer,
          tw: Math.random() * Math.PI * 2,
        };
      });
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

    const starColor = theme === 'dark' ? '255, 255, 255' : '10, 10, 12';
    const baseAlpha = theme === 'dark' ? 0.4 : 0.18;

    const speeds = [0.001, 0.003, 0.006];
    const alphaScale = [0.4, 0.7, 1.0];
    const sizeScale = [0.7, 0.9, 1.15];

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (const s of stars) {
        const speed = speeds[s.layer];
        const x = ((s.x + time * speed) % 1) * w;
        const y = s.y * h;
        const twinkle = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 0.6 + s.tw);
        const alpha = baseAlpha * twinkle * alphaScale[s.layer];
        ctx!.beginPath();
        ctx!.arc(x, y, s.r * sizeScale[s.layer], 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${starColor}, ${alpha})`;
        ctx!.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if (reduced) {
      draw(0);
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
