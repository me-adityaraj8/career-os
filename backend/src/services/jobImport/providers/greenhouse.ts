import type { Provider, JobImport } from '../types';
import { fetchApiJson } from '../http';
import { htmlToText, prettifySlug } from '../html';
import { ApiError } from '../../../utils/ApiError';

/** Greenhouse — boards.greenhouse.io / job-boards.greenhouse.io. Public boards API. */
export const greenhouse: Provider = {
  id: 'greenhouse',
  label: 'Greenhouse',
  match: (url) => url.hostname === 'boards.greenhouse.io' || url.hostname === 'job-boards.greenhouse.io',
  async parse(url): Promise<JobImport> {
    const path = url.pathname.split('/').filter(Boolean);
    const jobsIdx = path.indexOf('jobs');
    const board = path[0];
    const jobId = jobsIdx > 0 ? path[jobsIdx + 1] : undefined;
    if (!board || !jobId || !/^\d+$/.test(jobId)) {
      throw ApiError.badRequest('That looks like Greenhouse, but not a specific job posting URL.');
    }
    const base = 'https://boards-api.greenhouse.io/v1/boards';
    const [job, boardMeta] = await Promise.all([
      fetchApiJson(`${base}/${encodeURIComponent(board)}/jobs/${jobId}`),
      fetchApiJson(`${base}/${encodeURIComponent(board)}`).catch(() => null),
    ]);
    return {
      company: boardMeta?.name || prettifySlug(board),
      role: job.title ?? 'Unknown role',
      location: job.location?.name ?? null,
      salary: null,
      employmentType: null,
      skills: [],
      description: htmlToText(job.content ?? ''),
      deadline: null,
      jobUrl: job.absolute_url ?? url.toString(),
      source: 'greenhouse',
      partial: false,
    };
  },
};
