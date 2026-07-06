import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Career OS wordmark + icon. */
export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Briefcase className="size-4" />
      </div>
      {showText && <span className="text-lg font-semibold tracking-tight">Career OS</span>}
    </div>
  );
}
