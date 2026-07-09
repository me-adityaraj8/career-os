import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ExternalLink, Circle, Calendar, FileText, Clock,
  Briefcase, Tag, DollarSign, X, StickyNote, BarChart3, Gauge,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRIORITIES, STAGE_LABEL } from '@/lib/constants';
import { computeOpportunityScore } from '@/lib/gamification';
import { cn, formatDate } from '@/lib/utils';
import { useInterviews } from '@/hooks/useInterviews';
import type { Application } from '@/types';

interface Props {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  saved: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  applied: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  online_assessment: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  interview: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function ApplicationDetailModal({ application, open, onClose, onEdit }: Props) {
  const { data: allInterviews } = useInterviews();
  const opp = useMemo(() => application ? computeOpportunityScore(application) : null, [application]);

  if (!application || !opp) return null;

  const priority = PRIORITIES.find((p) => p.value === application.priority);
  const interviews = allInterviews?.filter((i) => i.applicationId === application.id) ?? [];
  const stageColor = STAGE_COLORS[application.stage] ?? 'bg-slate-500/10 text-slate-500';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative border-b px-6 pb-5 pt-6">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground/50 transition-all hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-foreground">
                  {application.company.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold tracking-tight">{application.company}</h2>
                  <p className="mt-0.5 text-[15px] text-muted-foreground">{application.role}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', stageColor)}>
                      {STAGE_LABEL[application.stage]}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Circle className={cn('size-2 fill-current', priority?.className)} />
                      {priority?.label} priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {application.location && (
                    <DetailItem icon={MapPin} label="Location" value={application.location} />
                  )}
                  {application.salary && (
                    <DetailItem icon={DollarSign} label="Salary" value={application.salary} />
                  )}
                  {application.appliedDate && (
                    <DetailItem icon={Calendar} label="Applied" value={formatDate(application.appliedDate)} />
                  )}
                  <DetailItem icon={Clock} label="Added" value={formatDate(application.createdAt)} />
                </div>

                {/* Opportunity Score */}
                <div>
                  <SectionLabel icon={Gauge} label="Opportunity Score" />
                  <div className="mt-2 rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-12 items-center justify-center">
                        <svg viewBox="0 0 48 48" className="size-12 -rotate-90">
                          <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3" className="stroke-muted/30" />
                          <motion.circle
                            cx="24" cy="24" r="20" fill="none" strokeWidth="3.5" strokeLinecap="round"
                            className={opp.color.replace('text-', 'stroke-')}
                            initial={{ strokeDashoffset: 125.66 }}
                            animate={{ strokeDashoffset: 125.66 * (1 - opp.score / 100) }}
                            style={{ strokeDasharray: 125.66 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </svg>
                        <span className={cn('absolute text-sm font-bold tabular-nums', opp.color)}>{opp.score}</span>
                      </div>
                      <div>
                        <p className={cn('text-sm font-semibold', opp.color)}>{opp.label}</p>
                        <p className="text-xs text-muted-foreground">Based on stage, priority, recency, and details</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-1">
                      {[
                        { label: 'Stage', val: opp.breakdown.stage },
                        { label: 'Priority', val: opp.breakdown.priority },
                        { label: 'Recency', val: opp.breakdown.recency },
                        { label: 'Details', val: opp.breakdown.completeness },
                        { label: 'Tags', val: opp.breakdown.tags },
                      ].map(({ label, val }) => (
                        <div key={label} className="text-center">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                            <motion.div
                              className={cn('h-full rounded-full', opp.color.replace('text-', 'bg-'))}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (val / 20) * 100)}%` }}
                              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="mt-1 block text-[9px] text-muted-foreground/60">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {application.tags.length > 0 && (
                  <div>
                    <SectionLabel icon={Tag} label="Tags" />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {application.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-lg px-2.5 py-0.5 text-xs font-medium">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {application.notes && (
                  <div>
                    <SectionLabel icon={StickyNote} label="Notes" />
                    <p className="mt-2 whitespace-pre-wrap rounded-xl bg-secondary/50 p-3.5 text-sm leading-relaxed text-muted-foreground">
                      {application.notes}
                    </p>
                  </div>
                )}

                {/* Interviews */}
                {interviews.length > 0 && (
                  <div>
                    <SectionLabel icon={Briefcase} label={`Interviews (${interviews.length})`} />
                    <div className="mt-2 space-y-2">
                      {interviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {interview.type.replace(/_/g, ' ')}
                            </p>
                            {interview.scheduledAt && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatDate(interview.scheduledAt)}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'rounded-lg capitalize',
                              interview.outcome === 'passed' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                              interview.outcome === 'failed' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                              interview.outcome === 'pending' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                              interview.outcome === 'cancelled' && 'bg-secondary text-muted-foreground/60',
                            )}
                          >
                            {interview.outcome}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No extra details placeholder */}
                {!application.notes && interviews.length === 0 && application.tags.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <BarChart3 className="size-8 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground/60">
                      No additional details yet. Edit this application to add notes, tags, and more.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t px-6 py-4">
              {application.jobUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={application.jobUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" /> View job posting
                  </a>
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              {onEdit && (
                <Button size="sm" onClick={onEdit}>
                  <FileText className="size-3.5" /> Edit
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
      <Icon className="size-3.5" />
      {label}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
