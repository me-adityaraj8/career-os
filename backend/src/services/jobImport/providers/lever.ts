import type { Provider, JobImport } from '../types';
import { fetchApiJson } from '../http';
import { htmlToText, prettifySlug } from '../html';
import { ApiError } from '../../../utils/ApiError';

/** Lever — jobs.lever.co/{company}/{postingId}. Public postings API. */
export const lever: Provider = {
  id: 'lever',
  label: 'Lever',
  match: (url) => url.hostname === 'jobs.lever.co',
  async parse(url): Promise<JobImport> {
    const [company, postingId] = url.pathname.split('/').filter(Boolean);
    if (!company || !postingId) {
      throw ApiError.badRequest('That looks like Lever, but not a specific job posting URL.');
    }
    const job = await fetchApiJson(
      `https://api.lever.co/v0/postings/${encodeURIComponent(company)}/${encodeURIComponent(postingId)}`,
    );
    const range = job.salaryRange;
    const salary =
      range?.min && range?.max
        ? `${range.currency ?? ''} ${Math.round(range.min / 1000)}k–${Math.round(range.max / 1000)}k`.trim()
        : null;
    return {
      company: prettifySlug(company),
      role: job.text ?? 'Unknown role',
      location: job.categories?.location ?? null,
      salary,
      employmentType: job.categories?.commitment ?? null,
      skills: [],
      description: htmlToText(job.descriptionPlain ?? job.description ?? ''),
      deadline: null,
      jobUrl: job.hostedUrl ?? url.toString(),
      source: 'lever',
      partial: false,
    };
  },
};
