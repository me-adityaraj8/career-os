import type { Stage } from '../../types';

export interface AnalyticsInput {
  // One entry per application: its current stage and the date to bucket it under
  // (applied date if present, else created date), as 'YYYY-MM-DD'.
  applications: Array<{ stage: Stage; date: string }>;
  // Application counts per resume, for the "most-used resume" stat.
  resumeUsage: Array<{ id: string; label: string; count: number }>;
}

export interface AnalyticsSummary {
  totals: { applications: number; interviews: number; offers: number; rejected: number };
  rates: { responseRate: number; interviewRate: number; offerRate: number };
  perWeek: Array<{ week: string; count: number }>;
  funnel: Array<{ stage: string; count: number }>;
  mostUsedResume: { id: string; label: string; count: number } | null;
}

/** Monday (as YYYY-MM-DD) of the ISO week containing `date`. */
export function weekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // getUTCDay: 0 (Sun)–6 (Sat). Shift so Monday is the start of the week.
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/**
 * Pure analytics computation over application data. Kept free of DB/IO so it can
 * be unit-tested directly. `now` is injectable for deterministic week bucketing.
 *
 * Funnel semantics (saved → applied → interview → offer):
 *  - applied   = any stage past "saved"
 *  - interview = reached the interview or offer stage
 *  - offer     = reached the offer stage
 */
export function computeAnalytics(
  input: AnalyticsInput,
  weeks = 8,
  now: Date = new Date(),
): AnalyticsSummary {
  const apps = input.applications;
  const total = apps.length;

  const applied = apps.filter((a) => a.stage !== 'saved').length;
  const progressed = apps.filter((a) =>
    ['online_assessment', 'interview', 'offer'].includes(a.stage),
  ).length;
  const interviews = apps.filter((a) => a.stage === 'interview' || a.stage === 'offer').length;
  const offers = apps.filter((a) => a.stage === 'offer').length;
  const rejected = apps.filter((a) => a.stage === 'rejected').length;

  // Build the last `weeks` week buckets (oldest → newest), starting empty.
  const buckets: Array<{ week: string; count: number }> = [];
  const currentMonday = new Date(`${weekStart(now)}T00:00:00Z`);
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(currentMonday);
    d.setUTCDate(d.getUTCDate() - i * 7);
    buckets.push({ week: d.toISOString().slice(0, 10), count: 0 });
  }
  const bucketIndex = new Map(buckets.map((b, i) => [b.week, i]));
  for (const a of apps) {
    if (!a.date) continue;
    const wk = weekStart(new Date(`${a.date}T00:00:00Z`));
    const idx = bucketIndex.get(wk);
    if (idx !== undefined) buckets[idx].count += 1;
  }

  const mostUsedResume = input.resumeUsage.length
    ? input.resumeUsage.reduce((best, r) => (r.count > best.count ? r : best))
    : null;

  return {
    totals: { applications: total, interviews, offers, rejected },
    rates: {
      responseRate: pct(progressed, applied),
      interviewRate: pct(interviews, applied),
      offerRate: pct(offers, applied),
    },
    perWeek: buckets,
    funnel: [
      { stage: 'Saved', count: total },
      { stage: 'Applied', count: applied },
      { stage: 'Interview', count: interviews },
      { stage: 'Offer', count: offers },
    ],
    mostUsedResume,
  };
}
