import type { Priority, Stage, InterviewType, Relationship, InterviewOutcome } from '@/types';

/** Kanban stages in board order — soft functional hues on the mono canvas. */
export const STAGES: { value: Stage; label: string; color: string }[] = [
  { value: 'saved', label: 'Saved', color: 'bg-slate-400' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'online_assessment', label: 'Online Assessment', color: 'bg-violet-500' },
  { value: 'interview', label: 'Interview', color: 'bg-amber-500' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-500/80' },
];

export const STAGE_LABEL: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s.value, s.label]),
) as Record<Stage, string>;

export const PRIORITIES: { value: Priority; label: string; className: string }[] = [
  { value: 'low', label: 'Low', className: 'text-slate-400' },
  { value: 'medium', label: 'Medium', className: 'text-amber-500' },
  { value: 'high', label: 'High', className: 'text-rose-500' },
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'online_assessment', label: 'Online Assessment' },
  { value: 'coding', label: 'Coding' },
  { value: 'system_design', label: 'System Design' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'other', label: 'Other' },
];

export const INTERVIEW_TYPE_LABEL: Record<InterviewType, string> = Object.fromEntries(
  INTERVIEW_TYPES.map((t) => [t.value, t.label]),
) as Record<InterviewType, string>;

/** Tinted pill classes per interview type — categorical identity colors. */
export const INTERVIEW_TYPE_COLORS: Record<InterviewType, string> = {
  coding: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  behavioral: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  system_design: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  online_assessment: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  phone_screen: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  other: 'bg-secondary text-muted-foreground',
};

export const INTERVIEW_OUTCOMES: { value: InterviewOutcome; label: string; className: string }[] = [
  { value: 'pending', label: 'Pending', className: 'text-amber-500' },
  { value: 'passed', label: 'Passed', className: 'text-emerald-500' },
  { value: 'failed', label: 'Failed', className: 'text-rose-500' },
  { value: 'cancelled', label: 'Cancelled', className: 'text-slate-400' },
];

export const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'referral', label: 'Referral' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'other', label: 'Other' },
];

export const RELATIONSHIP_LABEL: Record<Relationship, string> = Object.fromEntries(
  RELATIONSHIPS.map((r) => [r.value, r.label]),
) as Record<Relationship, string>;
