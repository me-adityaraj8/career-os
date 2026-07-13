import { MAX_DESCRIPTION } from './types';

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

/** Convert an HTML fragment to readable, length-capped plain text. */
export function htmlToText(html: string): string {
  if (!html) return '';
  // Decode twice — some boards double-encode their stored HTML.
  return decodeEntities(decodeEntities(html))
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_DESCRIPTION);
}

/** "acme-labs" / "acme_labs" → "Acme Labs". */
export function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Best-effort company name from a hostname (careers.acme.com → "Acme"). */
export function companyFromHost(host: string): string {
  const parts = host.replace(/^www\./, '').split('.');
  const generic = new Set(['careers', 'jobs', 'boards', 'apply', 'job', 'work', 'talent', 'hire', 'recruiting']);
  const meaningful = parts.filter((p) => !generic.has(p));
  const name = meaningful[0] ?? parts[0] ?? host;
  return prettifySlug(name);
}
