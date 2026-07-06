import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { ApplicationCard } from './ApplicationCard';
import { STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useUpdateApplication } from '@/hooks/useApplications';
import type { Application, Stage } from '@/types';

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onAdd: (stage: Stage) => void;
}

/** One draggable card. */
function SortableCard({
  application,
  onEdit,
  onDelete,
}: {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { stage: application.stage },
  });
  return (
    <ApplicationCard
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      application={application}
      onEdit={onEdit}
      onDelete={onDelete}
      dragging={isDragging}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    />
  );
}

/** A stage column that accepts drops (including when empty). */
function Column({
  stage,
  label,
  color,
  applications,
  onEdit,
  onDelete,
  onAdd,
}: {
  stage: Stage;
  label: string;
  color: string;
  applications: Application[];
  onEdit: (a: Application) => void;
  onDelete: (a: Application) => void;
  onAdd: (stage: Stage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${stage}`, data: { stage } });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', color)} />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{applications.length}</span>
        </div>
        <button
          onClick={() => onAdd(stage)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-2 transition-colors',
          isOver ? 'bg-secondary/70' : 'bg-secondary/30',
        )}
      >
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((a) => (
            <SortableCard
              key={a.id}
              application={a}
              onEdit={() => onEdit(a)}
              onDelete={() => onDelete(a)}
            />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Drop here</p>
        )}
      </div>
    </div>
  );
}

/**
 * Compute a fractional position that places `activeId` at `index` within the
 * target column's ordered list. Using fractions means a move only updates the
 * one dragged row instead of renumbering the whole column.
 */
function positionForIndex(columnCards: Application[], index: number): number {
  const before = columnCards[index - 1];
  const after = columnCards[index];
  if (!before && !after) return 1;
  if (!before) return after.position - 1;
  if (!after) return before.position + 1;
  return (before.position + after.position) / 2;
}

export function KanbanBoard({ applications, onEdit, onDelete, onAdd }: Props) {
  const update = useUpdateApplication();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // Small activation distance so clicks (menus) still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Group applications by stage, each sorted by position.
  const byStage = useMemo(() => {
    const map: Record<Stage, Application[]> = {
      saved: [], applied: [], online_assessment: [], interview: [], offer: [], rejected: [],
    };
    for (const a of applications) map[a.stage].push(a);
    for (const s of Object.keys(map) as Stage[]) map[s].sort((x, y) => x.position - y.position);
    return map;
  }, [applications]);

  const activeApp = applications.find((a) => a.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const app = applications.find((a) => a.id === active.id);
    if (!app) return;

    // Resolve the target stage + insertion index.
    let targetStage: Stage;
    let overId = String(over.id);
    if (overId.startsWith('col:')) {
      targetStage = overId.slice(4) as Stage;
    } else {
      const overApp = applications.find((a) => a.id === overId);
      if (!overApp) return;
      targetStage = overApp.stage;
    }

    // Column cards excluding the one being dragged.
    const column = byStage[targetStage].filter((a) => a.id !== app.id);
    let index = column.length;
    if (!overId.startsWith('col:')) {
      const overIndex = column.findIndex((a) => a.id === overId);
      index = overIndex === -1 ? column.length : overIndex;
    }

    const newPosition = positionForIndex(column, index);
    if (targetStage === app.stage && newPosition === app.position) return;

    update.mutate({ id: app.id, stage: targetStage, position: newPosition });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <Column
            key={s.value}
            stage={s.value}
            label={s.label}
            color={s.color}
            applications={byStage[s.value]}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp && <ApplicationCard application={activeApp} className="w-72 rotate-2 shadow-lg" />}
      </DragOverlay>
    </DndContext>
  );
}
