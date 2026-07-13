import dns from 'dns';
import net from 'net';
import { ApiError } from '../../utils/ApiError';

/**
 * HTTP helpers for job import.
 *
 * Two distinct fetch paths with different trust levels:
 *  - `fetchApiJson` hits our own fixed, allowlisted ATS API hosts. The host is
 *    never user-controlled (providers build the URL), so no SSRF guard is needed.
 *  - `fetchPublicHtml` fetches an arbitrary user-supplied page (generic JSON-LD).
 *    Every hop is validated against a private-address blocklist to prevent SSRF,
 *    and redirects are followed manually so a public URL can't bounce to an
 *    internal one.
 */

const TIMEOUT_MS = 9_000;
const MAX_BYTES = 3_000_000; // 3 MB cap on fetched HTML
const MAX_REDIRECTS = 4;
const UA = 'Rys/1.0 (+https://rys.app; job import)';

export async function fetchApiJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': UA },
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

/* ------------------------------------------------------------------ */
/* SSRF protection                                                     */
/* ------------------------------------------------------------------ */

function ipIsPrivate(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true; // private, loopback, "this host"
    if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata 169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // loopback / unspecified
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local
    // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4 address.
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return ipIsPrivate(mapped[1]);
    return false;
  }
  return false;
}

/** Reject non-https and any host that resolves to a private/internal address. */
async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== 'https:') {
    throw ApiError.badRequest('Only https job posting URLs are supported.');
  }
  const host = url.hostname;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw ApiError.badRequest('That URL points to a local address.');
  }
  // If the host is an IP literal, check it directly; otherwise resolve it.
  const literals = net.isIP(host) ? [host] : (await dns.promises.lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (literals.length === 0) {
    throw ApiError.badRequest('Could not resolve that address.');
  }
  if (literals.some(ipIsPrivate)) {
    throw ApiError.badRequest('That URL points to a private address.');
  }
}

/**
 * Fetch a public HTML page with SSRF protection and manual redirect handling.
 * Returns the response body as text (capped), or throws a user-facing ApiError.
 */
export async function fetchPublicHtml(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  let current = new URL(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          // Ask for HTML; a real UA reduces (not eliminates) bot blocks.
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': UA,
          'Accept-Language': 'en',
        },
      });
    } catch {
      throw ApiError.badRequest('Could not reach that page. It may be blocking automated requests.');
    } finally {
      clearTimeout(timer);
    }

    // Follow redirects manually, re-validating each hop.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw ApiError.badRequest('The page redirected without a destination.');
      current = new URL(loc, current);
      continue;
    }

    if (res.status === 403 || res.status === 429 || res.status === 999) {
      throw ApiError.badRequest('This site blocks automated import. Paste the details manually.');
    }
    if (!res.ok) {
      throw ApiError.badRequest(
        res.status === 404 ? 'Job posting not found — it may have been taken down.' : `The site responded with ${res.status}.`,
      );
    }

    const reader = res.body?.getReader();
    if (!reader) return { html: await res.text(), finalUrl: current.toString() };

    // Stream up to MAX_BYTES so a huge page can't exhaust memory.
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        chunks.push(value);
        if (total > MAX_BYTES) {
          await reader.cancel();
          break;
        }
      }
    }
    return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: current.toString() };
  }
  throw ApiError.badRequest('That URL redirected too many times.');
}
