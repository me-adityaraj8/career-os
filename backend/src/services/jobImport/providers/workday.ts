import type { Provider, JobImport } from '../types';
import { fetchApiJson } from '../http';
import { htmlToText } from '../html';
import { ApiError } from '../../../utils/ApiError';

/**
 * Workday — {tenant}.wd{n}.myworkdayjobs.com/{lang?}/{site}/job/{loc}/{title}_{req}
 * Career sites are served by the same-origin "CXS" JSON API, which we
 * reconstruct from the public URL (same host — no cross-origin fetch).
 */
export const workday: Provider = {
  id: 'workday',
  label: 'Workday',
  match: (url) => url.hostname.endsWith('.myworkdayjobs.com'),
  async parse(url): Promise<JobImport> {
    const segments = url.pathname.split('/').filter(Boolean);
    const jobIdx = segments.indexOf('job');
    const tenant = url.hostname.split('.')[0];
    const site = jobIdx > 0 ? segments[jobIdx - 1] : undefined;
    if (jobIdx === -1 || !site || !tenant) {
      throw ApiError.badRequest('That looks like Workday, but not a specific job posting URL.');
    }
    const jobPath = segments.slice(jobIdx).join('/'); // job/{loc}/{title}_{req}
    const cxs = `${url.origin}/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}/${jobPath}`;
    const data = await fetchApiJson(cxs);
    const info = data.jobPostingInfo ?? data;

    const locations = [info.location, ...(info.additionalLocations ?? [])].filter(Boolean);
    return {
      company: info.company ?? tenant.replace(/\b\w/g, (c: string) => c.toUpperCase()),
      role: info.title ?? 'Unknown role',
      location: locations.length ? [...new Set(locations)].slice(0, 2).join(' · ') : null,
      salary: null,
      employmentType: info.timeType ?? null,
      skills: [],
      description: htmlToText(info.jobDescription ?? ''),
      deadline: info.endDate ? new Date(info.endDate).toISOString().slice(0, 10) : null,
      jobUrl: info.externalUrl ?? url.toString(),
      source: 'workday',
      partial: false,
    };
  },
};
