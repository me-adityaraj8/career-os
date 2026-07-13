import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  closestCenter,
  closestCorners,
  getFirstCollision,
  useSensor,
  useSensors,
  useDroppable,
  KeyboardCode,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type UniqueIdentifier,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { ApplicationCard } from './ApplicationCard';
import { STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useReorderApplications, type ReorderItem } from '@/hooks/useApplications';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage, isDemoReadonly } from '@/lib/api';
import type { Application, Stage } from '@/types';

interface Props {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onView: (app: Application) => void;
  onAdd: (stage: Stage) => void;
}

/** Ordered lists of application ids, keyed by stage — the board's working model. */
type Columns = Record<Stage, string[]>;

const STAGE_VALUES = STAGES.map((s) => s.value);

function emptyColumns(): Columns {
  return { saved: [], applied: [], online_assessment: [], interview: [], offer: [], rejected: [] };
}

const ARROW_CODES: string[] = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
];

/**
 * Keyboard navigation across columns. The default sortable coordinate getter only
 * walks a single list, so cross-column keyboard moves (and drops into empty
 * columns) don't work. This is the dnd-kit multi-container recipe: on an arrow
 * key it filters droppables to those lying in the pressed direction — skipping a
 * populated column in favour of its cards, but keeping empty columns as valid
 * targets — then snaps to the closest one. Makes the board fully keyboard-operable.
 */
const multiColumnCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
  if (!ARROW_CODES.includes(event.code)) return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;

  const candidates = droppableContainers.getEnabled().filter((entry) => {
    if (!entry || entry.disabled) return false;
    const rect = droppableRects.get(entry.id);
    if (!rect) return false;

    // When a populated column and its cards overlap, prefer the cards.
    const data = entry.data.current as { type?: string; items?: string[] } | undefined;
    if (data?.type === 'column' && (data.items?.length ?? 0) > 0) return false;

    switch (event.code) {
      case KeyboardCode.Down:
        return collisionRect.top < rect.top;
      case KeyboardCode.Up:
        return collisionRect.top > rect.top;
      case KeyboardCode.Left:
        return collisionRect.left >= rect.left + rect.width;
      case KeyboardCode.Right:
        return collisionRect.left + collisionRect.width <= rect.left;
      default:
        return false;
    }
  });

  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: candidates,
    pointerCoordinates: null,
  });
  const closestId = getFirstCollision(collisions, 'id');
  if (closestId == null) return undefined;

  const newRect = droppableRects.get(closestId);
  const newNode = droppableContainers.get(closestId)?.node.current;
  if (!newNode || !newRect) return undefined;

  return {
    x: newRect.left + (newRect.width - collisionRect.width) / 2,
    y: newRect.top + (newRect.height - collisionRect.height) / 2,
  };
};

/** A card that participates in sorting. The whole card is the drag handle; a
 *  pointer that moves past the activation distance drags, a stationary one clicks. */
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
    data: { type: 'card', stage: application.stage },
  });

  // A completed drag can emit a trailing click on the origin element; swallow it
  // once so a move never also opens the detail modal. A genuine click (no drag)
  // leaves the flag untouched and opens as expected.
  const suppressClick = useRef(false);
  if (isDragging) suppressClick.current = true;

  return (
    <ApplicationCard
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      application={application}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onView();
      }}
      dragging={isDragging}
      className="touch-none cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    />
  );
}

