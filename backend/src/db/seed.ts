import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './pool';

const DEMO_EMAIL = 'demo@rys.app';
const DEMO_PASSWORD = 'password123';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

async function seed(): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM users WHERE lower(email) = lower($1)', [DEMO_EMAIL]);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const {
      rows: [user],
    } = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, dark_mode)
       VALUES ($1, $2, $3, true) RETURNING id`,
      [DEMO_EMAIL, passwordHash, 'Demo User'],
    );

    // ── Resumes ──
    const {
      rows: [resumeBackend],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'SWE — Backend Focus', 'resume_backend_2026.pdf', 'seed-backend.pdf', 'application/pdf', 124928,
               ARRAY['backend','swe','2026'], ARRAY['TypeScript','Node.js','PostgreSQL','Docker','REST APIs','Redis','Kafka','AWS'], true)
       RETURNING id`,
      [user.id],
    );
    const {
      rows: [resumeFullstack],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'Full-Stack Engineer', 'resume_fullstack.pdf', 'seed-fullstack.pdf', 'application/pdf', 98304,
               ARRAY['fullstack','react','2026'], ARRAY['React','TypeScript','Node.js','PostgreSQL','Tailwind','GraphQL','Docker'], false)
       RETURNING id`,
      [user.id],
    );
    const {
      rows: [resumeFrontend],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'Frontend Specialist', 'resume_frontend.pdf', 'seed-frontend.pdf', 'application/pdf', 87040,
               ARRAY['frontend','react','design-systems'], ARRAY['React','TypeScript','Tailwind','Framer Motion','Figma','Next.js','Storybook'], false)
       RETURNING id`,
      [user.id],
    );

    // ── Applications ──
    const apps: Array<{
      company: string;
      role: string;
      stage: string;
      priority: string;
      location: string;
      daysAgo: number;
      resumeId: string;
      tags: string[];
      notes: string;
      jobUrl?: string;
      salary?: string;
    }> = [
      { company: 'Stripe', role: 'Backend Engineer', stage: 'interview', priority: 'high', location: 'San Francisco, CA', daysAgo: 22, resumeId: resumeBackend.id, tags: ['dream-company', 'fintech'], notes: 'Passed recruiter screen and coding round. System design next week.', jobUrl: 'https://stripe.com/jobs/backend-engineer', salary: '$180k–$220k' },
      { company: 'Vercel', role: 'Full-Stack Engineer', stage: 'applied', priority: 'high', location: 'Remote', daysAgo: 14, resumeId: resumeFullstack.id, tags: ['dream-company', 'remote'], notes: 'Applied via referral from Sam. Strong Next.js experience should be a plus.', salary: '$160k–$200k' },
      { company: 'Linear', role: 'Product Engineer', stage: 'online_assessment', priority: 'high', location: 'Remote', daysAgo: 10, resumeId: resumeFullstack.id, tags: ['dream-company', 'startup'], notes: 'Take-home assignment due in 3 days. Build a mini project management tool.' },
      { company: 'Notion', role: 'Software Engineer', stage: 'applied', priority: 'medium', location: 'New York, NY', daysAgo: 8, resumeId: resumeBackend.id, tags: ['productivity'], notes: 'Applied through careers page. Team is working on real-time collaboration.' },
      { company: 'Anthropic', role: 'Software Engineer, API Platform', stage: 'interview', priority: 'high', location: 'San Francisco, CA', daysAgo: 18, resumeId: resumeBackend.id, tags: ['dream-company', 'ai'], notes: 'Phone screen went great. They loved the distributed systems experience. On-site scheduled.', salary: '$200k–$280k' },
      { company: 'Datadog', role: 'Platform Engineer', stage: 'rejected', priority: 'medium', location: 'New York, NY', daysAgo: 30, resumeId: resumeBackend.id, tags: ['observability'], notes: 'Rejected after final round. Feedback: needed more Kubernetes experience.' },
      { company: 'Figma', role: 'Frontend Engineer', stage: 'saved', priority: 'medium', location: 'San Francisco, CA', daysAgo: 3, resumeId: resumeFrontend.id, tags: ['design-tools'], notes: 'Interesting role in the design systems team. Need to tailor resume.' },
      { company: 'Ramp', role: 'Software Engineer', stage: 'saved', priority: 'medium', location: 'New York, NY', daysAgo: 1, resumeId: resumeBackend.id, tags: ['fintech', 'startup'], notes: 'Fast-growing fintech. Could be a good culture fit.' },
      { company: 'Cloudflare', role: 'Systems Engineer', stage: 'applied', priority: 'medium', location: 'Austin, TX', daysAgo: 6, resumeId: resumeBackend.id, tags: ['infrastructure'], notes: 'Working on Workers runtime. TypeScript + Rust stack.' },
      { company: 'GitHub', role: 'Staff Engineer, Actions', stage: 'interview', priority: 'high', location: 'Remote', daysAgo: 25, resumeId: resumeBackend.id, tags: ['dream-company', 'remote', 'dev-tools'], notes: 'Passed coding and system design. Behavioral round with VP Engineering next.', salary: '$190k–$250k' },
      { company: 'Netflix', role: 'Senior Software Engineer', stage: 'applied', priority: 'medium', location: 'Los Gatos, CA', daysAgo: 5, resumeId: resumeBackend.id, tags: ['big-tech'], notes: 'Applied to the studio infrastructure team. Unique culture model.' },
      { company: 'OpenAI', role: 'Backend Engineer, API', stage: 'offer', priority: 'high', location: 'San Francisco, CA', daysAgo: 35, resumeId: resumeBackend.id, tags: ['ai', 'dream-company'], notes: 'Offer received! $225k base + equity. Need to respond by end of week.', salary: '$225k + equity' },
      { company: 'Meta', role: 'Production Engineer', stage: 'rejected', priority: 'medium', location: 'Menlo Park, CA', daysAgo: 40, resumeId: resumeBackend.id, tags: ['big-tech'], notes: 'Made it to final round but rejected. Good practice for system design.' },
      { company: 'Airtable', role: 'Backend Engineer', stage: 'offer', priority: 'high', location: 'San Francisco, CA', daysAgo: 32, resumeId: resumeBackend.id, tags: ['productivity', 'startup'], notes: 'Offer: $195k + RSUs. Great team, but evaluating against other options.', salary: '$195k + RSUs' },
      { company: 'Supabase', role: 'Full-Stack Engineer', stage: 'applied', priority: 'medium', location: 'Remote', daysAgo: 4, resumeId: resumeFullstack.id, tags: ['open-source', 'remote', 'startup'], notes: 'Open-source Postgres platform. Would love to work on the dashboard.' },
      { company: 'Planetscale', role: 'Database Engineer', stage: 'saved', priority: 'low', location: 'Remote', daysAgo: 2, resumeId: resumeBackend.id, tags: ['databases', 'remote'], notes: 'Interesting MySQL-compatible serverless DB. Low priority for now.' },
    ];

    const appIds: Record<string, string> = {};
    for (const app of apps) {
      const appliedDate = app.stage === 'saved' ? null : daysAgo(app.daysAgo);
      const {
        rows: [{ id }],
      } = await client.query<{ id: string }>(
        `INSERT INTO applications
           (user_id, company, role, stage, priority, location, applied_date, resume_id, tags, notes, job_url, salary)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
          user.id,
          app.company,
          app.role,
          app.stage,
          app.priority,
          app.location,
          appliedDate,
          app.resumeId,
          app.tags,
          app.notes,
          app.jobUrl ?? null,
          app.salary ?? null,
        ],
      );
      appIds[app.company] = id;
    }

    // ── Interview Rounds ──
    const interviews: Array<{
      company: string;
      type: string;
      scheduledAt: string | null;
      outcome: string;
      notes: string;
    }> = [
      { company: 'Stripe', type: 'phone_screen', scheduledAt: daysFromNow(-18), outcome: 'passed', notes: 'Discussed past projects and system design approach. Interviewer was impressed with event sourcing experience.' },
      { company: 'Stripe', type: 'coding', scheduledAt: daysFromNow(-12), outcome: 'passed', notes: 'Two coding problems: graph traversal and rate limiter. Solved both optimally.' },
      { company: 'Stripe', type: 'system_design', scheduledAt: daysFromNow(3), outcome: 'pending', notes: 'Design a payment processing pipeline. Need to review CAP theorem and eventual consistency.' },
      { company: 'Anthropic', type: 'phone_screen', scheduledAt: daysFromNow(-14), outcome: 'passed', notes: 'Great conversation about distributed systems. They asked about my experience with message queues.' },
      { company: 'Anthropic', type: 'coding', scheduledAt: daysFromNow(-8), outcome: 'passed', notes: 'API design problem + algorithm. Used TypeScript. Clean solution with good error handling.' },
      { company: 'Anthropic', type: 'system_design', scheduledAt: daysFromNow(5), outcome: 'pending', notes: 'Design a scalable API gateway. Review load balancing strategies.' },
      { company: 'GitHub', type: 'phone_screen', scheduledAt: daysFromNow(-20), outcome: 'passed', notes: 'Discussed GitHub Actions architecture and CI/CD pipelines.' },
      { company: 'GitHub', type: 'coding', scheduledAt: daysFromNow(-15), outcome: 'passed', notes: 'Built a workflow orchestration system. Used DAG for task dependencies.' },
      { company: 'GitHub', type: 'system_design', scheduledAt: daysFromNow(-10), outcome: 'passed', notes: 'Designed a distributed job runner. Great discussion about fault tolerance.' },
      { company: 'GitHub', type: 'behavioral', scheduledAt: daysFromNow(2), outcome: 'pending', notes: 'Final round with VP Engineering. Prepare STAR stories about leadership and conflict resolution.' },
      { company: 'OpenAI', type: 'phone_screen', scheduledAt: daysFromNow(-30), outcome: 'passed', notes: 'Quick intro call. Team is scaling the API platform.' },
      { company: 'OpenAI', type: 'coding', scheduledAt: daysFromNow(-25), outcome: 'passed', notes: 'Implemented a token bucket rate limiter and a streaming response handler.' },
      { company: 'OpenAI', type: 'system_design', scheduledAt: daysFromNow(-20), outcome: 'passed', notes: 'Designed a model serving infrastructure. Discussed batching and queuing strategies.' },
      { company: 'OpenAI', type: 'behavioral', scheduledAt: daysFromNow(-15), outcome: 'passed', notes: 'Culture fit interview. Discussed AI safety and responsible deployment.' },
      { company: 'Airtable', type: 'phone_screen', scheduledAt: daysFromNow(-28), outcome: 'passed', notes: 'Introductory call with hiring manager.' },
      { company: 'Airtable', type: 'coding', scheduledAt: daysFromNow(-22), outcome: 'passed', notes: 'Built a simplified spreadsheet formula parser.' },
      { company: 'Datadog', type: 'phone_screen', scheduledAt: daysFromNow(-26), outcome: 'passed', notes: 'Discussed observability and monitoring systems.' },
      { company: 'Datadog', type: 'coding', scheduledAt: daysFromNow(-20), outcome: 'passed', notes: 'Time series data aggregation problem. Clean solution.' },
      { company: 'Datadog', type: 'system_design', scheduledAt: daysFromNow(-14), outcome: 'failed', notes: 'Designed a metrics ingestion pipeline. Struggled with Kubernetes-specific questions.' },
      { company: 'Meta', type: 'phone_screen', scheduledAt: daysFromNow(-35), outcome: 'passed', notes: 'Standard Meta screen. Two coding problems.' },
      { company: 'Meta', type: 'coding', scheduledAt: daysFromNow(-28), outcome: 'passed', notes: 'Dynamic programming and graph problems. Passed both.' },
      { company: 'Meta', type: 'system_design', scheduledAt: daysFromNow(-22), outcome: 'failed', notes: 'Design Facebook Messenger. Got stuck on the presence system.' },
    ];

    for (const iv of interviews) {
      const appId = appIds[iv.company];
      if (!appId) continue;
      await client.query(
        `INSERT INTO interview_rounds (user_id, application_id, type, scheduled_at, outcome, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, appId, iv.type, iv.scheduledAt, iv.outcome, iv.notes],
      );
    }

    // ── Contacts ──
    const contacts: Array<{
      name: string;
      company: string;
      role: string;
      relationship: string;
      email: string | null;
      followUp: boolean;
      followUpDate: string | null;
      notes: string;
      lastContactDate: string | null;
    }> = [
      { name: 'Jordan Lee', company: 'Stripe', role: 'Engineering Manager', relationship: 'referral', email: 'jordan@stripe.com', followUp: true, followUpDate: daysAgo(-3), notes: 'Met at a Systems Design meetup in SF. Offered to refer me. Check in after the system design round.', lastContactDate: daysAgo(5) },
      { name: 'Sam Patel', company: 'Vercel', role: 'Senior Recruiter', relationship: 'recruiter', email: 'sam.p@vercel.com', followUp: false, followUpDate: null, notes: 'Reached out on LinkedIn. Very responsive. Submitted my application through the internal referral link.', lastContactDate: daysAgo(14) },
      { name: 'Maria Chen', company: 'Anthropic', role: 'Staff Engineer', relationship: 'alumni', email: 'maria.c@anthropic.com', followUp: true, followUpDate: daysAgo(-5), notes: 'College alumni (CS 2018). Works on the API platform team. Gave insider tips about the interview process.', lastContactDate: daysAgo(10) },
      { name: 'Alex Rivera', company: 'GitHub', role: 'Director of Engineering', relationship: 'mentor', email: null, followUp: false, followUpDate: null, notes: 'Former manager at my last job. Now leads the Actions team at GitHub. Instrumental in getting me the interview.', lastContactDate: daysAgo(20) },
      { name: 'Priya Sharma', company: 'Linear', role: 'Founding Engineer', relationship: 'referral', email: 'priya@linear.app', followUp: true, followUpDate: daysAgo(-2), notes: 'Met at ReactConf 2025. Very passionate about the product. Can share insights about the take-home.', lastContactDate: daysAgo(8) },
      { name: 'David Kim', company: 'OpenAI', role: 'Technical Recruiter', relationship: 'recruiter', email: 'david.kim@openai.com', followUp: true, followUpDate: daysAgo(-1), notes: 'Handling my offer negotiation. Very helpful. Need to discuss equity package details.', lastContactDate: daysAgo(2) },
      { name: 'Sarah Thompson', company: 'Netflix', role: 'Senior Engineer', relationship: 'colleague', email: null, followUp: false, followUpDate: null, notes: 'Former colleague from previous job. Now at Netflix. Offered to do a mock system design interview.', lastContactDate: daysAgo(30) },
      { name: 'Chris Wu', company: 'Cloudflare', role: 'Recruiter', relationship: 'recruiter', email: 'cwu@cloudflare.com', followUp: false, followUpDate: null, notes: 'Reached out after seeing my open-source contributions. Seems like a good fit.', lastContactDate: daysAgo(6) },
    ];

    for (const c of contacts) {
      await client.query(
        `INSERT INTO contacts (user_id, name, company, role, relationship, email, follow_up, follow_up_date, notes, last_contact_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [user.id, c.name, c.company, c.role, c.relationship, c.email, c.followUp, c.followUpDate, c.notes, c.lastContactDate],
      );
    }

    // ── Goals ──
    await client.query(
      `INSERT INTO goals (user_id, title, metric, target, period) VALUES
        ($1, 'Apply to 20 roles this month', 'applications', 20, 'month'),
        ($1, '5 interviews this month', 'interviews', 5, 'month'),
        ($1, 'Land 2 offers', 'offers', 2, 'all_time'),
        ($1, '10 applications this week', 'applications', 10, 'week')`,
      [user.id],
    );

    // ── AI: Job Analyses ──
    const stripeJD = 'We are looking for a Backend Engineer to join our Payments Infrastructure team. You will design, build, and operate the systems that process billions of dollars in payments. Requirements: 3+ years with TypeScript/Node.js, PostgreSQL, Redis, distributed systems, event-driven architectures. Nice to have: Kafka, AWS, payment processing experience.';
    const anthropicJD = 'Software Engineer, API Platform — Build infrastructure for serving large language models at scale. Focus on low-latency serving, rate limiting, and developer experience. Requirements: Python or TypeScript, distributed systems, Docker, Kubernetes, load balancing.';
    const githubJD = 'Staff Engineer, Actions — Lead the next generation of CI/CD workflows. Design and implement distributed job runners, manage a team, drive technical strategy. Requirements: TypeScript, Node.js, Docker, Kubernetes, CI/CD, distributed systems.';

    await client.query(
      `INSERT INTO job_analyses (user_id, application_id, job_description, summary, required_skills, ats_keywords, match_score, model, is_mock) VALUES
        ($1, $2, $5, 'Stripe is looking for a backend engineer to build and scale payment infrastructure. The role requires deep expertise in distributed systems, API design, and financial technology. Strong emphasis on reliability and performance at scale.', ARRAY['TypeScript','Node.js','PostgreSQL','Redis','Kafka','AWS','Distributed Systems','API Design'], ARRAY['payment processing','microservices','event-driven','high availability','idempotency','PCI compliance','REST API','gRPC'], 82, 'mock', true),
        ($1, $3, $6, 'Anthropic seeks a software engineer for their API platform team. The role involves building infrastructure for serving large language models at scale, with focus on low-latency serving, rate limiting, and developer experience.', ARRAY['Python','TypeScript','Distributed Systems','API Design','Docker','Kubernetes','Load Balancing'], ARRAY['LLM serving','API gateway','rate limiting','streaming','token management','model serving','inference optimization'], 75, 'mock', true),
        ($1, $4, $7, 'GitHub is hiring a Staff Engineer to lead the Actions platform. The role involves designing and implementing the next generation of CI/CD workflows, managing a team of engineers, and driving technical strategy.', ARRAY['TypeScript','Node.js','Docker','Kubernetes','CI/CD','Distributed Systems','Technical Leadership'], ARRAY['workflow orchestration','job runner','containerization','DAG','fault tolerance','developer tools','platform engineering'], 88, 'mock', true)`,
      [user.id, appIds['Stripe'], appIds['Anthropic'], appIds['GitHub'], stripeJD, anthropicJD, githubJD],
    );

    // ── AI: Cover Letters ──
    await client.query(
      `INSERT INTO cover_letters (user_id, application_id, content, model, is_mock) VALUES
        ($1, $2, $3, 'mock', true)`,
      [
        user.id,
        appIds['Stripe'],
        `Dear Hiring Team at Stripe,

I am writing to express my strong interest in the Backend Engineer position. With over 4 years of experience building high-throughput distributed systems and a deep passion for financial infrastructure, I believe I would be an excellent addition to your engineering team.

In my current role, I architected and deployed a real-time event processing pipeline handling 50,000+ events per second with sub-100ms latency. This system uses event sourcing patterns similar to those employed in payment processing, ensuring data consistency and auditability — core requirements in fintech.

Key highlights of my experience:
• Built and maintained RESTful APIs serving 10M+ daily requests with 99.99% uptime
• Designed idempotent payment workflows that prevented duplicate charges across distributed services
• Led the migration from a monolithic architecture to microservices, reducing deployment time by 80%
• Deep expertise in TypeScript, Node.js, PostgreSQL, Redis, and Kafka

What excites me most about Stripe is your commitment to increasing the GDP of the internet. I've been a Stripe user and advocate for years, and the opportunity to contribute to the platform that powers millions of businesses would be incredibly meaningful.

I look forward to discussing how my experience aligns with your team's goals.

Best regards,
Demo User`,
      ],
    );

    // ── AI: Interview Questions ──
    await client.query(
      `INSERT INTO interview_questions (user_id, application_id, company, role, questions, model, is_mock) VALUES
        ($1, $2, 'Stripe', 'Backend Engineer', $3, 'mock', true)`,
      [
        user.id,
        appIds['Stripe'],
        JSON.stringify([
          { category: 'technical', question: 'Design a payment processing system that handles idempotency across distributed services. How would you ensure exactly-once processing?' },
          { category: 'technical', question: 'How would you implement a rate limiter for an API that needs to handle both per-user and global rate limits?' },
          { category: 'technical', question: 'Explain the trade-offs between synchronous and asynchronous payment processing. When would you choose each?' },
          { category: 'behavioral', question: 'Tell me about a time you had to make a critical decision under time pressure in production.' },
          { category: 'behavioral', question: 'Describe a situation where you disagreed with your team on a technical approach. How did you resolve it?' },
          { category: 'behavioral', question: 'How do you prioritize between shipping new features and addressing technical debt?' },
          { category: 'company', question: 'What aspects of Stripe\'s developer experience do you think could be improved?' },
          { category: 'company', question: 'How would you approach building a new payment method integration from scratch?' },
          { category: 'company', question: 'Stripe processes billions in payments. How would you approach testing changes to critical payment flows?' },
        ]),
      ],
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
