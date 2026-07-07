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
        'group hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elev-2',
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-lg border bg-secondary/50 text-muted-foreground/70 transition-colors duration-300 group-hover:text-foreground">
              <Icon className="size-4" />
            </div>
          )}
        </div>
        <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">
          {numeric ? <CountUp value={numeric.n} suffix={numeric.suffix} /> : value}
        </p>
        {sublabel && <p className="mt-2 text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
