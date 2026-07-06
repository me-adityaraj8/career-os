import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Send, MessageSquare, Trophy, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';

/** Format a Monday week-start ISO date as "Jul 6". */
function weekLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const funnelColors = [
  'hsl(215 20% 65%)',
  'hsl(217 91% 60%)',
  'hsl(38 92% 50%)',
  'hsl(142 71% 45%)',
];

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-6 h-72" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState icon={BarChart3} title="Couldn't load analytics" description="Please refresh to try again." />
      </div>
    );
  }

  const hasData = data.totals.applications > 0;

  return (
    <div>
      <PageHeader title="Analytics" description="Insights across your entire job search." />

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Add some applications to see your funnel, conversion rates, and weekly activity."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Applications" value={data.totals.applications} icon={Send} />
            <StatCard label="Response rate" value={`${data.rates.responseRate}%`} sublabel="Progressed past applied" icon={MessageSquare} />
            <StatCard label="Interview rate" value={`${data.rates.interviewRate}%`} icon={MessageSquare} />
            <StatCard label="Offer rate" value={`${data.rates.offerRate}%`} sublabel={`${data.totals.offers} offer(s)`} icon={Trophy} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Applications per week</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.perWeek.map((w) => ({ ...w, label: weekLabel(w.week) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={24} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversion funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.funnel} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={72} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.funnel.map((_, i) => (
                        <Cell key={i} fill={funnelColors[i % funnelColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {data.mostUsedResume && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Most-used resume</p>
                  <p className="font-medium">
                    {data.mostUsedResume.label}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      · {data.mostUsedResume.count} application(s)
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
