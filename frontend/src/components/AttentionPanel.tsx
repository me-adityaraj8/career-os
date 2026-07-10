import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Clock, AlertTriangle, Users, Send, Trophy, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const URGENCY_LABEL: Record<Urgency, string> = {
  high: 'Now',
  medium: 'Soon',
  low: 'Whenever',
};

/**
 * The dashboard's action queue: everything the attention engine thinks you
 * should do today, deep-linked to the exact record. Same data as the bell.
 */
export function AttentionPanel() {
  const items = useAttention();
  const navigate = useNavigate();
  const top = items.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
          <Bell className="size-4 text-muted-foreground" />
          Needs attention
          {items.length > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {items.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {top.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <span className="text-muted-foreground">
              All caught up — nothing in your pipeline needs a nudge today.
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {top.map((r, i) => {
              const Icon = ICON_MAP[r.type];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/40"
                >
                  <button
                    onClick={() => navigate(r.route)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', URGENCY_COLORS[r.urgency])}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.detail}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        URGENCY_COLORS[r.urgency],
                      )}
                    >
                      {URGENCY_LABEL[r.urgency]}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/30" />
                  </button>
                  <button
                    aria-label="Snooze until tomorrow"
                    title="Snooze until tomorrow"
                    onClick={() => snoozeAttentionItem(r.id)}
                    className="rounded-md p-1.5 text-muted-foreground/0 transition-colors hover:bg-secondary hover:!text-foreground group-hover:text-muted-foreground/60"
                  >
                    <X className="size-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
