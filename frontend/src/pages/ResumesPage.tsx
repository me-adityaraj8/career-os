import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Download, Star, MoreVertical } from 'lucide-react';
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
import { toast } from '@/stores/toastStore';
import { formatDate } from '@/lib/utils';
import type { Resume } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumesPage() {
  const { data: resumes, isLoading, isError } = useResumes();
  const del = useDeleteResume();
  const setDefault = useSetDefaultResume();

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
            <Skeleton key={i} className="h-40 w-full" />
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="h-full">
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
