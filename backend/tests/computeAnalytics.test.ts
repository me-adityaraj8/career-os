import { describe, it, expect } from 'vitest';
import { computeAnalytics, weekStart } from '../src/services/analytics/computeAnalytics';
import type { Stage } from '../src/types';

const app = (stage: Stage, date = '2026-07-01') => ({ stage, date });

describe('weekStart', () => {
  it('returns the Monday of the ISO week', () => {
    // 2026-07-01 is a Wednesday -> Monday is 2026-06-29
    expect(weekStart(new Date('2026-07-01T12:00:00Z'))).toBe('2026-06-29');
    // A Monday maps to itself
    expect(weekStart(new Date('2026-06-29T00:00:00Z'))).toBe('2026-06-29');
    // A Sunday maps back to the prior Monday
    expect(weekStart(new Date('2026-07-05T23:00:00Z'))).toBe('2026-06-29');
  });
});

describe('computeAnalytics', () => {
  it('computes totals and funnel from stages', () => {
    const r = computeAnalytics({
      applications: [
        app('saved'),
        app('applied'),
        app('applied'),
        app('online_assessment'),
        app('interview'),
        app('offer'),
        app('rejected'),
      ],
      resumeUsage: [],
    });

    expect(r.totals.applications).toBe(7);
    expect(r.totals.interviews).toBe(2); // interview + offer
    expect(r.totals.offers).toBe(1);
    expect(r.totals.rejected).toBe(1);

    expect(r.funnel).toEqual([
      { stage: 'Saved', count: 7 },
      { stage: 'Applied', count: 6 }, // everything except the one 'saved'
      { stage: 'Interview', count: 2 },
      { stage: 'Offer', count: 1 },
    ]);
  });

  it('computes rates as whole-number percentages of applied', () => {
    const r = computeAnalytics({
      applications: [
        app('saved'), // not applied
        app('applied'),
        app('applied'),
        app('online_assessment'), // progressed
        app('interview'), // progressed + interview
        app('offer'), // progressed + interview + offer
      ],
      resumeUsage: [],
    });
    // applied = 5, progressed = 3, interviews = 2, offers = 1
    expect(r.rates.responseRate).toBe(60); // 3/5
    expect(r.rates.interviewRate).toBe(40); // 2/5
    expect(r.rates.offerRate).toBe(20); // 1/5
  });

  it('avoids divide-by-zero when nothing is applied', () => {
    const r = computeAnalytics({ applications: [app('saved')], resumeUsage: [] });
    expect(r.rates).toEqual({ responseRate: 0, interviewRate: 0, offerRate: 0 });
  });

  it('buckets applications into the correct week', () => {
    const now = new Date('2026-07-08T00:00:00Z'); // Wednesday; week Monday = 2026-07-06
    const r = computeAnalytics(
      {
        applications: [app('applied', '2026-07-06'), app('applied', '2026-07-07')],
        resumeUsage: [],
      },
      8,
      now,
    );
    const thisWeek = r.perWeek.find((w) => w.week === '2026-07-06');
    expect(thisWeek?.count).toBe(2);
    expect(r.perWeek).toHaveLength(8);
  });

  it('picks the most-used resume', () => {
    const r = computeAnalytics({
      applications: [],
      resumeUsage: [
        { id: 'a', label: 'Backend', count: 3 },
        { id: 'b', label: 'Frontend', count: 5 },
      ],
    });
    expect(r.mostUsedResume).toEqual({ id: 'b', label: 'Frontend', count: 5 });
  });
});
