import { Response } from 'express';
import * as aiService from '../services/ai/aiService';
import { AuthedRequest, getUserId } from '../middleware/auth';
import { isAiLive, env } from '../config/env';

/** Report whether AI runs live or in mock mode (drives a banner in the UI). */
export async function status(_req: AuthedRequest, res: Response): Promise<void> {
  res.json({ mode: isAiLive ? 'live' : 'mock', model: isAiLive ? env.anthropicModel : 'mock' });
}

export async function analyzeJob(req: AuthedRequest, res: Response): Promise<void> {
  const analysis = await aiService.analyzeJob(getUserId(req), req.body);
  res.status(201).json({ analysis });
}

export async function listAnalyses(req: AuthedRequest, res: Response): Promise<void> {
  const { applicationId } = req.query as { applicationId?: string };
  res.json({ analyses: await aiService.listAnalyses(getUserId(req), applicationId) });
}

export async function coverLetter(req: AuthedRequest, res: Response): Promise<void> {
  const letter = await aiService.generateCoverLetter(getUserId(req), req.body);
  res.status(201).json({ coverLetter: letter });
}

export async function updateCoverLetter(req: AuthedRequest, res: Response): Promise<void> {
  const letter = await aiService.updateCoverLetter(getUserId(req), req.params.id, req.body.content);
  res.json({ coverLetter: letter });
}

export async function listCoverLetters(req: AuthedRequest, res: Response): Promise<void> {
  const { applicationId } = req.query as { applicationId?: string };
  res.json({ coverLetters: await aiService.listCoverLetters(getUserId(req), applicationId) });
}

export async function interviewQuestions(req: AuthedRequest, res: Response): Promise<void> {
  const set = await aiService.generateInterviewQuestions(getUserId(req), req.body);
  res.status(201).json({ questionSet: set });
}

export async function listQuestions(req: AuthedRequest, res: Response): Promise<void> {
  const { applicationId } = req.query as { applicationId?: string };
  res.json({ questionSets: await aiService.listQuestions(getUserId(req), applicationId) });
}
