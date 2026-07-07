import { motion } from 'framer-motion';
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
import { BarChart3, Send, MessageSquare, Trophy, FileText, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';

function weekLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Funnel progression: brand ramp from faint to full saturation.
const funnelColors = [
  'hsl(var(--brand) / 0.35)',
  'hsl(var(--brand) / 0.55)',
  'hsl(var(--brand) / 0.75)',
  'hsl(var(--brand))',
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights across your entire job search." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
        <Skeleton className="mt-6 h-80" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights across your entire job search." />
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
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Applications" value={data.totals.applications} icon={Send} />
            <StatCard label="Response Rate" value={`${data.rates.responseRate}%`} sublabel="Progressed past applied" icon={TrendingUp} />
            <StatCard label="Interview Rate" value={`${data.rates.interviewRate}%`} icon={MessageSquare} />
            <StatCard label="Offer Rate" value={`${data.rates.offerRate}%`} sublabel={`${data.totals.offers} offer(s)`} icon={Trophy} />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Applications per week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.perWeek.map((w) => ({ ...w, label: weekLabel(w.week) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={24} />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 10,
                          fontSize: 12,
                          boxShadow: '0 4px 12px hsl(var(--foreground) / 0.05)',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--brand))" radius={[6, 6, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.funnel} layout="vertical" margin={{ left: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={72} />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 10,
                          fontSize: 12,
                          boxShadow: '0 4px 12px hsl(var(--foreground) / 0.05)',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={800}>
                        {data.funnel.map((_, i) => (
                          <Cell key={i} fill={funnelColors[i % funnelColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {data.mostUsedResume && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="text-[13px] text-muted-foreground">Most-used resume</p>
                    <p className="font-semibold">
                      {data.mostUsedResume.label}{' '}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {data.mostUsedResume.count} application(s)
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
