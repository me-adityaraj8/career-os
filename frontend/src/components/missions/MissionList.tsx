import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import {
  Flame,
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useMissions,
  useCreateMission,
  useUpdateMission,
  useDeleteMission,
  useReorderMissions,
} from '@/hooks/useMissions';
import { fireConfetti } from '@/lib/confetti';
import { toast } from '@/stores/toastStore';
import type { Mission } from '@/types';

function AnimatedCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="group/check relative flex size-6 shrink-0 items-center justify-center"
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
    >
      <svg viewBox="0 0 24 24" className="size-6">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="1.5"
          className={cn(
            'transition-all duration-300',
            checked
              ? 'stroke-emerald-500'
              : 'stroke-border group-hover/check:stroke-emerald-400',
          )}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="1.5"
          className="stroke-emerald-500"
          initial={false}
          animate={{
            strokeDasharray: '62.83',
            strokeDashoffset: checked ? 0 : 62.83,
            opacity: checked ? 1 : 0,
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {checked && (
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            fill="currentColor"
            className="text-emerald-500"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.12, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <motion.path
          d="M8 12.5l2.5 2.5 5.5-5.5"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-emerald-500"
          initial={false}
          animate={{
            strokeDasharray: '20',
            strokeDashoffset: checked ? 0 : 20,
          }}
          transition={{ duration: 0.3, delay: checked ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </button>
  );
}

function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : completed / total;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const allDone = completed === total && total > 0;

  return (
    <div className="relative flex size-14 items-center justify-center">
      <svg viewBox="0 0 52 52" className="size-14 -rotate-90">
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="3"
          className="stroke-muted/60"
        />
        <motion.circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={cn(allDone ? 'stroke-emerald-500' : 'stroke-orange-500')}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          style={{ strokeDasharray: circ }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{ scale: allDone ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          <Flame
            className={cn(
              'size-5 transition-colors duration-300',
              allDone ? 'text-emerald-500' : pct > 0 ? 'text-orange-500' : 'text-muted-foreground/40',
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}

function MissionItem({
  mission,
  onToggle,
  onDelete,
  onEdit,
}: {
  mission: Mission;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(mission.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function saveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== mission.label) {
      onEdit(trimmed);
    }
    setEditing(false);
  }

  return (
    <Reorder.Item
      value={mission}
      id={mission.id}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
        mission.completed
          ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
          : 'border-border/60 bg-card',
      )}
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
    >
      <motion.div
        className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing"
        whileHover={{ scale: 1.1 }}
      >
        <GripVertical className="size-4" />
      </motion.div>

      <AnimatedCheckbox checked={mission.completed} onToggle={onToggle} />

      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            ref={inputRef}
            className="min-w-0 flex-1 rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus:border-primary"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={saveEdit}
          />
          <button onClick={saveEdit} className="rounded p-1 text-emerald-500 hover:bg-emerald-500/10">
            <Check className="size-3.5" />
          </button>
          <button onClick={() => setEditing(false)} className="rounded p-1 text-muted-foreground hover:bg-secondary">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <motion.span
            className={cn(
              'block truncate text-sm font-medium transition-colors duration-300',
              mission.completed && 'text-muted-foreground line-through',
            )}
            initial={false}
            animate={{ opacity: mission.completed ? 0.6 : 1 }}
          >
            {mission.label}
          </motion.span>
        </div>
      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/mission:opacity-100 [.mission-item:hover_&]:opacity-100">
          <button
            onClick={() => {
              setEditValue(mission.label);
              setEditing(true);
            }}
            className="rounded p-1 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="size-3" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      )}
    </Reorder.Item>
  );
}

interface MissionListProps {
  compact?: boolean;
}

export function MissionList({ compact }: MissionListProps) {
  const { data, isLoading } = useMissions();
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();
  const reorderMissions = useReorderMissions();

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const prevAllDone = useRef(false);

  const missions = data?.missions ?? [];
  const streak = data?.streak ?? { current: 0, longest: 0, todayCompleted: false };
  const completedCount = missions.filter((m) => m.completed).length;
  const allDone = completedCount === missions.length && missions.length > 0;

  useEffect(() => {
    if (allDone && !prevAllDone.current && missions.length > 0) {
      fireConfetti();
      toast({ title: 'All missions complete!', description: `+${missions.length * 15 + 50} XP earned`, variant: 'success' });
    }
    prevAllDone.current = allDone;
  }, [allDone, missions.length]);

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const handleReorder = useCallback(
    (reordered: Mission[]) => {
      reorderMissions.mutate(reordered.map((m) => m.id));
    },
    [reorderMissions],
  );

  function addMission() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    createMission.mutate({ label: trimmed });
    setNewLabel('');
    setAdding(false);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold">
          <ProgressRing completed={completedCount} total={missions.length} />
          <div>
            <span>Today's Mission</span>
            <div className="mt-0.5 flex items-center gap-3 text-xs font-normal text-muted-foreground">
              <span className="tabular-nums">{completedCount}/{missions.length} done</span>
              {streak.current > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="size-3 text-orange-500" />
                  {streak.current}d streak
                </span>
              )}
            </div>
          </div>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(true)}
          className="text-muted-foreground"
        >
          <Plus className="size-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="pt-1">
        {missions.length === 0 && !adding ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground/40">
              <Flame className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">No missions today</p>
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Add your first mission
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <Reorder.Group
              axis="y"
              values={missions}
              onReorder={handleReorder}
              className="space-y-2"
            >
              <AnimatePresence initial={false}>
                {missions.map((m) => (
                  <div key={m.id} className="mission-item group/mission">
                    <MissionItem
                      mission={m}
                      onToggle={() =>
                        updateMission.mutate({
                          id: m.id,
                          completed: !m.completed,
                          progress: m.completed ? 0 : m.target,
                        })
                      }
                      onDelete={() => deleteMission.mutate(m.id)}
                      onEdit={(label) => updateMission.mutate({ id: m.id, label })}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            <AnimatePresence>
              {adding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-dashed bg-secondary/20 px-3 py-2.5">
                    <Plus className="size-4 shrink-0 text-muted-foreground/40" />
                    <input
                      ref={addInputRef}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                      placeholder="What will you accomplish today?"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addMission();
                        if (e.key === 'Escape') {
                          setAdding(false);
                          setNewLabel('');
                        }
                      }}
                    />
                    <button
                      onClick={addMission}
                      disabled={!newLabel.trim()}
                      className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAdding(false); setNewLabel(''); }}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!adding && missions.length > 0 && (
              <button
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm text-muted-foreground/50 transition-colors hover:border-border hover:text-muted-foreground"
              >
                <Plus className="size-4" />
                Add mission
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
