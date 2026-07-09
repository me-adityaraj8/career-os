import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  MoreVertical,
  CheckCircle2,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GoalDialog } from '@/components/goals/GoalDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useGoals, useDeleteGoal } from '@/hooks/useGoals';
import { useApplications } from '@/hooks/useApplications';
import { toast } from '@/stores/toastStore';
import type { Goal } from '@/types';
import {
  buildDailyActivity,
  buildHeatmap,
  computeStreaks,
  computeXP,
  enrichGoals,
  buildMissions,
  generateCoachTips,
  computeWeeklyInsights,
  HEALTH_CONFIG,
  type HeatmapCell,
  type CoachTip,
} from '@/lib/gamification';
import { fireConfetti } from '@/lib/confetti';

const PERIOD_LABEL: Record<Goal['period'], string> = {
  week: 'this week',
  month: 'this month',
  all_time: 'all time',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const HEATMAP_COLORS = [
  'bg-muted/60',
  'bg-[var(--viz-seq-1)]/40',
  'bg-[var(--viz-seq-2)]/60',
  'bg-[var(--viz-seq-3)]/80',
  'bg-[var(--viz-1)]',
];

function HeatmapGrid({ grid }: { grid: HeatmapCell[][] }) {
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      <div className="flex shrink-0 flex-col gap-1 pr-1 pt-5">
        {dayLabels.map((l, i) => (
          <div key={i} className="flex h-[13px] items-center text-[9px] text-muted-foreground/60">
            {l}
          </div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {wi % 4 === 0 ? (
            <div className="mb-0.5 text-[9px] text-muted-foreground/50">
              {new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })}
            </div>
          ) : (
            <div className="mb-0.5 h-[13px]" />
          )}
          {week.map((cell) => (
            <div
              key={cell.date}
              className={cn('size-[13px] rounded-[3px] transition-colors', HEATMAP_COLORS[cell.level])}
              title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'activity' : 'activities'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CoachCard({ tips }: { tips: CoachTip[] }) {
  if (tips.length === 0) return null;
  const icons = { warning: AlertTriangle, success: CheckCircle2, suggestion: Lightbulb };
  const colors = {
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    suggestion: 'text-blue-500',
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
          <Sparkles className="size-4 text-muted-foreground" />
          AI Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        {tips.map((tip, i) => {
          const Icon = icons[tip.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 rounded-lg border border-border/40 bg-secondary/30 p-3 text-sm"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', colors[tip.type])} />
              <span className="text-muted-foreground">{tip.message}</span>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading: goalsLoading, isError } = useGoals();
  const { data: applications } = useApplications();
  const del = useDeleteGoal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);

  const apps = applications ?? [];
  const daily = buildDailyActivity(apps);
  const heatmap = buildHeatmap(daily);
  const streaks = computeStreaks(daily);
  const xp = computeXP(apps);
  const enriched = enrichGoals(goals ?? []);
  const missions = buildMissions(goals ?? []);
  const coachTips = generateCoachTips(enriched, streaks, xp, apps);
  const insights = computeWeeklyInsights(apps);
  const completedCount = enriched.filter((g) => g.health === 'completed').length;

  const prevCompleted = useRef(completedCount);
  useEffect(() => {
    if (completedCount > prevCompleted.current && prevCompleted.current >= 0) {
      fireConfetti();
    }
    prevCompleted.current = completedCount;
  }, [completedCount]);

  const isLoading = goalsLoading;

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Goals"
        description="Track progress, build streaks, and level up your career."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> New goal
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {isError && (
        <EmptyState icon={Target} title="Couldn't load goals" description="Please refresh to try again." />
      )}

      {!isLoading && !isError && (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
          {/* ── Stat tiles ── */}
          <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:-translate-y-0.5 hover:shadow-elev-2">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-muted-foreground">Streak</p>
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-secondary/50 text-orange-500">
                    <Flame className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                  {streaks.current}
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">days</span>
                </p>
                {streaks.longest > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Best: {streaks.longest} days</p>
                )}
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-0.5 hover:shadow-elev-2">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-muted-foreground">Career XP</p>
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-secondary/50 text-violet-500">
                    <Zap className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                  {xp.total.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${xp.progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{xp.levelName}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-0.5 hover:shadow-elev-2">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-muted-foreground">Goals Met</p>
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-secondary/50 text-emerald-500">
                    <Target className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                  {completedCount}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ {enriched.length}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:-translate-y-0.5 hover:shadow-elev-2">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-muted-foreground">This Week</p>
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-secondary/50 text-muted-foreground/70">
                    {insights[0]?.trend === 'up' ? (
                      <TrendingUp className="size-4 text-emerald-500" />
                    ) : insights[0]?.trend === 'down' ? (
                      <TrendingDown className="size-4 text-red-500" />
                    ) : (
                      <Minus className="size-4" />
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                  {insights[0]?.thisWeek ?? 0}
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">apps</span>
                </p>
                {insights[0] && insights[0].change !== 0 && (
                  <p className={cn('mt-2 text-xs', insights[0].trend === 'up' ? 'text-emerald-500' : 'text-red-500')}>
                    {insights[0].change > 0 ? '+' : ''}{insights[0].change}% vs last week
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Today's Mission ── */}
          {missions.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <ListChecks className="size-4 text-muted-foreground" />
                    Today's Mission
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="flex flex-wrap gap-3">
                    {missions.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition-colors',
                          m.done
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                            : 'border-border/60 bg-secondary/30 text-foreground',
                        )}
                      >
                        <div className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          m.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border'
                        )}>
                          {m.done && <CheckCircle2 className="size-3" />}
                        </div>
                        <span className="font-medium">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Heatmap + AI Coach ── */}
          <div className="grid gap-6 lg:grid-cols-5">
            <motion.div variants={fadeUp} className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <Target className="size-4 text-muted-foreground" />
                    Activity
                    <span className="text-xs font-normal text-muted-foreground">Last 20 weeks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <HeatmapGrid grid={heatmap} />
                  <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/60">
                    <span>Less</span>
                    {HEATMAP_COLORS.map((c, i) => (
                      <div key={i} className={cn('size-[11px] rounded-[2px]', c)} />
                    ))}
                    <span>More</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="lg:col-span-2">
              <CoachCard tips={coachTips} />
            </motion.div>
          </div>

          {/* ── Goals grid with health badges ── */}
          {enriched.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Your Goals</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {enriched.map((g, i) => {
                  const percent = Math.min(100, Math.round((g.progress / g.target) * 100));
                  const done = g.progress >= g.target;
                  const health = HEALTH_CONFIG[g.health];
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="group hover:-translate-y-0.5 hover:shadow-elev-2">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">{g.title}</p>
                                <Badge
                                  variant="secondary"
                                  className={cn('shrink-0 text-[10px] font-medium', health.color, health.bg)}
                                >
                                  {health.label}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                                {g.metric} · {PERIOD_LABEL[g.period]}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-secondary">
                                <MoreVertical className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditing(g); setDialogOpen(true); }}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleting(g)} className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 font-medium">
                                {done && <CheckCircle2 className="size-4 text-emerald-500" />}
                                {g.progress} / {g.target}
                              </span>
                              <span className="text-muted-foreground">{percent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className={cn('h-full rounded-full', done ? 'bg-emerald-500' : 'bg-[var(--viz-1)]')}
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                              />
                            </div>
                          </div>

                          {!done && (
                            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                              {g.eta && (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  ETA {g.eta}
                                </span>
                              )}
                              {g.daysRemaining !== null && (
                                <span>{g.daysRemaining}d remaining</span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {enriched.length === 0 && (
            <motion.div variants={fadeUp}>
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Set a goal like '20 applications this month' and track it automatically."
                action={
                  <Button onClick={openAdd}>
                    <Plus className="size-4" /> New goal
                  </Button>
                }
              />
            </motion.div>
          )}

          {/* ── Weekly Insights ── */}
          {insights.some((i) => i.thisWeek > 0 || i.lastWeek > 0) && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <TrendingUp className="size-4 text-muted-foreground" />
                    This Week vs Last Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {insights.map((ins) => (
                      <div key={ins.metric} className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/20 p-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{ins.metric}</p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-xl font-semibold tabular-nums">{ins.thisWeek}</span>
                            <span className="text-xs text-muted-foreground">from {ins.lastWeek}</span>
                          </div>
                        </div>
                        {ins.change !== 0 && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs font-medium',
                              ins.trend === 'up'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400',
                            )}
                          >
                            {ins.trend === 'up' ? (
                              <TrendingUp className="mr-1 size-3" />
                            ) : (
                              <TrendingDown className="mr-1 size-3" />
                            )}
                            {Math.abs(ins.change)}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete goal?"
        description={deleting ? `This will remove "${deleting.title}".` : ''}
        onConfirm={async () => {
          if (!deleting) return;
          await del.mutateAsync(deleting.id);
          toast({ title: 'Goal deleted', variant: 'success' });
        }}
      />
    </div>
  );
}
