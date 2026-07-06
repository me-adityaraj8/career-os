import { Link } from 'react-router-dom';
import { Send, MessageSquare, Trophy, Target, Bell, Calendar, ArrowRight, Plus } from 'lucide-react';
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
import { cn, formatDate } from '@/lib/utils';

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

  const empty = !isLoading && analytics && analytics.totals.applications === 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}`}
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
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading || !analytics ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                <StatCard label="Applications" value={analytics.totals.applications} icon={Send} />
                <StatCard label="In interview" value={analytics.totals.interviews} icon={MessageSquare} />
                <StatCard label="Offers" value={analytics.totals.offers} icon={Trophy} />
                <StatCard label="Interview rate" value={`${analytics.rates.interviewRate}%`} icon={Target} />
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Goals */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Goals</CardTitle>
                <Link to="/goals" className="text-xs text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals && goals.length > 0 ? (
                  goals.slice(0, 3).map((g) => {
                    const pct = Math.min(100, Math.round((g.progress / g.target) * 100));
                    return (
                      <div key={g.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="truncate pr-2">{g.title}</span>
                          <span className="shrink-0 text-muted-foreground">{g.progress}/{g.target}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={cn('h-full rounded-full', g.progress >= g.target ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No goals yet.{' '}
                    <Link to="/goals" className="text-foreground hover:underline">Set one</Link>.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming interviews */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Upcoming interviews</CardTitle>
                <Link to="/interviews" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingInterviews.length > 0 ? (
                  upcomingInterviews.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 text-sm">
                      <Calendar className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{appById.get(r.applicationId)?.company ?? 'Application'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.scheduledAt)}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">{r.type.replace('_', ' ')}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No interviews scheduled.</p>
                )}
              </CardContent>
            </Card>

            {/* Follow-ups */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Follow-ups</CardTitle>
                <Link to="/network" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {followUps.length > 0 ? (
                  followUps.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 text-sm">
                      <Bell className="size-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.company ?? '—'}</p>
                      </div>
                      {c.followUpDate && (
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.followUpDate)}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No follow-ups flagged.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">Analyze a job description with AI</p>
                <p className="text-sm text-muted-foreground">Extract skills, ATS keywords, and a resume-match score.</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/ai">Open AI Tools <ArrowRight className="size-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
