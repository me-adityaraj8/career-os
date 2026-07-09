import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
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
import { useUploadResume, useUpdateResume } from '@/hooks/useResumes';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage, isDemoReadonly } from '@/lib/api';
import type { Resume } from '@/types';

/** Upload a new resume version, or edit an existing one's metadata. */
export function ResumeDialog({
  open,
  onOpenChange,
  resume,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  resume?: Resume | null;
}) {
  const isEdit = Boolean(resume);
  const upload = useUploadResume();
  const updateResume = useUpdateResume();

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [tags, setTags] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setLabel(resume?.label ?? '');
    setTags(resume?.tags.join(', ') ?? '');
    setSkills(resume?.skills.join(', ') ?? '');
  }, [open, resume]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (isEdit && resume) {
        await updateResume.mutateAsync({
          id: resume.id,
          label,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        });
        toast({ title: 'Resume updated', variant: 'success' });
      } else {
        if (!file) {
          toast({ title: 'Please choose a PDF file', variant: 'error' });
          return;
        }
        await upload.mutateAsync({ file, label, tags, skills });
        toast({ title: 'Resume uploaded', variant: 'success' });
      }
      onOpenChange(false);
    } catch (err) {
      if (!isDemoReadonly(err)) toast({ title: apiErrorMessage(err), variant: 'error' });
    }
  }

  const pending = upload.isPending || updateResume.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit resume' : 'Upload resume'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="file">PDF file *</Label>
              <label
                htmlFor="file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground transition-colors hover:bg-secondary/40"
              >
                <Upload className="size-6" />
                {file ? <span className="font-medium text-foreground">{file.name}</span> : 'Click to choose a PDF (max 5 MB)'}
              </label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              required
              placeholder="e.g. SWE - backend focus"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rtags">Tags (comma-separated)</Label>
            <Input id="rtags" placeholder="backend, swe" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rskills">Skills (comma-separated)</Label>
            <Input
              id="rskills"
              placeholder="TypeScript, Node.js, PostgreSQL"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used by the AI job analyzer to compute resume-match scores.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
