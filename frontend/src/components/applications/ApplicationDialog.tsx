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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAGES, PRIORITIES } from '@/lib/constants';
import { useResumes } from '@/hooks/useResumes';
import { useCreateApplication, useUpdateApplication } from '@/hooks/useApplications';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage, isDemoReadonly } from '@/lib/api';
import type { Application, Priority, Stage } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application | null; // present = edit mode
  defaultStage?: Stage;
}

/** Create/edit dialog for a job application. */
export function ApplicationDialog({ open, onOpenChange, application, defaultStage }: Props) {
  const isEdit = Boolean(application);
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const { data: resumes } = useResumes();

  const [form, setForm] = useState({
    company: '',
    role: '',
    jobUrl: '',
    location: '',
    salary: '',
    stage: (defaultStage ?? 'saved') as Stage,
    priority: 'medium' as Priority,
    tags: '',
    appliedDate: '',
    notes: '',
    resumeId: 'none',
  });

  // Hydrate the form whenever the dialog opens (for the current app or a blank).
  useEffect(() => {
    if (!open) return;
    if (application) {
      setForm({
        company: application.company,
        role: application.role,
        jobUrl: application.jobUrl ?? '',
        location: application.location ?? '',
        salary: application.salary ?? '',
        stage: application.stage,
        priority: application.priority,
        tags: application.tags.join(', '),
        appliedDate: application.appliedDate ?? '',
        notes: application.notes ?? '',
        resumeId: application.resumeId ?? 'none',
      });
    } else {
      setForm({
        company: '',
        role: '',
        jobUrl: '',
        location: '',
        salary: '',
        stage: defaultStage ?? 'saved',
        priority: 'medium',
        tags: '',
        appliedDate: '',
        notes: '',
        resumeId: 'none',
      });
    }
  }, [open, application, defaultStage]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      company: form.company.trim(),
      role: form.role.trim(),
      jobUrl: form.jobUrl.trim() || null,
      location: form.location.trim() || null,
      salary: form.salary.trim() || null,
      stage: form.stage,
      priority: form.priority,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      appliedDate: form.appliedDate || null,
      notes: form.notes.trim() || null,
      resumeId: form.resumeId === 'none' ? null : form.resumeId,
    };
    try {
      if (isEdit && application) {
        await update.mutateAsync({ id: application.id, ...payload });
        toast({ title: 'Application updated', variant: 'success' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Application added', variant: 'success' });
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
          <DialogTitle>{isEdit ? 'Edit application' : 'Add application'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" required value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input id="role" required value={form.role} onChange={(e) => set('role', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input id="jobUrl" type="url" placeholder="https://…" value={form.jobUrl} onChange={(e) => set('jobUrl', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" placeholder="e.g. $150k" value={form.salary} onChange={(e) => set('salary', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => set('stage', v as Stage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appliedDate">Applied date</Label>
              <Input id="appliedDate" type="date" value={form.appliedDate} onChange={(e) => set('appliedDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" placeholder="dream-company, remote" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resume used</Label>
            <Select value={form.resumeId} onValueChange={(v) => set('resumeId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {resumes?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Add application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
