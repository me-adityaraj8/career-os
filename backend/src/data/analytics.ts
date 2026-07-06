import { query } from '../db/pool';
import type { Stage } from '../types';

/** Raw inputs the analytics computation needs, fetched per user. */
export async function fetchAnalyticsInput(userId: string): Promise<{
  applications: Array<{ stage: Stage; date: string }>;
  resumeUsage: Array<{ id: string; label: string; count: number }>;
}> {
  // Bucket each application by applied_date, falling back to created_at.
  const { rows: appRows } = await query<{ stage: Stage; date: string }>(
    `SELECT stage,
            COALESCE(applied_date::text, created_at::date::text) AS date
       FROM applications
      WHERE user_id = $1`,
    [userId],
  );

  const { rows: resumeRows } = await query<{ id: string; label: string; count: string }>(
    `SELECT r.id, r.label, COUNT(a.id)::text AS count
       FROM resumes r
       LEFT JOIN applications a ON a.resume_id = r.id AND a.user_id = r.user_id
      WHERE r.user_id = $1
      GROUP BY r.id, r.label
     HAVING COUNT(a.id) > 0`,
    [userId],
  );

  return {
    applications: appRows,
    resumeUsage: resumeRows.map((r) => ({ id: r.id, label: r.label, count: Number(r.count) })),
  };
}
