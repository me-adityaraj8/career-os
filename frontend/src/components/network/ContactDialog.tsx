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
import { RELATIONSHIPS } from '@/lib/constants';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage } from '@/lib/api';
import type { Contact, Relationship } from '@/types';

export function ContactDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contact?: Contact | null;
}) {
  const isEdit = Boolean(contact);
  const create = useCreateContact();
  const update = useUpdateContact();

  const [form, setForm] = useState({
    name: '',
    company: '',
    role: '',
    relationship: 'other' as Relationship,
    email: '',
    lastContactDate: '',
    notes: '',
    followUp: false,
    followUpDate: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: contact?.name ?? '',
      company: contact?.company ?? '',
      role: contact?.role ?? '',
      relationship: contact?.relationship ?? 'other',
      email: contact?.email ?? '',
      lastContactDate: contact?.lastContactDate ?? '',
      notes: contact?.notes ?? '',
      followUp: contact?.followUp ?? false,
      followUpDate: contact?.followUpDate ?? '',
    });
  }, [open, contact]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      role: form.role.trim() || null,
      relationship: form.relationship,
      email: form.email.trim() || null,
      lastContactDate: form.lastContactDate || null,
      notes: form.notes.trim() || null,
      followUp: form.followUp,
      followUpDate: form.followUp ? form.followUpDate || null : null,
    };
    try {
      if (isEdit && contact) {
        await update.mutateAsync({ id: contact.id, ...payload });
        toast({ title: 'Contact updated', variant: 'success' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Contact added', variant: 'success' });
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
          <DialogTitle>{isEdit ? 'Edit contact' : 'Add contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cname">Name *</Label>
              <Input id="cname" required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={form.relationship} onValueChange={(v) => set('relationship', v as Relationship)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ccompany">Company</Label>
              <Input id="ccompany" value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crole">Role</Label>
              <Input id="crole" value={form.role} onChange={(e) => set('role', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clast">Last contacted</Label>
              <Input id="clast" type="date" value={form.lastContactDate} onChange={(e) => set('lastContactDate', e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.followUp}
                onChange={(e) => set('followUp', e.target.checked)}
                className="size-4 rounded border-input"
              />
              Flag for follow-up
            </label>
            {form.followUp && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="cfollow">Follow-up by</Label>
                <Input id="cfollow" type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnotes">Notes</Label>
            <Textarea id="cnotes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Save' : 'Add contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
