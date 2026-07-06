import { env, isAiLive } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import * as aiData from '../../data/ai';
import * as resumesData from '../../data/resumes';
import * as applicationsData from '../../data/applications';
import { callJson, callText } from './aiClient';
import { computeMatchScore } from './matchScore';
import { mockAnalyzeJob, mockCoverLetter, mockInterviewQuestions } from './mocks';

const MOCK_MODEL = 'mock';

/** Load a resume's declared skills, verifying it belongs to the user. */
async function resumeSkills(userId: string, resumeId?: string | null): Promise<string[]> {
  if (!resumeId) return [];
  const resume = await resumesData.getById(userId, resumeId);
  if (!resume) throw ApiError.badRequest('Resume not found');
  return resume.skills;
}

// ---- Job analyzer ----

interface AnalyzeInput {
  jobDescription: string;
  applicationId?: string | null;
  resumeId?: string | null;
}

/**
 * Extract a summary, required skills, and ATS keywords from a job description,
 * and compute a resume-match score. The LLM extracts the skills/keywords; the
 * match score is always computed deterministically by computeMatchScore so it's
 * explainable and independent of model variance.
 */
export async function analyzeJob(
  userId: string,
  input: AnalyzeInput,
): Promise<aiData.JobAnalysisRecord> {
  const skills = await resumeSkills(userId, input.resumeId);

  let summary: string;
  let requiredSkills: string[];
  let atsKeywords: string[];
  let isMock: boolean;

  if (isAiLive) {
    const result = await callJson<{
      summary: string;
      requiredSkills: string[];
      atsKeywords: string[];
    }>({
      system:
        'You are an expert technical recruiter and ATS analyst. Extract structured, factual data from job descriptions. Be concise and specific.',
      prompt: `Analyze this job description and return JSON with: a 2-3 sentence "summary", a "requiredSkills" array (concrete skills/technologies the role requires), and an "atsKeywords" array (terms an applicant tracking system would scan for).\n\nJOB DESCRIPTION:\n${input.jobDescription}`,
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          atsKeywords: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'requiredSkills', 'atsKeywords'],
        additionalProperties: false,
      },
    });
    ({ summary, requiredSkills, atsKeywords } = result);
    isMock = false;
  } else {
    // MOCK MODE — clearly marked; no API key configured.
    ({ summary, requiredSkills, atsKeywords } = mockAnalyzeJob(input.jobDescription));
    isMock = true;
  }

  const matchScore = input.resumeId ? computeMatchScore(requiredSkills, skills) : null;

  return aiData.saveAnalysis(userId, {
    applicationId: input.applicationId ?? null,
    resumeId: input.resumeId ?? null,
    jobDescription: input.jobDescription,
    summary,
    requiredSkills,
    atsKeywords,
    matchScore,
    model: isMock ? MOCK_MODEL : env.anthropicModel,
    isMock,
  });
}

export function listAnalyses(userId: string, applicationId?: string) {
  return aiData.listAnalyses(userId, applicationId);
}

// ---- Cover letter generator ----

interface CoverLetterInput {
  jobDescription: string;
  applicationId?: string | null;
  resumeId?: string | null;
  company?: string;
  role?: string;
}

export async function generateCoverLetter(
  userId: string,
  input: CoverLetterInput,
): Promise<aiData.CoverLetterRecord> {
  const skills = await resumeSkills(userId, input.resumeId);
  const ctx = await applicationContext(userId, input.applicationId, input.company, input.role);

  let content: string;
  let isMock: boolean;

  if (isAiLive) {
    content = await callText({
      system:
        'You are a career coach who writes concise, specific, non-generic cover letters. Avoid clichés and filler. 3-4 short paragraphs. Do not invent facts about the candidate beyond the provided skills.',
      prompt: `Write a tailored cover letter for the role of ${ctx.role} at ${ctx.company}.\n\nCandidate's key skills: ${skills.join(', ') || 'general software engineering'}.\n\nJOB DESCRIPTION:\n${input.jobDescription}`,
      maxTokens: 1200,
    });
    isMock = false;
  } else {
    // MOCK MODE — clearly marked.
    content = mockCoverLetter({ company: ctx.company, role: ctx.role, skills });
    isMock = true;
  }

  return aiData.saveCoverLetter(userId, {
    applicationId: input.applicationId ?? null,
    content,
    model: isMock ? MOCK_MODEL : env.anthropicModel,
    isMock,
  });
}

export async function updateCoverLetter(userId: string, id: string, content: string) {
  const updated = await aiData.updateCoverLetter(userId, id, content);
  if (!updated) throw ApiError.notFound('Cover letter not found');
  return updated;
}

export function listCoverLetters(userId: string, applicationId?: string) {
  return aiData.listCoverLetters(userId, applicationId);
}

// ---- Interview coach ----

interface InterviewQuestionInput {
  company: string;
  role: string;
  jobDescription?: string | null;
  applicationId?: string | null;
}

export async function generateInterviewQuestions(
  userId: string,
  input: InterviewQuestionInput,
): Promise<aiData.InterviewQuestionRecord> {
  let questions: aiData.InterviewQuestionItem[];
  let isMock: boolean;

  if (isAiLive) {
    const result = await callJson<{ questions: aiData.InterviewQuestionItem[] }>({
      system:
        'You are an interview coach. Generate likely interview questions grouped by category. Be specific to the role and company.',
      prompt: `Generate ~9 likely interview questions for a ${input.role} role at ${input.company}. Include a mix of "technical", "behavioral", and "company"-specific questions.${
        input.jobDescription ? `\n\nJOB DESCRIPTION:\n${input.jobDescription}` : ''
      }`,
      schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['technical', 'behavioral', 'company'] },
                question: { type: 'string' },
              },
              required: ['category', 'question'],
              additionalProperties: false,
            },
          },
        },
        required: ['questions'],
        additionalProperties: false,
      },
      maxTokens: 2048,
    });
    questions = result.questions;
    isMock = false;
  } else {
    // MOCK MODE — clearly marked.
    questions = mockInterviewQuestions(input.company, input.role);
    isMock = true;
  }

  return aiData.saveQuestions(userId, {
    applicationId: input.applicationId ?? null,
    company: input.company,
    role: input.role,
    questions,
    model: isMock ? MOCK_MODEL : env.anthropicModel,
    isMock,
  });
}

export function listQuestions(userId: string, applicationId?: string) {
  return aiData.listQuestions(userId, applicationId);
}

/** Resolve company/role from an application when not passed explicitly. */
async function applicationContext(
  userId: string,
  applicationId: string | null | undefined,
  company?: string,
  role?: string,
): Promise<{ company: string; role: string }> {
  if (company && role) return { company, role };
  if (applicationId) {
    const app = await applicationsData.getById(userId, applicationId);
    if (app) return { company: company ?? app.company, role: role ?? app.role };
  }
  return { company: company ?? 'the company', role: role ?? 'the role' };
}
