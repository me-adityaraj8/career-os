import { MoreVertical, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STAGE_LABEL, PRIORITY_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Application } from '@/types';

/** Tabular list view of applications (alternative to the kanban board). */
export function ApplicationsListView({
  applications,
  onEdit,
  onDelete,
}: {
  applications: Application[];
  onEdit: (a: Application) => void;
  onDelete: (a: Application) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
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
            <tr key={a.id} className="transition-colors hover:bg-muted/30">
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
  );
}
