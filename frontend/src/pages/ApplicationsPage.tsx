import { useMemo, useState } from 'react';
import { Plus, Search, Kanban as KanbanIcon, List, Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KanbanBoard } from '@/components/applications/KanbanBoard';
import { ApplicationsListView } from '@/components/applications/ApplicationsListView';
import { ApplicationDialog } from '@/components/applications/ApplicationDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  useApplications,
  useApplicationTags,
  useDeleteApplication,
} from '@/hooks/useApplications';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';
import type { Application, Stage } from '@/types';

type View = 'kanban' | 'list';

export default function ApplicationsPage() {
  const { data: applications, isLoading, isError } = useApplications();
  const { data: tags } = useApplicationTags();
  const del = useDeleteApplication();

  const [view, setView] = useState<View>('kanban');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [addStage, setAddStage] = useState<Stage>('saved');
  const [deleting, setDeleting] = useState<Application | null>(null);

  const filtered = useMemo(() => {
    if (!applications) return [];
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      const matchesSearch =
        !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchesTag = tag === 'all' || a.tags.includes(tag);
      return matchesSearch && matchesTag;
    });
  }, [applications, search, tag]);

  function openAdd(stage: Stage) {
    setEditing(null);
    setAddStage(stage);
    setDialogOpen(true);
  }
  function openEdit(app: Application) {
    setEditing(app);
    setDialogOpen(true);
  }
  async function confirmDelete() {
    if (!deleting) return;
    await del.mutateAsync(deleting.id);
    toast({ title: 'Application deleted', variant: 'success' });
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Track every application from saved to offer."
        actions={
          <Button onClick={() => openAdd('saved')}>
            <Plus className="size-4" /> Add application
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search company or role…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags?.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition-colors',
              view === 'kanban' ? 'bg-secondary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <KanbanIcon className="size-4" /> Board
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition-colors',
              view === 'list' ? 'bg-secondary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="size-4" /> List
          </button>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Briefcase}
          title="Couldn't load applications"
          description="Please refresh the page to try again."
        />
      )}

      {!isLoading && !isError && applications?.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Add your first application to start tracking your job search."
          action={
            <Button onClick={() => openAdd('saved')}>
              <Plus className="size-4" /> Add your first application
            </Button>
          }
        />
      )}

      {!isLoading && !isError && applications && applications.length > 0 && (
        <>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matches" description="Try a different search or tag." />
          ) : view === 'kanban' ? (
            <KanbanBoard
              applications={filtered}
              onEdit={openEdit}
              onDelete={setDeleting}
              onAdd={openAdd}
            />
          ) : (
            <ApplicationsListView applications={filtered} onEdit={openEdit} onDelete={setDeleting} />
          )}
        </>
      )}

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={editing}
        defaultStage={addStage}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete application?"
        description={
          deleting ? `This will permanently remove ${deleting.company} — ${deleting.role}.` : ''
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
