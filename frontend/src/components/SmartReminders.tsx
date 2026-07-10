import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, AlertTriangle, Users, Send, Trophy, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAttention } from '@/hooks/useAttention';
import { snoozeAttentionItem, type AttentionType, type Urgency } from '@/lib/attention';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<AttentionType, typeof Bell> = {
  follow_up_app: Clock,
  pending_stage: Send,
  contact_due: Users,
  interview_soon: AlertTriangle,
  offer_open: Trophy,
};

const URGENCY_COLORS: Record<Urgency, string> = {
  high: 'text-rose-500 bg-rose-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  low: 'text-muted-foreground bg-muted/50',
};

export function SmartReminders() {
  const items = useAttention();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const hasHigh = items.some((r) => r.urgency === 'high');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Reminders${items.length ? ` (${items.length})` : ''}`}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-4" />
        {items.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white',
              hasHigh ? 'bg-rose-500' : 'bg-amber-500',
            )}
          >
            {items.length > 9 ? '9+' : items.length}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border bg-popover/95 shadow-elev-3 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Needs attention</h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-md p-1 text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Bell className="size-8 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">All caught up!</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {items.map((r, i) => {
                      const Icon = ICON_MAP[r.type];
                      return (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                        >
                          <button
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                            onClick={() => {
                              navigate(r.route);
                              setOpen(false);
                            }}
                          >
                            <div className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', URGENCY_COLORS[r.urgency])}>
                              <Icon className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{r.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{r.detail}</p>
                            </div>
                            <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/30" />
                          </button>
                          <button
                            aria-label="Snooze until tomorrow"
                            title="Snooze until tomorrow"
                            onClick={() => snoozeAttentionItem(r.id)}
                            className="mt-1 rounded-md p-1 text-muted-foreground/0 transition-colors hover:bg-secondary hover:!text-foreground group-hover:text-muted-foreground/60"
                          >
                            <X className="size-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
