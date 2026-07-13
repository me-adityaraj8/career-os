import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
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
import { api, apiErrorMessage, isDemoReadonly } from '@/lib/api';
import type { Application, Priority, Stage } from '@/types';

interface JobImport {
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  employmentType: string | null;
  skills: string[];
  description: string;
  deadline: string | null;
  jobUrl: string;
  source: string;
  partial: boolean;
  notice?: string;
}

const SOURCE_LABEL: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  smartrecruiters: 'SmartRecruiters',
  workday: 'Workday',
  'json-ld': 'the job posting',
  manual: 'the link',
};

function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

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

  // One-click import: paste a job posting URL from any supported board or
  // career page and Rys fills the form. The user reviews before saving.
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) setImportUrl('');
  }, [open]);

  async function runImport() {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const { data } = await api.get<{ import: JobImport }>('/applications/import-preview', {
        params: { url },
      });
      const job = data.import;

      // Fold structured extras the form has no dedicated field for into notes.
      const extras = [
        job.employmentType ? `Employment type: ${job.employmentType}` : null,
        job.deadline ? `Apply by: ${job.deadline}` : null,
      ].filter(Boolean);
      const notes = [extras.join(' · '), job.description].filter(Boolean).join('\n\n');

      // Skills become tags, merged with anything already typed.
      const mergedTags = [
        ...new Set([...splitTags(form.tags), ...job.skills].map((t) => t.trim()).filter(Boolean)),
      ].join(', ');

      setForm((f) => ({
        ...f,
        company: job.company || f.company,
        role: job.role || f.role,
        jobUrl: job.jobUrl,
        location: job.location ?? f.location,
        salary: job.salary ?? f.salary,
        tags: mergedTags,
        notes: notes || f.notes,
      }));

      if (job.partial) {
        toast({
          title: 'Partial import',
          description: job.notice ?? 'Add the remaining details, then save.',
          variant: 'default',
        });
      } else {
        toast({
          title: `Imported from ${SOURCE_LABEL[job.source] ?? job.source}`,
          description: 'Review the details, then save.',
          variant: 'success',
        });
      }
    } catch (err) {
      toast({ title: apiErrorMessage(err, 'Import failed'), variant: 'error' });
    } finally {
      setImporting(false);
    }
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
          {!isEdit && (
            <div className="rounded-xl border border-dashed bg-secondary/30 p-3.5">
              <div className="mb-2 flex items-start gap-2 text-xs font-medium text-muted-foreground">
                <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Paste any job posting URL — Greenhouse, Lever, Ashby, SmartRecruiters, Workday,
                  or most career pages — and Rys fills this in.
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://…  (paste a job link)"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runImport();
                    }
                  }}
                  className="bg-background"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={runImport}
                  disabled={importing || !importUrl.trim()}
                  className="shrink-0"
                >
                  {importing ? <Loader2 className="size-4 animate-spin" /> : 'Import'}
                </Button>
              </div>
            </div>
          )}

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
