import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Animated number that counts up from 0 the first time it scrolls into view. */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
      return controls.stop;
    }
  }, [inView, value, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  // Animate pure numbers and simple "42%" style values; render anything else as-is.
  const numeric =
    typeof value === 'number'
      ? { n: value, suffix: '' }
      : /^\d+%$/.test(value)
        ? { n: parseInt(value, 10), suffix: '%' }
        : null;

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)]',
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {numeric ? <CountUp value={numeric.n} suffix={numeric.suffix} /> : value}
            </p>
            {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
          </div>
          {Icon && (
            <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Icon className="size-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
