import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Zap, Send, MessageSquare, Trophy, Bookmark, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeatmapCellDetail } from '@/lib/gamification';

const LEVEL_STYLES: React.CSSProperties[] = [
  {},
  { backgroundColor: 'color-mix(in srgb, var(--viz-seq-1) 45%, transparent)' },
  { backgroundColor: 'color-mix(in srgb, var(--viz-seq-2) 65%, transparent)' },
  { backgroundColor: 'color-mix(in srgb, var(--viz-seq-3) 85%, transparent)' },
  { backgroundColor: 'var(--viz-1)' },
];
const LEVEL_BG_CLASS = 'bg-muted/50 dark:bg-muted/30';

const LEVEL_LABELS = ['No activity', 'Light', 'Moderate', 'Active', 'Very active'];

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

interface CellRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface HoverData {
  cell: HeatmapCellDetail;
  rect: CellRect;
}

interface PopoverData {
  cell: HeatmapCellDetail;
  rect: DOMRect;
}

function HoverTooltip({
  data,
  containerRef,
}: {
  data: HoverData;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, visible: false });

  useEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const { rect } = data;

    const cellCenterX = rect.left + rect.width / 2;
    let left = cellCenterX - tooltip.width / 2;
    left = Math.max(4, Math.min(container.width - tooltip.width - 4, left));

    const top = rect.top - tooltip.height - 8;

    setPos({ top, left, visible: true });
  }, [data, containerRef]);

  const formatted = new Date(data.cell.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: pos.visible ? 1 : 0, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.12 }}
      className="pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border bg-popover px-2.5 py-1.5 text-[11px] font-medium shadow-lg"
      style={{ top: pos.top, left: pos.left }}
    >
      <span className="tabular-nums">{data.cell.count}</span>
      <span className="text-muted-foreground">
        {' '}{data.cell.count === 1 ? 'activity' : 'activities'} on{' '}
      </span>
      {formatted}
      {data.cell.xp > 0 && (
        <span className="ml-1.5 text-violet-500">+{data.cell.xp} XP</span>
      )}
    </motion.div>
  );
}

