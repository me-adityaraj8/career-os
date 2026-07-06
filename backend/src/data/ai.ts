import { query } from '../db/pool';

// ---- Job analyses ----

export interface JobAnalysisRecord {
  id: string;
  applicationId: string | null;
  resumeId: string | null;
  jobDescription: string;
  summary: string;
  requiredSkills: string[];
  atsKeywords: string[];
  matchScore: number | null;
  model: string;
  isMock: boolean;
  createdAt: string;
}

interface JobAnalysisRow {
  id: string;
  application_id: string | null;
  resume_id: string | null;
  job_description: string;
  summary: string;
  required_skills: string[];
  ats_keywords: string[];
  match_score: number | null;
  model: string;
  is_mock: boolean;
  created_at: Date;
}

function mapAnalysis(r: JobAnalysisRow): JobAnalysisRecord {
  return {
    id: r.id,
    applicationId: r.application_id,
    resumeId: r.resume_id,
    jobDescription: r.job_description,
    summary: r.summary,
    requiredSkills: r.required_skills,
    atsKeywords: r.ats_keywords,
    matchScore: r.match_score,
    model: r.model,
    isMock: r.is_mock,
    createdAt: r.created_at.toISOString(),
  };
}

export async function saveAnalysis(
  userId: string,
  input: Omit<JobAnalysisRecord, 'id' | 'createdAt'>,
): Promise<JobAnalysisRecord> {
  const { rows } = await query<JobAnalysisRow>(
    `INSERT INTO job_analyses
       (user_id, application_id, resume_id, job_description, summary, required_skills, ats_keywords, match_score, model, is_mock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      input.applicationId,
      input.resumeId,
      input.jobDescription,
      input.summary,
      input.requiredSkills,
      input.atsKeywords,
      input.matchScore,
      input.model,
      input.isMock,
    ],
  );
  return mapAnalysis(rows[0]);
}

export async function listAnalyses(
  userId: string,
  applicationId?: string,
): Promise<JobAnalysisRecord[]> {
  const params: unknown[] = [userId];
  let where = 'user_id = $1';
  if (applicationId) {
    params.push(applicationId);
    where += ' AND application_id = $2';
  }
  const { rows } = await query<JobAnalysisRow>(
    `SELECT * FROM job_analyses WHERE ${where} ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapAnalysis);
}

// ---- Cover letters ----

export interface CoverLetterRecord {
  id: string;
  applicationId: string | null;
  content: string;
  model: string;
  isMock: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CoverLetterRow {
  id: string;
  application_id: string | null;
  content: string;
  model: string;
  is_mock: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapCoverLetter(r: CoverLetterRow): CoverLetterRecord {
  return {
    id: r.id,
    applicationId: r.application_id,
    content: r.content,
    model: r.model,
    isMock: r.is_mock,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function saveCoverLetter(
  userId: string,
  input: { applicationId: string | null; content: string; model: string; isMock: boolean },
): Promise<CoverLetterRecord> {
  const { rows } = await query<CoverLetterRow>(
    `INSERT INTO cover_letters (user_id, application_id, content, model, is_mock)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, input.applicationId, input.content, input.model, input.isMock],
  );
  return mapCoverLetter(rows[0]);
}

export async function updateCoverLetter(
  userId: string,
  id: string,
  content: string,
): Promise<CoverLetterRecord | null> {
  const { rows } = await query<CoverLetterRow>(
    'UPDATE cover_letters SET content = $3 WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId, content],
  );
  return rows.length ? mapCoverLetter(rows[0]) : null;
}

export async function listCoverLetters(
  userId: string,
  applicationId?: string,
): Promise<CoverLetterRecord[]> {
  const params: unknown[] = [userId];
  let where = 'user_id = $1';
  if (applicationId) {
    params.push(applicationId);
    where += ' AND application_id = $2';
  }
  const { rows } = await query<CoverLetterRow>(
    `SELECT * FROM cover_letters WHERE ${where} ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapCoverLetter);
}

// ---- Interview questions ----

export interface InterviewQuestionItem {
  category: 'technical' | 'behavioral' | 'company';
  question: string;
}

export interface InterviewQuestionRecord {
  id: string;
  applicationId: string | null;
  company: string;
  role: string;
  questions: InterviewQuestionItem[];
  model: string;
  isMock: boolean;
  createdAt: string;
}

interface InterviewQuestionRow {
  id: string;
  application_id: string | null;
  company: string;
  role: string;
  questions: InterviewQuestionItem[];
  model: string;
  is_mock: boolean;
  created_at: Date;
}

function mapQuestions(r: InterviewQuestionRow): InterviewQuestionRecord {
  return {
    id: r.id,
    applicationId: r.application_id,
    company: r.company,
    role: r.role,
    questions: r.questions,
    model: r.model,
    isMock: r.is_mock,
    createdAt: r.created_at.toISOString(),
  };
}

export async function saveQuestions(
  userId: string,
  input: {
    applicationId: string | null;
    company: string;
    role: string;
    questions: InterviewQuestionItem[];
    model: string;
    isMock: boolean;
  },
): Promise<InterviewQuestionRecord> {
  const { rows } = await query<InterviewQuestionRow>(
    `INSERT INTO interview_questions (user_id, application_id, company, role, questions, model, is_mock)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      userId,
      input.applicationId,
      input.company,
      input.role,
      JSON.stringify(input.questions),
      input.model,
      input.isMock,
    ],
  );
  return mapQuestions(rows[0]);
}

export async function listQuestions(
  userId: string,
  applicationId?: string,
): Promise<InterviewQuestionRecord[]> {
  const params: unknown[] = [userId];
  let where = 'user_id = $1';
  if (applicationId) {
    params.push(applicationId);
    where += ' AND application_id = $2';
  }
  const { rows } = await query<InterviewQuestionRow>(
    `SELECT * FROM interview_questions WHERE ${where} ORDER BY created_at DESC`,
    params,
  );
  return rows.map(mapQuestions);
}
