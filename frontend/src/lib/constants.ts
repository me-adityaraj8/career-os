import type { Priority, Stage, InterviewType, Relationship, InterviewOutcome } from '@/types';

/**
 * Kanban stages in board order. Monochrome design language: progression is a
 * luminance ramp (dim → solid) rather than hue; rejected fades out.
 */
export const STAGES: { value: Stage; label: string; color: string }[] = [
  { value: 'saved', label: 'Saved', color: 'bg-foreground/25' },
  { value: 'applied', label: 'Applied', color: 'bg-foreground/45' },
  { value: 'online_assessment', label: 'Online Assessment', color: 'bg-foreground/60' },
  { value: 'interview', label: 'Interview', color: 'bg-foreground/80' },
  { value: 'offer', label: 'Offer', color: 'bg-foreground' },
  { value: 'rejected', label: 'Rejected', color: 'bg-foreground/15' },
];

export const STAGE_LABEL: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s.value, s.label]),
) as Record<Stage, string>;

export const PRIORITIES: { value: Priority; label: string; className: string }[] = [
  { value: 'low', label: 'Low', className: 'text-foreground/25' },
  { value: 'medium', label: 'Medium', className: 'text-foreground/55' },
  { value: 'high', label: 'High', className: 'text-foreground' },
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

export const INTERVIEW_OUTCOMES: { value: InterviewOutcome; label: string; className: string }[] = [
  { value: 'pending', label: 'Pending', className: 'text-foreground/50' },
  { value: 'passed', label: 'Passed', className: 'text-foreground' },
  { value: 'failed', label: 'Failed', className: 'text-muted-foreground' },
  { value: 'cancelled', label: 'Cancelled', className: 'text-muted-foreground/50' },
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
