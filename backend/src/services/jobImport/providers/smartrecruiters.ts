import type { Provider, JobImport } from '../types';
import { fetchApiJson } from '../http';
import { htmlToText, prettifySlug } from '../html';
import { ApiError } from '../../../utils/ApiError';

/**
 * SmartRecruiters — jobs.smartrecruiters.com/{Company}/{postingId}-{slug}
 * or careers.smartrecruiters.com/{Company}/{id}. Public posting API.
 */
export const smartrecruiters: Provider = {
  id: 'smartrecruiters',
  label: 'SmartRecruiters',
  match: (url) => url.hostname.endsWith('smartrecruiters.com'),
  async parse(url): Promise<JobImport> {
    const path = url.pathname.split('/').filter(Boolean);
    const company = path[0];
    // The posting id is the leading numeric run of the last segment.
    const last = path[path.length - 1] ?? '';
    const postingId = last.match(/^\d+/)?.[0];
    if (!company || !postingId) {
      throw ApiError.badRequest('That looks like SmartRecruiters, but not a specific job posting URL.');
    }
    const job = await fetchApiJson(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings/${postingId}`,
    );
    const loc = job.location;
    const location = loc
      ? [loc.city, loc.region, loc.country?.toUpperCase()].filter(Boolean).join(', ') || (loc.remote ? 'Remote' : null)
      : null;
    const sections = job.jobAd?.sections ?? {};
    const description = htmlToText(
      [sections.jobDescription?.text, sections.qualifications?.text, sections.additionalInformation?.text]
        .filter(Boolean)
        .join('\n\n'),
    );
    const comp = job.compensation;
    const salary =
      comp?.min && comp?.max
        ? `${comp.currency ?? ''} ${comp.min.toLocaleString('en-US')}–${comp.max.toLocaleString('en-US')}`.trim()
        : null;
    return {
      company: job.company?.name ?? prettifySlug(company),
      role: job.name ?? 'Unknown role',
      location,
      salary,
      employmentType: job.typeOfEmployment?.label ?? null,
      skills: [],
      description,
      deadline: null,
      jobUrl: job.applyUrl ?? job.postingUrl ?? url.toString(),
      source: 'smartrecruiters',
      partial: false,
    };
  },
};
