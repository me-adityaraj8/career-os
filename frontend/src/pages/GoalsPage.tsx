import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, MoreVertical, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types';

const PERIOD_LABEL: Record<Goal['period'], string> = {
  week: 'this week',
  month: 'this month',
  all_time: 'all time',
};

export default function GoalsPage() {
  const { data: goals, isLoading, isError } = useGoals();
  const del = useDeleteGoal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Set targets and watch progress update from your real activity."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> New goal
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState icon={Target} title="Couldn't load goals" description="Please refresh to try again." />
      )}

      {!isLoading && !isError && goals?.length === 0 && (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a goal like '20 applications this month' and track it automatically."
          action={<Button onClick={openAdd}><Plus className="size-4" /> New goal</Button>}
        />
      )}

      {!isLoading && goals && goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g, i) => {
            const percent = Math.min(100, Math.round((g.progress / g.target) * 100));
            const done = g.progress >= g.target;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{g.title}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {g.metric} · {PERIOD_LABEL[g.period]}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-secondary">
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(g); setDialogOpen(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleting(g)} className="text-destructive">Delete</DropdownMenuItem>
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
                          className={cn('h-full rounded-full', done ? 'bg-emerald-500' : 'bg-primary')}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
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
