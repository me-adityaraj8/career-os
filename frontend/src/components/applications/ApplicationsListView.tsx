import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical, ExternalLink, Trash2, ArrowRightLeft, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAGES, STAGE_LABEL, PRIORITY_LABEL } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import type { Application, Stage } from '@/types';

export function ApplicationsListView({
  applications,
  onEdit,
  onDelete,
  onBulkStageChange,
  onBulkDelete,
}: {
  applications: Application[];
  onEdit: (a: Application) => void;
  onDelete: (a: Application) => void;
  onBulkStageChange?: (ids: string[], stage: Stage) => void;
  onBulkDelete?: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === applications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(applications.map((a) => a.id)));
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const hasSelection = selected.size > 0;
  const allSelected = selected.size === applications.length && applications.length > 0;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-2.5">
              <CheckSquare className="size-4 text-primary" />
              <span className="text-sm font-medium">
                {selected.size} selected
              </span>
              <div className="flex items-center gap-2 border-l pl-3">
                {onBulkStageChange && (
                  <Select
                    onValueChange={(stage) => {
                      onBulkStageChange([...selected], stage as Stage);
                      clearSelection();
                    }}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <ArrowRightLeft className="mr-1 size-3" />
                      <SelectValue placeholder="Move to…" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {onBulkDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      onBulkDelete([...selected]);
                      clearSelection();
                    }}
                  >
                    <Trash2 className="size-3" /> Delete
                  </Button>
                )}
              </div>
              <button
                onClick={clearSelection}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-3.5 cursor-pointer rounded border-border accent-primary"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Stage</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Priority</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Location</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Applied</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.map((a) => (
              <tr
                key={a.id}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  selected.has(a.id) && 'bg-primary/[0.04]',
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggle(a.id)}
                    className="size-3.5 cursor-pointer rounded border-border accent-primary"
                    aria-label={`Select ${a.company}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{a.company}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.role}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge variant="secondary">{STAGE_LABEL[a.stage]}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {PRIORITY_LABEL[a.priority]}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {a.location ?? '—'}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {formatDate(a.appliedDate)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-secondary">
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(a)}>Edit</DropdownMenuItem>
                      {a.jobUrl && (
                        <DropdownMenuItem asChild>
                          <a href={a.jobUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" /> Open job
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(a)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
