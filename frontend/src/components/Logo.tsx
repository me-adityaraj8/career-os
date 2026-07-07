import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
        <Briefcase className="size-4" />
      </div>
      {showText && (
        <span className="text-[15px] font-bold tracking-tight">
          Career<span className="text-muted-foreground">OS</span>
        </span>
      )}
    </div>
  );
}
