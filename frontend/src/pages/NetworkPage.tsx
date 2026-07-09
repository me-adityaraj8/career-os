import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Bell, MoreVertical, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContactDialog } from '@/components/network/ContactDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useContacts, useDeleteContact, useUpdateContact } from '@/hooks/useContacts';
import { RELATIONSHIP_LABEL } from '@/lib/constants';
import { cn, formatDate, initials } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import type { Contact } from '@/types';

export default function NetworkPage() {
  const { data: contacts, isLoading, isError } = useContacts();
  const del = useDeleteContact();
  const update = useUpdateContact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Network"
        description="Your job-search CRM — recruiters, referrals, alumni, and mentors."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add contact
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4" style={{ opacity: 1 - i * 0.1 }}>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-28" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState icon={Users} title="Couldn't load contacts" description="Please refresh to try again." />
      )}

      {!isLoading && !isError && contacts?.length === 0 && (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add recruiters, referrals, and mentors to keep your network organized."
          action={<Button onClick={openAdd}><Plus className="size-4" /> Add contact</Button>}
        />
      )}

      {!isLoading && contacts && contacts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
              whileHover={{ y: -2 }}
            >
              <Card className={cn('h-full transition-shadow duration-300 hover:shadow-elev-2', c.followUp && 'ring-1 ring-foreground/25')}>
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">{c.name}</p>
                        <Badge variant="secondary" className="mt-1 px-1.5 py-0 text-[10px]">
                          {RELATIONSHIP_LABEL[c.relationship]}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-secondary">
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(c); setDialogOpen(true); }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => update.mutate({ id: c.id, followUp: !c.followUp })}
                        >
                          {c.followUp ? 'Clear follow-up' : 'Flag follow-up'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleting(c)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {(c.company || c.role) && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="size-3.5" />
                      {[c.role, c.company].filter(Boolean).join(' @ ')}
                    </p>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                      <Mail className="size-3.5" />
                      {c.email}
                    </a>
                  )}
                  {c.notes && <p className="line-clamp-2 text-sm text-muted-foreground">{c.notes}</p>}

                  <div className="mt-auto flex items-center justify-between pt-2 text-xs">
                    <span className="text-muted-foreground">
                      {c.lastContactDate ? `Last: ${formatDate(c.lastContactDate)}` : 'No contact yet'}
                    </span>
                    {c.followUp && (
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <Bell className="size-3" />
                        {c.followUpDate ? formatDate(c.followUpDate) : 'Follow up'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ContactDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete contact?"
        description={deleting ? `This will remove ${deleting.name} from your network.` : ''}
        onConfirm={async () => {
          if (!deleting) return;
          await del.mutateAsync(deleting.id);
          toast({ title: 'Contact deleted', variant: 'success' });
        }}
      />
    </div>
  );
}