function Column({
  stage,
  label,
  color,
  ids,
  appById,
  onEdit,
  onDelete,
  onView,
  onAdd,
  index,
  activeId,
}: {
  stage: Stage;
  label: string;
  color: string;
  ids: string[];
  appById: Map<string, Application>;
  onEdit: (a: Application) => void;
  onDelete: (a: Application) => void;
  onView: (a: Application) => void;
  onAdd: (stage: Stage) => void;
  index: number;
  activeId: string | null;
}) {
  // The column body is itself a droppable so drops onto empty space (or an empty
  // column) resolve to this stage even when no card is under the pointer. `items`
  // lets the keyboard coordinate getter tell empty columns from populated ones.
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: 'column', stage, items: ids },
  });
  const isActiveOver = isOver || (activeId != null && ids.includes(activeId));

  return (
    <motion.div
      className="flex min-w-0 flex-1 snap-start flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className={cn('size-2 rounded-full', color)} />
          <span className="text-[13px] font-semibold tracking-tight">{label}</span>
          <span className="flex size-5 items-center justify-center rounded-md bg-secondary text-[11px] font-medium text-muted-foreground">
            {ids.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(stage)}
          className="rounded-lg p-1.5 text-muted-foreground/40 transition-all hover:bg-secondary hover:text-foreground"
          aria-label={`Add to ${label}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-3 rounded-2xl p-3 transition-colors duration-200',
          isActiveOver
            ? 'bg-primary/[0.05] ring-2 ring-primary/20 dark:bg-primary/[0.07]'
            : 'bg-secondary/20',
        )}
        style={{ minHeight: 160 }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.map((id) => {
            const a = appById.get(id);
            if (!a) return null;
            return (
              <SortableCard
                key={id}
                application={a}
                onEdit={() => onEdit(a)}
                onDelete={() => onDelete(a)}
                onView={() => onView(a)}
              />
            );
          })}
        </SortableContext>
        {ids.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-transparent">
            <p className="text-[13px] text-muted-foreground/40">Drop here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function KanbanBoard({ applications, onEdit, onDelete, onView, onAdd }: Props) {
  const reorder = useReorderApplications();

  // Ephemeral state that only exists mid-drag. When null the board renders from
  // the query cache (single source of truth); during a drag it renders from this
  // snapshot so onDragOver can move cards between columns live and reliably.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Synchronous mirror of the working column model during a drag. Reads in
  // onDragEnd go through this ref (never React state) so a fast drop can never
  // persist a stale snapshot.
  const workingCols = useRef<Columns | null>(null);

  // Collision-detection scratch state (per the dnd-kit multi-container recipe).
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const appById = useMemo(
    () => new Map(applications.map((a) => [a.id, a])),
    [applications],
  );

  // Base column model derived from the cache, sorted by persisted position.
  const baseColumns = useMemo<Columns>(() => {
    const cols = emptyColumns();
    for (const a of applications) cols[a.stage].push(a.id);
    for (const stage of STAGE_VALUES) {
      cols[stage].sort((x, y) => {
        const ax = appById.get(x)!;
        const ay = appById.get(y)!;
        return ax.position - ay.position || (ax.createdAt < ay.createdAt ? 1 : -1);
      });
    }
    return cols;
  }, [applications, appById]);

  const columns = dragColumns ?? baseColumns;

  const findContainer = useCallback(
    (id: UniqueIdentifier | null, cols: Columns): Stage | null => {
      if (id == null) return null;
      if (STAGE_VALUES.includes(id as Stage)) return id as Stage;
      return STAGE_VALUES.find((stage) => cols[stage].includes(id as string)) ?? null;
    },
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: multiColumnCoordinateGetter }),
  );

  // Prefer the pointer's own position; fall back to rect intersection, then to
  // the closest card inside a hovered column. Keeps drops resolving even over
  // empty columns and gutters, and holds the last valid target through gaps.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerCollisions = pointerWithin(args);
      const intersections =
        pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        // Hovering a column container: snap to the nearest card within it (never
        // the dragged card itself) so the insertion point tracks the cursor
        // instead of resolving to the whole column.
        if (STAGE_VALUES.includes(overId as Stage)) {
          const cols = workingCols.current ?? baseColumns;
          const containerItems = cols[overId as Stage];
          if (containerItems.length > 0) {
            const closest = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (c) =>
                  c.id !== overId &&
                  c.id !== activeId &&
                  containerItems.includes(c.id as string),
              ),
            });
            overId = getFirstCollision(closest, 'id') ?? overId;
          }
        }
        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) lastOverId.current = activeId;
      return lastOverId.current != null ? [{ id: lastOverId.current }] : [];
    },
    [activeId, baseColumns],
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    workingCols.current = baseColumns;
    setDragColumns(baseColumns);
    recentlyMovedToNewContainer.current = false;
  }

  // Live reordering: maintain the full working column model as the active card
  // moves — both across columns and within one. Running this in onDragOver (not
  // just onDragEnd) keeps the ref authoritative for every sensor and gives the
  // placeholder its live position. Computing the insertion index from geometry
  // keeps it correct for pointer, touch, and keyboard alike.
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const cols = workingCols.current ?? baseColumns;
    const activeId_ = String(active.id);
    const activeContainer = findContainer(active.id, cols);
    const overContainer = findContainer(over.id, cols);
    if (!activeContainer || !overContainer) return;

    const overIsColumn = STAGE_VALUES.includes(over.id as Stage);
    const overItems = cols[overContainer];

    // Where should the card land within the destination column?
    let insertAt: number;
    if (overIsColumn) {
      insertAt = overItems.length;
    } else {
      const overIndex = overItems.indexOf(String(over.id));
      const translatedTop = e.active.rect.current.translated?.top;
      const isBelow =
        translatedTop != null && translatedTop > over.rect.top + over.rect.height / 2;
      insertAt = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : overItems.length;
    }

    // No-op if the card is already exactly there.
    if (activeContainer === overContainer) {
      const current = cols[activeContainer].indexOf(activeId_);
      const target = insertAt > current ? insertAt - 1 : insertAt;
      if (current === target) return;
    }

    if (activeContainer !== overContainer) recentlyMovedToNewContainer.current = true;

    const next: Columns = { ...cols };
    next[activeContainer] = next[activeContainer].filter((id) => id !== activeId_);
    const dest = overContainer === activeContainer ? next[activeContainer] : [...next[overContainer]];
    const clamped = Math.max(0, Math.min(insertAt, dest.length));
    dest.splice(clamped, 0, activeId_);
    next[overContainer] = dest;

    workingCols.current = next;
    setDragColumns(next);
  }

  function handleDragEnd() {
    const cols = workingCols.current ?? baseColumns;

    // Clear ephemeral drag state regardless of outcome.
    const cleanup = () => {
      setActiveId(null);
      setDragColumns(null);
      workingCols.current = null;
      recentlyMovedToNewContainer.current = false;
      lastOverId.current = null;
    };

    // Persist every column whose order changed, renumbered to clean 0..n
    // positions so the stored order can never drift or collide. The working
    // model is already the final state, so we just diff it against the cache.
    const items: ReorderItem[] = [];
    for (const stage of STAGE_VALUES) {
      const nextIds = cols[stage];
      const baseIds = baseColumns[stage];
      const changed =
        nextIds.length !== baseIds.length || nextIds.some((id, i) => id !== baseIds[i]);
      if (changed) {
        nextIds.forEach((id, position) => items.push({ id, stage, position }));
      }
    }

    if (items.length === 0) {
      cleanup();
      return;
    }

    reorder.mutate(items, {
      onError: (err) => { if (!isDemoReadonly(err)) toast({ title: apiErrorMessage(err, 'Could not move card'), variant: 'error' }); },
    });
    cleanup();
  }

  const activeApp = activeId ? appById.get(activeId) ?? null : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragColumns(null);
        workingCols.current = null;
        recentlyMovedToNewContainer.current = false;
        lastOverId.current = null;
      }}
    >
      {/* All six columns share the row on wide screens; below that the board
          scrolls horizontally with usable column widths. dnd-kit auto-scrolls
          this container (and the page) when dragging near an edge. */}
      <div className="grid snap-x snap-proximity scroll-px-5 grid-flow-col auto-cols-[minmax(272px,1fr)] gap-4 overflow-x-auto pb-4 sm:auto-cols-[minmax(232px,1fr)] sm:gap-5">
        {STAGES.map((s, i) => (
          <Column
            key={s.value}
            stage={s.value}
            label={s.label}
            color={s.color}
            ids={columns[s.value]}
            appById={appById}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onAdd={onAdd}
            index={i}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeApp && (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.03, rotate: 1.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <ApplicationCard
              application={activeApp}
              className="cursor-grabbing shadow-2xl ring-2 ring-primary/10 backdrop-blur-sm"
              style={{ width: 'auto', minWidth: 200 }}
            />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