function CellPopover({
  data,
  containerRef,
  onClose,
}: {
  data: PopoverData;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
    arrowPos: 'above' | 'below';
  }>({ top: 0, left: 0, arrowLeft: 0, arrowPos: 'above' });

  useEffect(() => {
    if (!popoverRef.current || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const cellRect = data.rect;
    const popover = popoverRef.current.getBoundingClientRect();
    const gap = 10;

    const cellCenterX = cellRect.left + cellRect.width / 2 - container.left;
    let left = cellCenterX - popover.width / 2;
    left = Math.max(4, Math.min(container.width - popover.width - 4, left));

    const arrowLeft = Math.max(16, Math.min(cellCenterX - left, popover.width - 16));

    const cellTop = cellRect.top - container.top;
    const cellBottom = cellRect.bottom - container.top;
    let top: number;
    let arrowPos: 'above' | 'below';

    if (cellTop - gap - popover.height > -40) {
      top = cellTop - gap - popover.height;
      arrowPos = 'above';
    } else {
      top = cellBottom + gap;
      arrowPos = 'below';
    }

    setPos({ top, left, arrowLeft, arrowPos });
  }, [data, containerRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const { cell } = data;
  const dateObj = new Date(cell.date + 'T12:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const activities = [
    { icon: Send, label: 'Applications', value: cell.applications, color: 'text-blue-500' },
    { icon: MessageSquare, label: 'Interviews', value: cell.interviews, color: 'text-violet-500' },
    { icon: Trophy, label: 'Offers', value: cell.offers, color: 'text-emerald-500' },
    { icon: Bookmark, label: 'Saved', value: cell.saved, color: 'text-muted-foreground' },
  ].filter((a) => a.value > 0);

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.92, y: pos.arrowPos === 'above' ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: pos.arrowPos === 'above' ? 6 : -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute z-50 w-[260px] rounded-xl border bg-popover/95 shadow-2xl backdrop-blur-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute size-2.5 rotate-45 border bg-popover/95',
          pos.arrowPos === 'above'
            ? 'bottom-[-6px] border-l-0 border-t-0'
            : 'top-[-6px] border-b-0 border-r-0',
        )}
        style={{ left: pos.arrowLeft }}
      />

      <div className="relative p-3.5">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{formatted}</p>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>

        {/* Score + Level */}
        <div className="mb-3 flex items-center gap-3">
          <div className={cn('size-8 rounded-lg', LEVEL_BG_CLASS)} style={LEVEL_STYLES[cell.level]} />
          <div>
            <p className="text-lg font-semibold leading-none tabular-nums">
              {cell.count}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {cell.count === 1 ? 'activity' : 'activities'}
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{LEVEL_LABELS[cell.level]}</p>
          </div>
        </div>

        {/* Activity breakdown */}
        {activities.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {activities.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className={cn('size-3', color)} />
                  {label}
                </span>
                <span className="font-medium tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* XP + Streak */}
        <div className="flex items-center gap-3 border-t pt-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="size-3 text-violet-500" />
            <span className="font-medium tabular-nums">{cell.xp}</span>
            <span className="text-muted-foreground">XP</span>
          </div>
          {cell.isStreak && (
            <div className="flex items-center gap-1.5 text-xs">
              <Flame className="size-3 text-orange-500" />
              <span className="font-medium text-orange-500">Streak day</span>
            </div>
          )}
          {cell.count === 0 && !cell.isStreak && (
            <span className="text-[11px] text-muted-foreground/60">No streak contribution</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ActivityHeatmap({ grid }: { grid: HeatmapCellDetail[][] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [selectedCell, setSelectedCell] = useState<PopoverData | null>(null);

  const handleMouseEnter = useCallback(
    (cell: HeatmapCellDetail, e: React.MouseEvent) => {
      if (selectedCell) return;
      const el = e.currentTarget as HTMLElement;
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const cellRect = el.getBoundingClientRect();
      setHoverData({
        cell,
        rect: {
          top: cellRect.top - containerRect.top,
          left: cellRect.left - containerRect.left,
          width: cellRect.width,
          height: cellRect.height,
        },
      });
    },
    [selectedCell],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
  }, []);

  const handleCellClick = useCallback(
    (cell: HeatmapCellDetail, e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setHoverData(null);
      if (selectedCell?.cell.date === cell.date) {
        setSelectedCell(null);
      } else {
        setSelectedCell({ cell, rect });
      }
    },
    [selectedCell],
  );

  const handleClose = useCallback(() => setSelectedCell(null), []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex shrink-0 flex-col gap-[3px] pr-1 pt-5">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="flex h-[14px] items-center text-[9px] text-muted-foreground/60">
              {l}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {wi % 4 === 0 ? (
              <div className="mb-0.5 text-[9px] text-muted-foreground/50">
                {new Date(week[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
              </div>
            ) : (
              <div className="mb-0.5 h-[13px]" />
            )}

            {week.map((cell) => {
              const isSelected = selectedCell?.cell.date === cell.date;

              return (
                <motion.button
                  key={cell.date}
                  className={cn(
                    'size-[14px] rounded-[3px] transition-shadow duration-150',
                    LEVEL_BG_CLASS,
                    isSelected && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
                  )}
                  style={LEVEL_STYLES[cell.level]}
                  onMouseEnter={(e) => handleMouseEnter(cell, e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => handleCellClick(cell, e)}
                  whileHover={{ scale: 1.4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  aria-label={`${cell.date}: ${cell.count} activities`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/60">
        <span>Less</span>
        {LEVEL_STYLES.map((s, i) => (
          <div key={i} className={cn('size-[11px] rounded-[2px]', LEVEL_BG_CLASS)} style={s} />
        ))}
        <span>More</span>
      </div>

      {/* Hover tooltip — rendered outside overflow container */}
      <AnimatePresence>
        {hoverData && !selectedCell && (
          <HoverTooltip
            key="hover"
            data={hoverData}
            containerRef={containerRef}
          />
        )}
      </AnimatePresence>

      {/* Click popover */}
      <AnimatePresence>
        {selectedCell && (
          <CellPopover
            key={selectedCell.cell.date}
            data={selectedCell}
            containerRef={containerRef}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
