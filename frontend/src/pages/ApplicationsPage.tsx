import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Kanban as KanbanIcon, List, Briefcase, Filter, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KanbanBoard } from '@/components/applications/KanbanBoard';
import { ApplicationsListView } from '@/components/applications/ApplicationsListView';
import { ApplicationDialog } from '@/components/applications/ApplicationDialog';
import { ApplicationDetailModal } from '@/components/applications/ApplicationDetailModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  useApplications,
  useApplicationTags,
  useDeleteApplication,
  useUpdateApplication,
} from '@/hooks/useApplications';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';
import { STAGES, PRIORITIES } from '@/lib/constants';
import type { Application, Stage } from '@/types';

type View = 'kanban' | 'list';

export default function ApplicationsPage() {
  const { data: applications, isLoading, isError } = useApplications();
  const { data: tags } = useApplicationTags();
  const del = useDeleteApplication();
  const update = useUpdateApplication();

  const [view, setView] = useState<View>('kanban');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [addStage, setAddStage] = useState<Stage>('saved');
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [viewing, setViewing] = useState<Application | null>(null);

  useEffect(() => {
    function onNewApp() { openAdd('saved'); }
    window.addEventListener('rys:new-application', onNewApp);
    return () => window.removeEventListener('rys:new-application', onNewApp);
  }, []);

  const activeFilterCount = [stageFilter, priorityFilter, tag].filter((f) => f !== 'all').length;

  function clearFilters() {
    setStageFilter('all');
    setPriorityFilter('all');
    setTag('all');
    setSearch('');
  }

  const filtered = useMemo(() => {
    if (!applications) return [];
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      const matchesSearch =
        !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchesTag = tag === 'all' || a.tags.includes(tag);
      const matchesStage = stageFilter === 'all' || a.stage === stageFilter;
      const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
      return matchesSearch && matchesTag && matchesStage && matchesPriority;
    });
  }, [applications, search, tag, stageFilter, priorityFilter]);

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
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters((p) => !p)}
              className="relative"
            >
              <Filter className="size-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
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

        {/* Smart filter row */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-secondary/20 px-4 py-3">
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn('size-2 rounded-full', s.color)} />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tag} onValueChange={setTag}>
                  <SelectTrigger className="h-8 w-36 text-xs">
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

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-3" /> Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-flow-col auto-cols-[minmax(232px,1fr)] gap-5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" style={{ opacity: 1 - i * 0.12 }} />
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
              onView={setViewing}
              onAdd={openAdd}
            />
          ) : (
            <ApplicationsListView
              applications={filtered}
              onEdit={openEdit}
              onDelete={setDeleting}
              onBulkStageChange={(ids, stage) => {
                ids.forEach((id) => update.mutate({ id, stage }));
                toast({ title: `Moved ${ids.length} application${ids.length > 1 ? 's' : ''} to ${stage.replace('_', ' ')}`, variant: 'success' });
              }}
              onBulkDelete={(ids) => {
                ids.forEach((id) => del.mutate(id));
                toast({ title: `Deleted ${ids.length} application${ids.length > 1 ? 's' : ''}`, variant: 'success' });
              }}
            />
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
      <ApplicationDetailModal
        application={viewing}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        onEdit={() => {
          if (viewing) {
            openEdit(viewing);
            setViewing(null);
          }
        }}
      />
    </div>
  );
}
