import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './pool';

/**
 * Seeds local dev sample data. Idempotent: it deletes the demo user first
 * (cascades to all their data) and recreates everything.
 *
 * Demo login:  demo@careeros.dev  /  password123
 *
 * Run with: npm run seed   (run migrations first)
 */
const DEMO_EMAIL = 'demo@careeros.dev';
const DEMO_PASSWORD = 'password123';

async function seed(): Promise<void> {
  await withTransaction(async (client) => {
    // Fresh start for the demo account.
    await client.query('DELETE FROM users WHERE lower(email) = lower($1)', [DEMO_EMAIL]);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const {
      rows: [user],
    } = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, dark_mode)
       VALUES ($1, $2, $3, false) RETURNING id`,
      [DEMO_EMAIL, passwordHash, 'Demo User'],
    );

    // Resumes
    const {
      rows: [resume],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'SWE - backend focus', 'resume_backend.pdf', 'seed-backend.pdf', 'application/pdf', 102400,
               ARRAY['backend','swe'], ARRAY['TypeScript','Node.js','PostgreSQL','Docker','REST APIs'], true)
       RETURNING id`,
      [user.id],
    );

    // Applications across stages, over the last few weeks.
    const apps: Array<[string, string, string, string, string, number]> = [
      // company, role, stage, priority, location, daysAgo
      ['Stripe', 'Backend Engineer', 'interview', 'high', 'Remote', 20],
      ['Vercel', 'Full Stack Engineer', 'applied', 'high', 'Remote', 12],
      ['Linear', 'Product Engineer', 'online_assessment', 'medium', 'SF', 9],
      ['Notion', 'Software Engineer', 'applied', 'medium', 'NYC', 7],
      ['Figma', 'Frontend Engineer', 'saved', 'low', 'SF', 3],
      ['Datadog', 'Platform Engineer', 'rejected', 'medium', 'NYC', 25],
      ['Airtable', 'Backend Engineer', 'offer', 'high', 'Remote', 30],
      ['Ramp', 'Software Engineer', 'saved', 'medium', 'NYC', 1],
    ];

    for (const [company, role, stage, priority, location, daysAgo] of apps) {
      const appliedDate =
        stage === 'saved'
          ? null
          : new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);
      await client.query(
        `INSERT INTO applications
           (user_id, company, role, stage, priority, location, applied_date, resume_id, tags, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          user.id,
          company,
          role,
          stage,
          priority,
          location,
          appliedDate,
          resume.id,
          ['dream-company'],
          `Auto-seeded sample application for ${company}.`,
        ],
      );
    }

    // A couple of contacts
    await client.query(
      `INSERT INTO contacts (user_id, name, company, role, relationship, follow_up, follow_up_date, notes)
       VALUES
        ($1, 'Jordan Lee', 'Stripe', 'Engineering Manager', 'referral', true, CURRENT_DATE + 3, 'Met at a meetup, offered a referral.'),
        ($1, 'Sam Patel', 'Vercel', 'Recruiter', 'recruiter', false, NULL, 'Reached out on LinkedIn.')`,
      [user.id],
    );

    // A goal
    await client.query(
      `INSERT INTO goals (user_id, title, metric, target, period)
       VALUES ($1, 'Apply to 20 roles this month', 'applications', 20, 'month')`,
      [user.id],
    );
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    await pool.end();
    process.exit(1);
  });
