import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[92px] w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm leading-relaxed shadow-elev-1 transition-all duration-200 ease-premium placeholder:text-muted-foreground hover:border-border-strong focus-visible:outline-none focus-visible:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
