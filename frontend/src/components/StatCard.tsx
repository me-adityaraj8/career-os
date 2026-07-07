import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  return (
    <Card className={cn('transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)]', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <motion.p
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {value}
            </motion.p>
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
