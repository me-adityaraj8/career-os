import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send,
  MessageSquare,
  Trophy,
  Target,
  Calendar,
  ArrowRight,
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MissionList } from '@/components/missions/MissionList';
import { AttentionPanel } from '@/components/AttentionPanel';
import { useAuthStore } from '@/stores/authStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useGoals } from '@/hooks/useGoals';
import { useInterviews } from '@/hooks/useInterviews';
import { useApplications } from '@/hooks/useApplications';
import { useMissions } from '@/hooks/useMissions';
import { cn, formatDate } from '@/lib/utils';
import { INTERVIEW_TYPE_COLORS, INTERVIEW_TYPE_LABEL } from '@/lib/constants';
import {
  buildDailyActivity,
  buildTimeline,
  computeStreaks,
  computeXP,
} from '@/lib/gamification';
import { CareerTimeline } from '@/components/CareerTimeline';
import type { InterviewType } from '@/types';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: analytics, isLoading } = useAnalytics();
  const { data: goals } = useGoals();
  const { data: interviews } = useInterviews();
  const { data: applications } = useApplications();
  const { data: missionData } = useMissions();

  const apps = applications ?? [];
  const daily = buildDailyActivity(apps);
  const streaks = computeStreaks(daily);
  const xp = computeXP(apps);

  const timeline = buildTimeline(apps);
  const missionStreak = missionData?.streak;

  const upcomingInterviews = (interviews ?? [])
    .filter((r) => r.scheduledAt && new Date(r.scheduledAt) >= new Date() && r.outcome === 'pending')
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 4);

  const appById = new Map((applications ?? []).map((a) => [a.id, a]));

  const empty = !isLoading && analytics && analytics.totals.applications === 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${greeting()}${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here's your job search at a glance."
        actions={
          <Button asChild>
            <Link to="/applications">
              <Plus className="size-4" /> Add application
            </Link>
          </Button>
        }
      />

      {empty && (
        <EmptyState
          icon={Send}
          title="Let's get started"
          description="Add your first application to unlock your dashboard, analytics, and AI tools."
          action={
            <Button asChild>
              <Link to="/applications">
                <Plus className="size-4" /> Add your first application
              </Link>
            </Button>
          }
        />
      )}

      {!empty && (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10">
          {/* Stat cards */}
          <motion.div variants={fadeUp} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading || !analytics ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            ) : (
              <>
                <StatCard label="Applications" value={analytics.totals.applications} icon={Send} />
                <StatCard label="In Interview" value={analytics.totals.interviews} icon={MessageSquare} />
                <StatCard label="Offers" value={analytics.totals.offers} icon={Trophy} />
                <StatCard label="Interview Rate" value={`${analytics.rates.interviewRate}%`} icon={TrendingUp} />
              </>
            )}
          </motion.div>

          {/* Streak + XP compact strip — clickable → Goals page */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/goals')}
              className="flex items-center gap-2 rounded-xl border bg-secondary/30 px-4 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-elev-1"
            >
              <Flame className="size-4 text-orange-500" />
              <span className="font-semibold tabular-nums">{missionStreak?.current ?? streaks.current}</span>
              <span className="text-muted-foreground">day streak</span>
            </button>
            <button
              onClick={() => navigate('/goals')}
              className="flex items-center gap-2 rounded-xl border bg-secondary/30 px-4 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-elev-1"
            >
              <Zap className="size-4 text-violet-500" />
              <span className="font-semibold tabular-nums">{xp.total.toLocaleString()}</span>
              <span className="text-muted-foreground">XP · {xp.levelName}</span>
            </button>
            {(missionStreak?.todayCompleted || streaks.todayActive) && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Active today
              </div>
            )}
          </motion.div>

          {/* Needs attention — the day's action queue, deep-linked */}
          <motion.div variants={fadeUp}>
            <AttentionPanel />
          </motion.div>

          {/* Today's Mission — full interactive component */}
          <motion.div variants={fadeUp}>
            <MissionList compact />
          </motion.div>

          {/* Two-column layout: Goals + Upcoming */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Goals */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <Target className="size-4 text-muted-foreground" />
                    Goals
                  </CardTitle>
                  <Link to="/goals" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    View all <ArrowRight className="ml-0.5 inline size-3" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-5 pt-2">
                  {(goals ?? []).length > 0 ? (
                    (goals ?? []).slice(0, 3).map((g: any) => {
                      const pct = Math.min(100, Math.round((g.progress / g.target) * 100));
                      const done = g.progress >= g.target;
                      return (
                        <div key={g.id}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2 truncate pr-2 text-sm font-medium">
                              {done && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />}
                              <span className="truncate">{g.title}</span>
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {g.progress}/{g.target}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              className={cn('h-full rounded-full', done ? 'bg-emerald-500' : 'bg-[var(--viz-1)]')}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">
                      No goals yet.{' '}
                      <Link to="/goals" className="text-foreground hover:underline">Set one</Link>.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming interviews */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <Calendar className="size-4 text-muted-foreground" />
                    Upcoming Interviews
                  </CardTitle>
                  <Link to="/interviews" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    View all <ArrowRight className="ml-0.5 inline size-3" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-1 pt-2">
                  {upcomingInterviews.length > 0 ? (
                    upcomingInterviews.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-4 rounded-xl p-3 text-sm transition-colors hover:bg-secondary/40">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                          <MessageSquare className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{appById.get(r.applicationId)?.company ?? 'Company'}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.scheduledAt)}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn('shrink-0 text-[11px] font-medium', INTERVIEW_TYPE_COLORS[r.type as InterviewType])}
                        >
                          {INTERVIEW_TYPE_LABEL[r.type as InterviewType] ?? r.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">No interviews scheduled.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Career Timeline — full width */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                  <Clock className="size-4 text-muted-foreground" />
                  Career Timeline
                </CardTitle>
                <Link to="/applications" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                  View all <ArrowRight className="ml-0.5 inline size-3" />
                </Link>
              </CardHeader>
              <CardContent className="pt-2">
                <CareerTimeline events={timeline} limit={6} onViewAll={() => navigate('/applications')} />
              </CardContent>
            </Card>
          </motion.div>

          {/* AI CTA */}
          <motion.div variants={fadeUp}>
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
                <div className="flex items-center gap-5">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <Sparkles className="size-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight">Analyze a job description with AI</p>
                    <p className="mt-1 text-sm text-muted-foreground">Extract skills, ATS keywords, and get a resume-match score.</p>
                  </div>
                </div>
                <Button variant="outline" asChild className="shrink-0">
                  <Link to="/ai">
                    Open AI Tools <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
