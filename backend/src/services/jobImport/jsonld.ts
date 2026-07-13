import type { JobImport } from './types';
import { htmlToText, companyFromHost } from './html';

/**
 * Extract a schema.org JobPosting from a page's JSON-LD. This is the generic
 * engine behind support for the many boards and company career pages that
 * embed structured data for SEO (the same data Google Jobs reads).
 */

type Json = Record<string, any>;

/** Pull every <script type="application/ld+json"> block and flatten @graph. */
function collectLdObjects(html: string): Json[] {
  const out: Json[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].trim();
    if (!text) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue; // skip malformed blocks rather than fail the whole import
    }
    const stack: unknown[] = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (Array.isArray(node)) stack.push(...node);
      else if (node && typeof node === 'object') {
        out.push(node as Json);
        if (Array.isArray((node as Json)['@graph'])) stack.push(...(node as Json)['@graph']);
      }
    }
  }
  return out;
}

function typeMatchesJobPosting(t: unknown): boolean {
  if (typeof t === 'string') return t.toLowerCase().includes('jobposting');
  if (Array.isArray(t)) return t.some(typeMatchesJobPosting);
  return false;
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function formatLocation(job: Json): string | null {
  const loc = job.jobLocation;
  const entries = Array.isArray(loc) ? loc : loc ? [loc] : [];
  const parts: string[] = [];
  for (const l of entries) {
    const addr = l?.address ?? l;
    const city = firstString(addr?.addressLocality);
    const region = firstString(addr?.addressRegion);
    const country = firstString(addr?.addressCountry?.name, addr?.addressCountry);
    const one = [city, region, country].filter(Boolean).join(', ');
    if (one) parts.push(one);
  }
  const isRemote =
    job.jobLocationType === 'TELECOMMUTE' ||
    (Array.isArray(job.applicantLocationRequirements) || job.applicantLocationRequirements);
  if (parts.length === 0 && isRemote) return 'Remote';
  const unique = [...new Set(parts)];
  if (unique.length === 0) return null;
  const joined = unique.slice(0, 2).join(' · ');
  return job.jobLocationType === 'TELECOMMUTE' ? `${joined} · Remote` : joined;
}

function formatSalary(job: Json): string | null {
  const s = job.baseSalary ?? job.estimatedSalary;
  if (!s) return null;
  const currency = firstString(s.currency, s.currencyCode) ?? '';
  const value = s.value ?? s;
  const unitRaw = firstString(value?.unitText, s.unitText);
  const unit = unitRaw ? ` / ${unitRaw.toLowerCase()}` : '';
  const fmt = (n: unknown) => {
    const num = typeof n === 'number' ? n : Number(n);
    return Number.isFinite(num) ? num.toLocaleString('en-US') : null;
  };
  const min = fmt(value?.minValue);
  const max = fmt(value?.maxValue);
  const single = fmt(value?.value);
  let amount: string | null = null;
  if (min && max) amount = `${min}–${max}`;
  else if (single) amount = single;
  else if (min) amount = `${min}+`;
  if (!amount) return null;
  return `${currency} ${amount}${unit}`.trim();
}

function formatEmploymentType(job: Json): string | null {
  const t = job.employmentType;
  const arr = Array.isArray(t) ? t : t ? [t] : [];
  const labels = arr
    .map((x) => firstString(x))
    .filter(Boolean)
    .map((x) => (x as string).replace(/_/g, ' ').toLowerCase())
    .map((x) => x.replace(/\b\w/g, (c) => c.toUpperCase()));
  return labels.length ? [...new Set(labels)].join(', ') : null;
}

function extractSkills(job: Json): string[] {
  const raw = job.skills ?? job.qualifications ?? job.experienceRequirements;
  const collected: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string') collected.push(...v.split(/[,;/•\n]/));
    else if (v && typeof v === 'object') collected.push(...(firstString((v as Json).name) ? [(v as Json).name] : []));
  };
  if (Array.isArray(raw)) raw.forEach(push);
  else push(raw);
  return [
    ...new Set(
      collected
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 40),
    ),
  ].slice(0, 12);
}

function toIsoDate(v: unknown): string | null {
  const s = firstString(v);
  if (!s) return null;
  // Prefer the literal calendar date to avoid timezone off-by-one on
  // midnight timestamps (e.g. "2026-08-15T00:00:00" must stay the 15th).
  const literal = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (literal) return literal[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Find and normalize a JobPosting from the page, or null if none present. */
export function extractJobPosting(html: string, url: URL): JobImport | null {
  const job = collectLdObjects(html).find((o) => typeMatchesJobPosting(o['@type']));
  if (!job) return null;

  const org = job.hiringOrganization;
  const company =
    firstString(typeof org === 'string' ? org : org?.name, job.identifier?.name) ?? companyFromHost(url.hostname);
  const role = firstString(job.title) ?? 'Untitled role';

  return {
    company,
    role,
    location: formatLocation(job),
    salary: formatSalary(job),
    employmentType: formatEmploymentType(job),
    skills: extractSkills(job),
    description: htmlToText(firstString(job.description) ?? ''),
    deadline: toIsoDate(job.validThrough),
    jobUrl: firstString(job.url) ?? url.toString(),
    source: 'json-ld',
    partial: false,
  };
}
