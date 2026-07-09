import { motion } from 'framer-motion';
import { Send, MessageSquare, Trophy, XCircle, Bookmark, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/lib/gamification';

const EVENT_CONFIG: Record<TimelineEvent['type'], { icon: typeof Send; color: string; bg: string; label: string }> = {
  applied: { icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Applied' },
  interview: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', label: 'Interview' },
  offer: { icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Offer' },
  rejected: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/50 border-border/40', label: 'Rejected' },
  saved: { icon: Bookmark, color: 'text-muted-foreground/70', bg: 'bg-muted/30 border-border/30', label: 'Saved' },
};

function formatTimelineDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CareerTimeline({
  events,
  limit = 8,
  onViewAll,
}: {
  events: TimelineEvent[];
  limit?: number;
  onViewAll?: () => void;
}) {
  const shown = events.slice(0, limit);

  if (shown.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground/30">
          <Send className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border/50" />

      <div className="space-y-0.5">
        {shown.map((event, i) => {
          const config = EVENT_CONFIG[event.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex items-start gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-secondary/30"
            >
              <div className={cn(
                'relative z-10 flex size-[34px] shrink-0 items-center justify-center rounded-lg border',
                config.bg,
              )}>
                <Icon className={cn('size-3.5', config.color)} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{event.company}</span>
                  <span className={cn('shrink-0 text-[10px] font-medium', config.color)}>{config.label}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{event.role}</p>
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted-foreground/50">
                {formatTimelineDate(event.date)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {events.length > limit && onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          View all {events.length} events <ChevronRight className="size-3" />
        </button>
      )}
    </div>
  );
}
