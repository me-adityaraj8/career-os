import { ApiError } from '../utils/ApiError';

/**
 * Job import: given a public posting URL from a supported ATS job board,
 * fetch the board's official JSON API and return normalized fields the
 * client uses to pre-fill a new application. No scraping — only documented
 * public endpoints (Greenhouse, Lever, Ashby).
 *
 * Security: the user-supplied URL is never fetched directly. It is parsed,
 * its host checked against an exact allowlist, and its path components are
 * re-encoded into fixed API hosts we control — so this endpoint cannot be
 * used to reach arbitrary or internal addresses.
 */

export interface JobImport {
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  jobUrl: string;
  description: string;
  source: 'greenhouse' | 'lever' | 'ashby';
}

const FETCH_TIMEOUT_MS = 8_000;
const MAX_DESCRIPTION = 5_000;

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Rys/1.0 (+https://rys.app)' },
    });
    if (!res.ok) {
      throw ApiError.badRequest(
        res.status === 404
          ? 'Job posting not found — it may have been taken down.'
          : `The job board responded with ${res.status}.`,
      );
    }
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest('Could not reach the job board. Check the URL and try again.');
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** Decode HTML entities (twice — Greenhouse double-encodes) and strip tags. */
function htmlToText(html: string): string {
  return decodeEntities(decodeEntities(html))
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_DESCRIPTION);
}

/** "acme-labs" → "Acme Labs" for boards whose API omits the company name. */
function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ------------------------------------------------------------------ */
/* Per-board parsers                                                    */
/* ------------------------------------------------------------------ */

async function importGreenhouse(path: string[], jobUrl: string): Promise<JobImport> {
  // boards.greenhouse.io/{board}/jobs/{id}
  const jobsIdx = path.indexOf('jobs');
  const board = path[0];
  const jobId = jobsIdx > 0 ? path[jobsIdx + 1] : undefined;
  if (!board || !jobId || !/^\d+$/.test(jobId)) {
    throw ApiError.badRequest('That looks like Greenhouse, but not a specific job posting URL.');
  }
  const base = 'https://boards-api.greenhouse.io/v1/boards';
  const [job, boardMeta] = await Promise.all([
    fetchJson(`${base}/${encodeURIComponent(board)}/jobs/${jobId}`),
    fetchJson(`${base}/${encodeURIComponent(board)}`).catch(() => null),
  ]);
  return {
    company: boardMeta?.name || prettifySlug(board),
    role: job.title ?? 'Unknown role',
    location: job.location?.name ?? null,
    salary: null,
    jobUrl: job.absolute_url ?? jobUrl,
    description: htmlToText(job.content ?? ''),
    source: 'greenhouse',
  };
}

async function importLever(path: string[], jobUrl: string): Promise<JobImport> {
  // jobs.lever.co/{company}/{postingId}
  const [company, postingId] = path;
  if (!company || !postingId) {
    throw ApiError.badRequest('That looks like Lever, but not a specific job posting URL.');
  }
  const job = await fetchJson(
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
    jobUrl: job.hostedUrl ?? jobUrl,
    description: htmlToText(job.descriptionPlain ?? job.description ?? ''),
    source: 'lever',
  };
}

async function importAshby(path: string[], jobUrl: string): Promise<JobImport> {
  // jobs.ashbyhq.com/{org}/{jobId}
  const [org, jobId] = path;
  if (!org || !jobId) {
    throw ApiError.badRequest('That looks like Ashby, but not a specific job posting URL.');
  }
  const board = await fetchJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}?includeCompensation=true`,
  );
  const job = (board.jobs ?? []).find((j: any) => j.id === jobId);
  if (!job) throw ApiError.badRequest('Job posting not found — it may have been taken down.');
  return {
    company: prettifySlug(org),
    role: job.title ?? 'Unknown role',
    location: job.location ?? null,
    salary: job.compensation?.compensationTierSummary ?? null,
    jobUrl: job.jobUrl ?? jobUrl,
    description: htmlToText(job.descriptionPlain ?? job.descriptionHtml ?? ''),
    source: 'ashby',
  };
}

/* ------------------------------------------------------------------ */

const SUPPORTED =
  'Supported job boards: Greenhouse (boards.greenhouse.io), Lever (jobs.lever.co), and Ashby (jobs.ashbyhq.com).';

export async function importFromUrl(rawUrl: string): Promise<JobImport> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw ApiError.badRequest('That is not a valid URL.');
  }
  if (url.protocol !== 'https:') throw ApiError.badRequest('Only https job posting URLs are supported.');

  const path = url.pathname.split('/').filter(Boolean);
  switch (url.hostname) {
    case 'boards.greenhouse.io':
    case 'job-boards.greenhouse.io':
      return importGreenhouse(path, rawUrl);
    case 'jobs.lever.co':
      return importLever(path, rawUrl);
    case 'jobs.ashbyhq.com':
      return importAshby(path, rawUrl);
    default:
      throw ApiError.badRequest(`This job board isn't supported yet. ${SUPPORTED}`);
  }
}
