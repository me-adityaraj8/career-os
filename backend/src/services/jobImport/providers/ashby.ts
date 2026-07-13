import type { Provider, JobImport } from '../types';
import { fetchApiJson } from '../http';
import { htmlToText, prettifySlug } from '../html';
import { ApiError } from '../../../utils/ApiError';

/** Ashby — jobs.ashbyhq.com/{org}/{jobId}. Public job-board posting API. */
export const ashby: Provider = {
  id: 'ashby',
  label: 'Ashby',
  match: (url) => url.hostname === 'jobs.ashbyhq.com',
  async parse(url): Promise<JobImport> {
    const [org, jobId] = url.pathname.split('/').filter(Boolean);
    if (!org || !jobId) {
      throw ApiError.badRequest('That looks like Ashby, but not a specific job posting URL.');
    }
    const board = await fetchApiJson(
      `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}?includeCompensation=true`,
    );
    const job = (board.jobs ?? []).find((j: any) => j.id === jobId);
    if (!job) throw ApiError.badRequest('Job posting not found — it may have been taken down.');
    return {
      company: prettifySlug(org),
      role: job.title ?? 'Unknown role',
      location: job.location ?? null,
      salary: job.compensation?.compensationTierSummary ?? null,
      employmentType: job.employmentType ?? null,
      skills: [],
      description: htmlToText(job.descriptionPlain ?? job.descriptionHtml ?? ''),
      deadline: null,
      jobUrl: job.jobUrl ?? url.toString(),
      source: 'ashby',
      partial: false,
    };
  },
};
