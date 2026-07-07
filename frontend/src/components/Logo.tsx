import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_2px_8px_-2px_hsl(var(--brand)/0.5)]">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
          <path d="M12 12L20 7.5" />
          <path d="M12 12V21" />
          <path d="M12 12L4 7.5" />
        </svg>
      </div>
      {showText && (
        <span className="text-[15px] font-bold tracking-tight">
          Rys
        </span>
      )}
    </div>
  );
}
