import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/** Compact metric card used on the dashboard and analytics pages. */
export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
