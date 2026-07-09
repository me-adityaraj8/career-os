import { FormEvent, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGoal, useUpdateGoal } from '@/hooks/useGoals';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage } from '@/lib/api';
import { GOAL_TEMPLATES } from '@/lib/gamification';
import type { Goal, GoalMetric, GoalPeriod } from '@/types';

const METRICS: { value: GoalMetric; label: string }[] = [
  { value: 'applications', label: 'Applications' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'offers', label: 'Offers' },
];
const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all_time', label: 'All time' },
];

export function GoalDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  goal?: Goal | null;
}) {
  const isEdit = Boolean(goal);
  const create = useCreateGoal();
  const update = useUpdateGoal();

  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState<GoalMetric>('applications');
  const [period, setPeriod] = useState<GoalPeriod>('month');
  const [target, setTarget] = useState('20');

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? '');
    setMetric(goal?.metric ?? 'applications');
    setPeriod(goal?.period ?? 'month');
    setTarget(String(goal?.target ?? 20));
  }, [open, goal]);

  function applyTemplate(templateName: string) {
    const tpl = GOAL_TEMPLATES.find((t) => t.name === templateName);
    if (!tpl || tpl.goals.length === 0) return;
    const first = tpl.goals[0];
    setTitle(first.title);
    setMetric(first.metric);
    setPeriod(first.period);
    setTarget(String(first.target));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { title: title.trim(), metric, period, target: parseInt(target, 10) || 1 };
    try {
      if (isEdit && goal) {
        await update.mutateAsync({ id: goal.id, ...payload });
        toast({ title: 'Goal updated', variant: 'success' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Goal created', variant: 'success' });
      }
      onOpenChange(false);
    } catch (err) {
      toast({ title: apiErrorMessage(err), variant: 'error' });
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit goal' : 'New goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Start from a template…" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TEMPLATES.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      <span className="font-medium">{t.name}</span>
                      <span className="ml-2 text-muted-foreground">— {t.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="gtitle">Title</Label>
            <Input id="gtitle" required placeholder="e.g. Apply to 20 roles this month" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Metric</Label>
              <Select value={metric} onValueChange={(v) => setMetric(v as GoalMetric)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as GoalPeriod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtarget">Target</Label>
              <Input id="gtarget" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save' : 'Create goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
