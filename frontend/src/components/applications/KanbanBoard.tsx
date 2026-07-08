import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  onView: (app: Application) => void;
  onAdd: (stage: Stage) => void;
}

function SortableCard({
  application,
  onEdit,
  onDelete,
  onView,
}: {
  application: Application;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { stage: application.stage },
  });
  // Browsers fire a click on the source element after a completed drag;
  // without this guard every drop would also open the detail modal.
  const draggedRef = useRef(false);
  useEffect(() => {
    if (isDragging) draggedRef.current = true;
  }, [isDragging]);
  return (
    <ApplicationCard
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      application={application}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={() => {
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        onView();
      }}
      dragging={isDragging}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    />
  );
}

function Column({
  stage,
  label,
  color,
  applications,
  onEdit,
  onDelete,
  onView,
  onAdd,
  index,
}: {
  stage: Stage;
  label: string;
  color: string;
  applications: Application[];
  onEdit: (a: Application) => void;
  onDelete: (a: Application) => void;
  onView: (a: Application) => void;
  onAdd: (stage: Stage) => void;
  index: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${stage}`, data: { stage } });
  return (
    <motion.div
      className="flex min-w-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className={cn('size-2 rounded-full', color)} />
          <span className="text-[13px] font-semibold tracking-tight">{label}</span>
          <span className="flex size-5 items-center justify-center rounded-md bg-secondary text-[11px] font-medium text-muted-foreground">
            {applications.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(stage)}
          className="rounded-lg p-1.5 text-muted-foreground/40 transition-all hover:bg-secondary hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-3 rounded-2xl p-3 transition-all duration-300',
          isOver
            ? 'bg-primary/[0.04] ring-2 ring-primary/15 dark:bg-primary/[0.06]'
            : 'bg-secondary/20',
        )}
        style={{ minHeight: 160 }}
      >
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((a) => (
            <SortableCard
              key={a.id}
              application={a}
              onEdit={() => onEdit(a)}
              onDelete={() => onDelete(a)}
              onView={() => onView(a)}
            />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[13px] text-muted-foreground/40">Drop here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function positionForIndex(columnCards: Application[], index: number): number {
  const before = columnCards[index - 1];
  const after = columnCards[index];
  if (!before && !after) return 1;
  if (!before) return after.position - 1;
  if (!after) return before.position + 1;
  return (before.position + after.position) / 2;
}

export function KanbanBoard({ applications, onEdit, onDelete, onView, onAdd }: Props) {
  const update = useUpdateApplication();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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

    let targetStage: Stage;
    let overId = String(over.id);
    if (overId.startsWith('col:')) {
      targetStage = overId.slice(4) as Stage;
    } else {
      const overApp = applications.find((a) => a.id === overId);
      if (!overApp) return;
      targetStage = overApp.stage;
    }

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
      {/* All six columns share the row on wide screens; below that the board
          scrolls horizontally with usable column widths instead of slivers. */}
      <div className="grid grid-flow-col auto-cols-[minmax(232px,1fr)] gap-5 overflow-x-auto pb-4">
        {STAGES.map((s, i) => (
          <Column
            key={s.value}
            stage={s.value}
            label={s.label}
            color={s.color}
            applications={byStage[s.value]}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onAdd={onAdd}
            index={i}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp && (
          <ApplicationCard
            application={activeApp}
            className="rotate-[2deg] shadow-2xl ring-2 ring-primary/10"
            style={{ width: 'auto', minWidth: 200 }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
