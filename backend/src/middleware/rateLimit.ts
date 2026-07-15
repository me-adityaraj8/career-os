import rateLimit, { type Options } from 'express-rate-limit';

/**
 * Tiered rate limiting. Strict on the endpoints that are expensive or abusable
 * (auth = brute-force/credential-stuffing, AI = model cost, import = outbound
 * fetches), with a generous baseline everywhere else as a blunt DoS guard.
 *
 * The in-memory store suits the single-container deploy; move to a shared store
 * (e.g. Redis) if the API is ever scaled to multiple instances.
 */
function make(windowMs: number, limit: number, code: string, message: string) {
  const opts: Partial<Options> = {
    windowMs,
    limit,
    standardHeaders: 'draft-7', // RateLimit-* headers
    legacyHeaders: false,
    // Match the app's error envelope so clients handle it like any other error.
    handler: (_req, res) => {
      res.status(429).json({ error: { code, message } });
    },
  };
  return rateLimit(opts);
}

const MIN = 60_000;

/** Baseline guard on the whole API — high enough to never touch normal use. */
export const generalLimiter = make(15 * MIN, 1000, 'rate_limited', 'Too many requests. Please slow down.');

/** Brute-force / credential-stuffing protection on login & registration. */
export const authLimiter = make(
  15 * MIN,
  12,
  'rate_limited',
  'Too many attempts. Please wait a few minutes and try again.',
);

/** Protects paid model calls from runaway usage. */
export const aiLimiter = make(
  15 * MIN,
  40,
  'rate_limited',
  'You have run a lot of AI requests. Please wait a few minutes.',
);

/** Limits outbound fetches triggered by the job-import endpoint. */
export const importLimiter = make(
  15 * MIN,
  60,
  'rate_limited',
  'Too many import requests. Please wait a moment.',
);
