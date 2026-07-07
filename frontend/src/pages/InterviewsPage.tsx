import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Calendar, MoreVertical, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InterviewDialog } from '@/components/interviews/InterviewDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useInterviews, useDeleteInterview } from '@/hooks/useInterviews';
import { useApplications } from '@/hooks/useApplications';
import { INTERVIEW_TYPE_LABEL, INTERVIEW_OUTCOMES } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import type { Application, InterviewRound } from '@/types';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function InterviewsPage() {
  const { data: interviews, isLoading, isError } = useInterviews();
  const { data: applications } = useApplications();
  const del = useDeleteInterview();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InterviewRound | null>(null);
  const [deleting, setDeleting] = useState<InterviewRound | null>(null);

  const appById = useMemo(() => {
    const m = new Map<string, Application>();
    applications?.forEach((a) => m.set(a.id, a));
    return m;
  }, [applications]);

  const grouped = useMemo(() => {
    const groups = new Map<string, InterviewRound[]>();
    interviews?.forEach((r) => {
      const arr = groups.get(r.applicationId) ?? [];
      arr.push(r);
      groups.set(r.applicationId, arr);
    });
    return Array.from(groups.entries());
  }, [interviews]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Track interview rounds, prep notes, and outcomes per application."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add round
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState icon={MessageSquare} title="Couldn't load interviews" description="Please refresh to try again." />
      )}

      {!isLoading && !isError && interviews?.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No interview rounds yet"
          description="Add a round to start tracking your interview prep and outcomes."
          action={<Button onClick={openAdd}><Plus className="size-4" /> Add round</Button>}
        />
      )}

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
        {grouped.map(([appId, rounds]) => {
          const app = appById.get(appId);
          return (
            <motion.div key={appId} variants={fadeUp}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <MessageSquare className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{app ? app.company : 'Application'}</h3>
                  {app && <p className="text-xs text-muted-foreground">{app.role}</p>}
                </div>
                <Badge variant="secondary" className="ml-auto">{rounds.length} round{rounds.length > 1 ? 's' : ''}</Badge>
              </div>

              <div className="relative ml-4 border-l-2 border-border pl-6">
                <div className="grid gap-3">
                  {rounds.map((r) => {
                    const outcome = INTERVIEW_OUTCOMES.find((o) => o.value === r.outcome);
                    return (
                      <div key={r.id} className="relative">
                        <div className="absolute -left-[31px] top-4 size-2.5 rounded-full border-2 border-background bg-primary" />
                        <Card className="transition-all duration-200 hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{INTERVIEW_TYPE_LABEL[r.type]}</Badge>
                                <span className={cn('text-xs font-medium', outcome?.className)}>
                                  {outcome?.label}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-secondary">
                                  <MoreVertical className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditing(r); setDialogOpen(true); }}>
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeleting(r)} className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {r.scheduledAt && (
                              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="size-3.5" />
                                {formatDate(r.scheduledAt)}
                                <Clock className="ml-1 size-3" />
                                {new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {r.notes && (
                              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <InterviewDialog open={dialogOpen} onOpenChange={setDialogOpen} round={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete interview round?"
        onConfirm={async () => {
          if (!deleting) return;
          await del.mutateAsync(deleting.id);
          toast({ title: 'Round deleted', variant: 'success' });
        }}
      />
    </div>
  );
}
