import { forwardRef } from 'react';
import { MoreVertical, MapPin, ExternalLink, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PRIORITIES } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import type { Application } from '@/types';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  application: Application;
  onEdit?: () => void;
  onDelete?: () => void;
  dragging?: boolean;
}

/** Presentational kanban card. Also used inside the drag overlay. */
export const ApplicationCard = forwardRef<HTMLDivElement, Props>(
  ({ application, onEdit, onDelete, dragging, className, ...props }, ref) => {
    const priority = PRIORITIES.find((p) => p.value === application.priority);
    return (
      <div
        ref={ref}
        className={cn(
          'group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
          dragging && 'opacity-50',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{application.company}</p>
            <p className="truncate text-xs text-muted-foreground">{application.role}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              {application.jobUrl && (
                <DropdownMenuItem asChild>
                  <a href={application.jobUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Open job
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(application.location || application.tags.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {application.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {application.location}
              </span>
            )}
            {application.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground" title={`${priority?.label} priority`}>
            <Circle className={cn('size-2 fill-current', priority?.className)} />
            {priority?.label}
          </span>
          {application.appliedDate && (
            <span className="text-[11px] text-muted-foreground">
              {formatDate(application.appliedDate)}
            </span>
          )}
        </div>
      </div>
    );
  },
);
ApplicationCard.displayName = 'ApplicationCard';
