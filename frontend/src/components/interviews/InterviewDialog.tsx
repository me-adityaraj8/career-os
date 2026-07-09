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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INTERVIEW_TYPES, INTERVIEW_OUTCOMES } from '@/lib/constants';
import { useApplications } from '@/hooks/useApplications';
import { useCreateInterview, useUpdateInterview } from '@/hooks/useInterviews';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage, isDemoReadonly } from '@/lib/api';
import type { InterviewOutcome, InterviewRound, InterviewType } from '@/types';

/** Convert an ISO string to the value a datetime-local input expects (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function InterviewDialog({
  open,
  onOpenChange,
  round,
  defaultApplicationId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  round?: InterviewRound | null;
  defaultApplicationId?: string;
}) {
  const isEdit = Boolean(round);
  const { data: applications } = useApplications();
  const create = useCreateInterview();
  const update = useUpdateInterview();

  const [applicationId, setApplicationId] = useState('');
  const [type, setType] = useState<InterviewType>('phone_screen');
  const [outcome, setOutcome] = useState<InterviewOutcome>('pending');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setApplicationId(round?.applicationId ?? defaultApplicationId ?? '');
    setType(round?.type ?? 'phone_screen');
    setOutcome(round?.outcome ?? 'pending');
    setScheduledAt(toLocalInput(round?.scheduledAt ?? null));
    setNotes(round?.notes ?? '');
  }, [open, round, defaultApplicationId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!applicationId) {
      toast({ title: 'Please select an application', variant: 'error' });
      return;
    }
    const payload = {
      type,
      outcome,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      notes: notes.trim() || null,
    };
    try {
      if (isEdit && round) {
        await update.mutateAsync({ id: round.id, ...payload });
        toast({ title: 'Interview updated', variant: 'success' });
      } else {
        await create.mutateAsync({ applicationId, ...payload });
        toast({ title: 'Interview round added', variant: 'success' });
      }
      onOpenChange(false);
    } catch (err) {
      if (!isDemoReadonly(err)) toast({ title: apiErrorMessage(err), variant: 'error' });
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit interview round' : 'Add interview round'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Application</Label>
            <Select value={applicationId} onValueChange={setApplicationId} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Select an application" />
              </SelectTrigger>
              <SelectContent>
                {applications?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.company} — {a.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as InterviewOutcome)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVIEW_OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ivnotes">Notes (prep + feedback)</Label>
            <Textarea id="ivnotes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save' : 'Add round'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
