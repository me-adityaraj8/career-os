import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send,
  MessageSquare,
  Trophy,
  Target,
  Bell,
  Calendar,
  ArrowRight,
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useGoals } from '@/hooks/useGoals';
import { useInterviews } from '@/hooks/useInterviews';
import { useContacts } from '@/hooks/useContacts';
import { useApplications } from '@/hooks/useApplications';
import { cn, formatDate, timeAgo } from '@/lib/utils';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: analytics, isLoading } = useAnalytics();
  const { data: goals } = useGoals();
  const { data: interviews } = useInterviews();
  const { data: contacts } = useContacts();
  const { data: applications } = useApplications();

  const upcomingInterviews = (interviews ?? [])
    .filter((r) => r.scheduledAt && new Date(r.scheduledAt) >= new Date() && r.outcome === 'pending')
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 4);

  const followUps = (contacts ?? []).filter((c) => c.followUp).slice(0, 4);
  const appById = new Map((applications ?? []).map((a) => [a.id, a]));

  const recentApps = [...(applications ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
                              {done && <CheckCircle2 className="size-3.5 shrink-0 text-foreground" />}
                              <span className="truncate">{g.title}</span>
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {g.progress}/{g.target}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              className="h-full rounded-full bg-foreground/70"
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
                        <Badge variant="secondary" className="shrink-0 capitalize text-[11px]">
                          {r.type.replace('_', ' ')}
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

          {/* Recent activity — full width */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                  <Clock className="size-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
                <Link to="/applications" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                  View all <ArrowRight className="ml-0.5 inline size-3" />
                </Link>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-1">
                  {recentApps.map((a: any, i: number) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 rounded-xl p-3.5 text-sm transition-all hover:bg-secondary/40"
                    >
                      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                        <Building2 className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.company}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.role}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn('shrink-0 capitalize text-[11px] font-medium', {
                          'bg-foreground/10 text-foreground': a.stage === 'offer',
                          'bg-foreground/[0.07] text-foreground/80': a.stage === 'interview',
                          'bg-foreground/[0.05] text-foreground/60': a.stage === 'online_assessment',
                          'bg-muted text-muted-foreground': a.stage === 'rejected',
                        })}
                      >
                        {a.stage.replace('_', ' ')}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground/60">{timeAgo(a.createdAt)}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Follow-ups */}
          {followUps.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
                    <Bell className="size-4 text-muted-foreground" />
                    Follow-ups
                  </CardTitle>
                  <Link to="/network" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    View all <ArrowRight className="ml-0.5 inline size-3" />
                  </Link>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {followUps.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-4 rounded-xl border border-border/50 p-4 transition-colors hover:bg-secondary/30">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                          <Bell className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{c.company ?? '—'}</p>
                        </div>
                        {c.followUpDate && (
                          <span className="shrink-0 text-xs text-muted-foreground/60">{formatDate(c.followUpDate)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
