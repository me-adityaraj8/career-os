import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Clock,
  AlertTriangle,
  Users,
  Send,
  ChevronRight,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import { useContacts } from '@/hooks/useContacts';
import { useInterviews } from '@/hooks/useInterviews';
import { cn } from '@/lib/utils';

interface Reminder {
  id: string;
  type: 'stale' | 'follow_up' | 'interview' | 'no_update';
  title: string;
  detail: string;
  urgency: 'low' | 'medium' | 'high';
  route: string;
}

function buildReminders(
  apps: any[] | undefined,
  contacts: any[] | undefined,
  interviews: any[] | undefined,
): Reminder[] {
  const reminders: Reminder[] = [];
  const now = Date.now();
  const DAY = 86_400_000;

  (apps ?? []).forEach((a) => {
    if (a.stage === 'rejected' || a.stage === 'offer') return;
    const updated = new Date(a.updatedAt ?? a.createdAt).getTime();
    const daysSince = Math.floor((now - updated) / DAY);
    if (daysSince >= 14 && a.stage === 'applied') {
      reminders.push({
        id: `stale-${a.id}`,
        type: 'stale',
        title: `${a.company} — no update in ${daysSince}d`,
        detail: `Applied for ${a.role}. Consider following up.`,
        urgency: daysSince >= 30 ? 'high' : 'medium',
        route: '/applications',
      });
    }
    if (daysSince >= 7 && (a.stage === 'interview' || a.stage === 'online_assessment')) {
      reminders.push({
        id: `noupdate-${a.id}`,
        type: 'no_update',
        title: `${a.company} — pending ${daysSince}d`,
        detail: `${a.role} is in ${a.stage.replace('_', ' ')} with no recent update.`,
        urgency: 'medium',
        route: '/applications',
      });
    }
  });

  (contacts ?? []).forEach((c) => {
    if (!c.followUp) return;
    if (c.followUpDate) {
      const fDate = new Date(c.followUpDate + 'T12:00:00').getTime();
      const daysUntil = Math.floor((fDate - now) / DAY);
      if (daysUntil <= 2) {
        reminders.push({
          id: `followup-${c.id}`,
          type: 'follow_up',
          title: `Follow up with ${c.name}`,
          detail: daysUntil <= 0 ? 'Overdue' : `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          urgency: daysUntil <= 0 ? 'high' : 'medium',
          route: '/network',
        });
      }
    } else {
      reminders.push({
        id: `followup-${c.id}`,
        type: 'follow_up',
        title: `Follow up with ${c.name}`,
        detail: c.company ? `${c.role ?? ''} @ ${c.company}` : 'No date set',
        urgency: 'low',
        route: '/network',
      });
    }
  });

  (interviews ?? []).forEach((i) => {
    if (i.outcome !== 'pending' || !i.scheduledAt) return;
    const sched = new Date(i.scheduledAt).getTime();
    const hoursUntil = (sched - now) / (1000 * 60 * 60);
    if (hoursUntil > 0 && hoursUntil <= 48) {
      reminders.push({
        id: `interview-${i.id}`,
        type: 'interview',
        title: `Interview in ${hoursUntil < 24 ? `${Math.round(hoursUntil)}h` : `${Math.round(hoursUntil / 24)}d`}`,
        detail: `${i.type.replace(/_/g, ' ')} round`,
        urgency: hoursUntil <= 12 ? 'high' : 'medium',
        route: '/interviews',
      });
    }
  });

  reminders.sort((a, b) => {
    const u = { high: 0, medium: 1, low: 2 };
    return u[a.urgency] - u[b.urgency];
  });

  return reminders;
}

const ICON_MAP = {
  stale: Clock,
  follow_up: Users,
  interview: AlertTriangle,
  no_update: Send,
};

const URGENCY_COLORS = {
  high: 'text-rose-500 bg-rose-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  low: 'text-muted-foreground bg-muted/50',
};

export function SmartReminders() {
  const { data: apps } = useApplications();
  const { data: contacts } = useContacts();
  const { data: interviews } = useInterviews();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const reminders = useMemo(
    () => buildReminders(apps, contacts, interviews),
    [apps, contacts, interviews],
  );

  const hasHigh = reminders.some((r) => r.urgency === 'high');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-4" />
        {reminders.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white',
              hasHigh ? 'bg-rose-500' : 'bg-amber-500',
            )}
          >
            {reminders.length > 9 ? '9+' : reminders.length}
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
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover/95 shadow-elev-3 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Reminders</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {reminders.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Bell className="size-8 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">All caught up!</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {reminders.map((r, i) => {
                      const Icon = ICON_MAP[r.type];
                      return (
                        <motion.button
                          key={r.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => {
                            navigate(r.route);
                            setOpen(false);
                          }}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                        >
                          <div className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', URGENCY_COLORS[r.urgency])}>
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{r.detail}</p>
                          </div>
                          <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/30" />
                        </motion.button>
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
