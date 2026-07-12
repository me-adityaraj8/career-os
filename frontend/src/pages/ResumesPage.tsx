import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Download, Star, MoreVertical, TrendingUp } from 'lucide-react';
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
import { ResumeDialog } from '@/components/resumes/ResumeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  useResumes,
  useDeleteResume,
  useSetDefaultResume,
  downloadResume,
} from '@/hooks/useResumes';
import { useApplications } from '@/hooks/useApplications';
import { toast } from '@/stores/toastStore';
import { cn, formatDate } from '@/lib/utils';
import type { Application, Resume } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ResumeStats {
  sent: number;
  interviews: number;
  offers: number;
  interviewRate: number;
}

/** Per-version performance from the live pipeline: which resume converts. */
function computeResumeStats(apps: Application[]): Map<string, ResumeStats> {
  const map = new Map<string, ResumeStats>();
  for (const a of apps) {
    if (!a.resumeId || a.stage === 'saved') continue;
    const s = map.get(a.resumeId) ?? { sent: 0, interviews: 0, offers: 0, interviewRate: 0 };
    s.sent += 1;
    if (a.stage === 'interview' || a.stage === 'offer') s.interviews += 1;
    if (a.stage === 'offer') s.offers += 1;
    map.set(a.resumeId, s);
  }
  for (const s of map.values()) {
    s.interviewRate = s.sent > 0 ? Math.round((s.interviews / s.sent) * 100) : 0;
  }
  return map;
}

function ResumePerformance({ stats }: { stats: ResumeStats | undefined }) {
  if (!stats || stats.sent === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground/70">
        No applications sent with this version yet.
      </p>
    );
  }
  return (
    <div className="rounded-lg border bg-secondary/30 px-3 py-2.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <TrendingUp className="size-3" /> Performance
        </span>
        <span className="tabular-nums text-muted-foreground">
          {stats.sent} sent · {stats.interviews} interview{stats.interviews === 1 ? '' : 's'}
          {stats.offers > 0 && ` · ${stats.offers} offer${stats.offers === 1 ? '' : 's'}`}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={cn('h-full rounded-full', stats.interviewRate >= 40 ? 'bg-success' : 'bg-[var(--viz-1)]')}
            initial={{ width: 0 }}
            animate={{ width: `${stats.interviewRate}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums">{stats.interviewRate}%</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/60">interview rate with this version</p>
    </div>
  );
}

export default function ResumesPage() {
  const { data: resumes, isLoading, isError } = useResumes();
  const { data: applications } = useApplications();
  const del = useDeleteResume();
  const setDefault = useSetDefaultResume();

  const statsByResume = useMemo(() => computeResumeStats(applications ?? []), [applications]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState<Resume | null>(null);

  function openUpload() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Resumes"
        description="Manage resume versions and tag them for different roles."
        actions={
          <Button onClick={openUpload}>
            <Plus className="size-4" /> Upload resume
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4" style={{ opacity: 1 - i * 0.15 }}>
              <div className="flex items-start justify-between">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="size-6 rounded" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
              <div className="flex justify-between pt-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState icon={FileText} title="Couldn't load resumes" description="Please refresh to try again." />
      )}

      {!isLoading && !isError && resumes?.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload your first resume version to link it to applications and power AI features."
          action={
            <Button onClick={openUpload}>
              <Plus className="size-4" /> Upload resume
            </Button>
          }
        />
      )}

      {!isLoading && resumes && resumes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
              whileHover={{ y: -2 }}
            >
              <Card className="h-full transition-shadow duration-300 hover:shadow-elev-2">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <FileText className="size-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-secondary">
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadResume(r)}>
                          <Download className="size-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(r); setDialogOpen(true); }}>
                          Edit
                        </DropdownMenuItem>
                        {!r.isDefault && (
                          <DropdownMenuItem onClick={() => setDefault.mutate(r.id)}>
                            <Star className="size-4" /> Set as default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setDeleting(r)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{r.label}</p>
                      {r.isDefault && (
                        <Badge variant="default" className="gap-1 px-1.5 py-0 text-[10px]">
                          <Star className="size-2.5 fill-current" /> Default
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{r.originalName}</p>
                  </div>

                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <ResumePerformance stats={statsByResume.get(r.id)} />

                  <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>{formatBytes(r.sizeBytes)}</span>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ResumeDialog open={dialogOpen} onOpenChange={setDialogOpen} resume={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete resume?"
        description={deleting ? `This will permanently delete "${deleting.label}".` : ''}
        onConfirm={async () => {
          if (!deleting) return;
          await del.mutateAsync(deleting.id);
          toast({ title: 'Resume deleted', variant: 'success' });
        }}
      />
    </div>
  );
}
