import { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, MapPin, ExternalLink, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PRIORITIES } from '@/lib/constants';
import { computeOpportunityScore } from '@/lib/gamification';
import { cn, formatDate } from '@/lib/utils';
import type { Application } from '@/types';

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="relative flex size-8 items-center justify-center" title={`Score: ${score}`}>
      <svg viewBox="0 0 28 28" className="size-8 -rotate-90">
        <circle cx="14" cy="14" r={r} fill="none" strokeWidth="2" className="stroke-muted/40" />
        <motion.circle
          cx="14" cy="14" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round"
          className={color.replace('text-', 'stroke-')}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          style={{ strokeDasharray: circ }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className={cn('absolute text-[9px] font-bold tabular-nums', color)}>{score}</span>
    </div>
  );
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  application: Application;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  dragging?: boolean;
}

export const ApplicationCard = forwardRef<HTMLDivElement, Props>(
  ({ application, onEdit, onDelete, onView, dragging, className, ...props }, ref) => {
    const priority = PRIORITIES.find((p) => p.value === application.priority);
    const opp = useMemo(() => computeOpportunityScore(application), [application]);

    return (
      <div
        ref={ref}
        className={cn(
          'group relative cursor-pointer rounded-2xl border bg-card p-4 transition-all duration-300',
          'hover:scale-[1.03] hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] hover:-translate-y-1',
          'dark:hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)]',
          'active:scale-[1.01] active:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.15)]',
          dragging && 'opacity-40 scale-[0.98]',
          className,
        )}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button[data-state]') ||
              (e.target as HTMLElement).closest('[role="menu"]') ||
              (e.target as HTMLElement).closest('[data-radix-collection-item]')) return;
          onView?.();
        }}
        {...props}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug tracking-tight">{application.company}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{application.role}</p>
          </div>
          <div className="flex items-center gap-1">
            <ScoreRing score={opp.score} color={opp.color} />
            <DropdownMenu>
              <DropdownMenuTrigger
                onPointerDown={(e) => e.stopPropagation()}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-secondary hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                {application.jobUrl && (
                  <DropdownMenuItem asChild>
                    <a href={application.jobUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" /> Open job
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(application.location || application.tags.length > 0) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {application.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/80">
                <MapPin className="size-3" />
                {application.location}
              </span>
            )}
            {application.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5" title={`${priority?.label} priority`}>
            <Circle className={cn('size-2 fill-current', priority?.className)} />
            {priority?.label}
          </span>
          {application.appliedDate && (
            <>
              <span className="text-muted-foreground/30">&middot;</span>
              <span className="truncate text-muted-foreground/70">{formatDate(application.appliedDate)}</span>
            </>
          )}
          <span className="text-muted-foreground/30">&middot;</span>
          <span className={cn('font-medium', opp.color)}>{opp.label}</span>
        </div>
      </div>
    );
  },
);
ApplicationCard.displayName = 'ApplicationCard';
