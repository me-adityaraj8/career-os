// Backend domain + API DTO types. Data-access modules map snake_case DB rows to
// these camelCase shapes so the rest of the app never sees raw column names.

export interface User {
  id: string;
  email: string;
  name: string;
  darkMode: boolean;
  createdAt: string;
}

export type Stage =
  | 'saved'
  | 'applied'
  | 'online_assessment'
  | 'interview'
  | 'offer'
  | 'rejected';

export type Priority = 'low' | 'medium' | 'high';

export interface Application {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  location: string | null;
  salary: string | null;
  notes: string | null;
  stage: Stage;
  priority: Priority;
  tags: string[];
  appliedDate: string | null;
  resumeId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  label: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  tags: string[];
  skills: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InterviewType =
  | 'coding'
  | 'behavioral'
  | 'system_design'
  | 'online_assessment'
  | 'phone_screen'
  | 'other';

export type InterviewOutcome = 'pending' | 'passed' | 'failed' | 'cancelled';

export interface InterviewRound {
  id: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string | null;
  notes: string | null;
  outcome: InterviewOutcome;
  createdAt: string;
  updatedAt: string;
}

export type Relationship =
  | 'recruiter'
  | 'alumni'
  | 'referral'
  | 'mentor'
  | 'colleague'
  | 'other';

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  relationship: Relationship;
  email: string | null;
  lastContactDate: string | null;
  notes: string | null;
  followUp: boolean;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoalMetric = 'applications' | 'interviews' | 'offers';
export type GoalPeriod = 'week' | 'month' | 'all_time';
export type MissionMetric = 'applications' | 'interviews' | 'offers' | 'networking' | 'custom';

export interface Goal {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
