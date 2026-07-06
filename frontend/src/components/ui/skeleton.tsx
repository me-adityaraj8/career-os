import { cn } from '@/lib/utils';

/** Pulsing placeholder used for loading states instead of bare spinners. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
