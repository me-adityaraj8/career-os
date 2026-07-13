import type { JobImport, Provider } from './types';
import { ApiError } from '../../utils/ApiError';
import { fetchPublicHtml } from './http';
import { extractJobPosting } from './jsonld';
import { companyFromHost } from './html';
import { greenhouse } from './providers/greenhouse';
import { lever } from './providers/lever';
import { ashby } from './providers/ashby';
import { smartrecruiters } from './providers/smartrecruiters';
import { workday } from './providers/workday';

/**
 * Job import registry. Resolution order:
 *   1. A first-class provider whose official API we call directly (most reliable).
 *   2. Generic schema.org JobPosting JSON-LD scraped from the page — covers the
 *      many boards and career pages that embed structured data.
 *   3. A graceful fallback that pre-fills the URL and a domain-inferred company
 *      with a helpful notice, so the user never hits a dead end.
 *
 * Adding a new ATS = drop a module in providers/ and register it here.
 */
const providers: Provider[] = [greenhouse, lever, ashby, smartrecruiters, workday];

// Sites that commonly block server-side fetches or render entirely client-side.
// We still try, but tailor the fallback guidance when they don't cooperate.
const KNOWN_TRICKY: { test: RegExp; note: string }[] = [
  { test: /(^|\.)linkedin\.com$/, note: 'LinkedIn blocks automated import.' },
  { test: /(^|\.)indeed\.com$/, note: 'Indeed limits automated import.' },
  { test: /(^|\.)glassdoor\.[a-z.]+$/, note: 'Glassdoor limits automated import.' },
  { test: /(^|\.)naukri\.com$/, note: 'Naukri limits automated import.' },
  { test: /(^|\.)instahyre\.com$/, note: 'Instahyre renders jobs client-side.' },
  { test: /(^|\.)hirist\.(com|tech)$/, note: 'Hirist renders jobs client-side.' },
  { test: /(^|\.)cutshort\.io$/, note: 'Cutshort renders jobs client-side.' },
];

function gracefulFallback(url: URL, reason?: string): JobImport {
  const tricky = KNOWN_TRICKY.find((t) => t.test.test(url.hostname));
  const notice =
    `${tricky?.note ? tricky.note + ' ' : reason ? reason + ' ' : ''}` +
    'We pre-filled the link and company — add the role and details to finish.';
  return {
    company: companyFromHost(url.hostname),
    role: '',
    location: null,
    salary: null,
    employmentType: null,
    skills: [],
    description: '',
    deadline: null,
    jobUrl: url.toString(),
    source: 'manual',
    partial: true,
    notice: notice.trim(),
  };
}

export async function importFromUrl(rawUrl: string): Promise<JobImport> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw ApiError.badRequest('That is not a valid URL.');
  }

  // 1. First-class API providers.
  const provider = providers.find((p) => p.match(url));
  if (provider) return provider.parse(url);

  // 2. Generic JSON-LD extraction from the page.
  try {
    const { html } = await fetchPublicHtml(rawUrl);
    const job = extractJobPosting(html, url);
    if (job) return job;
    // Reachable page, but no structured job data present.
    return gracefulFallback(url, 'No structured job data was found on this page.');
  } catch (err) {
    // 3. Blocked, unreachable, or non-https — degrade gracefully.
    const reason = err instanceof ApiError ? err.message : undefined;
    return gracefulFallback(url, reason);
  }
}
