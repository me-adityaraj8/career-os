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
      [DEMO_EMAIL, passwordHash, 'Aarav Sharma'],
    );

    // ── Resumes ──
    const {
      rows: [resumeBackend],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'SDE — Backend Focus', 'aarav_sharma_backend_2026.pdf', 'seed-backend.pdf', 'application/pdf', 124928,
               ARRAY['backend','sde','2026'], ARRAY['Java','Spring Boot','TypeScript','Node.js','PostgreSQL','Redis','Kafka','AWS'], true)
       RETURNING id`,
      [user.id],
    );
    const {
      rows: [resumeFullstack],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'Full-Stack Engineer', 'aarav_sharma_fullstack.pdf', 'seed-fullstack.pdf', 'application/pdf', 98304,
               ARRAY['fullstack','react','2026'], ARRAY['React','TypeScript','Node.js','PostgreSQL','Tailwind','GraphQL','Docker'], false)
       RETURNING id`,
      [user.id],
    );
    const {
      rows: [resumeFrontend],
    } = await client.query<{ id: string }>(
      `INSERT INTO resumes (user_id, label, original_name, storage_name, mime_type, size_bytes, tags, skills, is_default)
       VALUES ($1, 'Frontend Specialist', 'aarav_sharma_frontend.pdf', 'seed-frontend.pdf', 'application/pdf', 87040,
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
      { company: 'Razorpay', role: 'Backend Engineer — Payments', stage: 'interview', priority: 'high', location: 'Bengaluru', daysAgo: 22, resumeId: resumeBackend.id, tags: ['dream-company', 'fintech'], notes: 'Cleared recruiter screen and DSA round. System design round next week — revise UPI flow and idempotency patterns.', jobUrl: 'https://razorpay.com/jobs/backend-engineer', salary: '₹28–35 LPA' },
      { company: 'Flipkart', role: 'SDE-2, Full-Stack', stage: 'applied', priority: 'high', location: 'Bengaluru', daysAgo: 14, resumeId: resumeFullstack.id, tags: ['e-commerce', 'big-tech'], notes: 'Applied via referral from Rohan. Supply-chain platform team — strong React + Node fit.', salary: '₹26–32 LPA' },
      { company: 'CRED', role: 'Product Engineer', stage: 'online_assessment', priority: 'high', location: 'Bengaluru', daysAgo: 10, resumeId: resumeFullstack.id, tags: ['dream-company', 'fintech', 'startup'], notes: 'Take-home due in 3 days — build a mini rewards ledger with clean UI. They care a lot about polish.' },
      { company: 'Freshworks', role: 'Software Engineer', stage: 'applied', priority: 'medium', location: 'Chennai', daysAgo: 8, resumeId: resumeBackend.id, tags: ['saas', 'product-based'], notes: 'Applied through careers page. CRM platform team, hybrid from Chennai OMR office.' },
      { company: 'Google India', role: 'Software Engineer III', stage: 'interview', priority: 'high', location: 'Hyderabad', daysAgo: 18, resumeId: resumeBackend.id, tags: ['dream-company', 'big-tech'], notes: 'Phone screen went great — interviewer liked the distributed systems depth. Onsite loop scheduled.', salary: '₹45–60 LPA' },
      { company: 'InMobi', role: 'Platform Engineer', stage: 'rejected', priority: 'medium', location: 'Bengaluru', daysAgo: 30, resumeId: resumeBackend.id, tags: ['ad-tech'], notes: 'Rejected after final round. Feedback: needed more hands-on Kubernetes at scale.' },
      { company: 'Postman', role: 'Frontend Engineer', stage: 'saved', priority: 'medium', location: 'Bengaluru', daysAgo: 3, resumeId: resumeFrontend.id, tags: ['dev-tools', 'product-based'], notes: 'Design systems team. Need to tailor resume toward component architecture and DX.' },
      { company: 'Groww', role: 'Software Engineer', stage: 'saved', priority: 'medium', location: 'Bengaluru', daysAgo: 1, resumeId: resumeBackend.id, tags: ['fintech', 'startup'], notes: 'Fast-growing broking platform. Backend team works heavily with order-management systems.' },
      { company: 'PhonePe', role: 'Backend Engineer — UPI', stage: 'applied', priority: 'medium', location: 'Pune', daysAgo: 6, resumeId: resumeBackend.id, tags: ['fintech', 'upi'], notes: 'UPI switch team — massive scale, Java + Kafka stack. Applied via careers portal.' },
      { company: 'Atlassian', role: 'Senior Software Engineer', stage: 'interview', priority: 'high', location: 'Bengaluru (Remote)', daysAgo: 25, resumeId: resumeBackend.id, tags: ['dream-company', 'remote', 'dev-tools'], notes: 'Cleared craft + system design rounds. Values/behavioral round with the EM next.', salary: '₹50–70 LPA' },
      { company: 'Amazon India', role: 'SDE-2', stage: 'applied', priority: 'medium', location: 'Hyderabad', daysAgo: 5, resumeId: resumeBackend.id, tags: ['big-tech'], notes: 'Applied to the payments org (Amazon Pay). Prepare LPs — Ownership and Dive Deep stories.' },
      { company: 'Zerodha', role: 'Backend Engineer', stage: 'offer', priority: 'high', location: 'Bengaluru', daysAgo: 35, resumeId: resumeBackend.id, tags: ['fintech', 'dream-company'], notes: 'Offer received! ₹32 LPA flat, small team, Go + Python stack. Respond by end of week.', salary: '₹32 LPA' },
      { company: 'Paytm', role: 'Backend Engineer', stage: 'rejected', priority: 'medium', location: 'Noida', daysAgo: 40, resumeId: resumeBackend.id, tags: ['fintech'], notes: 'Made it to the final round but rejected. Good system design practice either way.' },
      { company: 'Juspay', role: 'Backend Engineer', stage: 'offer', priority: 'high', location: 'Bengaluru', daysAgo: 32, resumeId: resumeBackend.id, tags: ['fintech', 'startup'], notes: 'Offer: ₹30 LPA + ESOPs. Payments orchestration at serious scale — evaluating against Zerodha.', salary: '₹30 LPA + ESOPs' },
      { company: 'Swiggy', role: 'Full-Stack Engineer', stage: 'applied', priority: 'medium', location: 'Bengaluru', daysAgo: 4, resumeId: resumeFullstack.id, tags: ['consumer', 'startup'], notes: 'Instamart storefront team. React + Node, strong growth trajectory.' },
      { company: 'BrowserStack', role: 'Platform Engineer', stage: 'saved', priority: 'low', location: 'Mumbai', daysAgo: 2, resumeId: resumeBackend.id, tags: ['dev-tools', 'saas'], notes: 'Device-cloud infrastructure. Interesting problem space; low priority for now.' },
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
      { company: 'Razorpay', type: 'phone_screen', scheduledAt: daysFromNow(-18), outcome: 'passed', notes: 'Walked through past projects and payment-gateway architecture. Interviewer liked the event-sourcing experience.' },
      { company: 'Razorpay', type: 'coding', scheduledAt: daysFromNow(-12), outcome: 'passed', notes: 'Two problems: graph traversal and a sliding-window rate limiter. Solved both optimally in Java.' },
      { company: 'Razorpay', type: 'system_design', scheduledAt: daysFromNow(3), outcome: 'pending', notes: 'Design a UPI payment pipeline. Revise idempotency keys, retries, and reconciliation flows.' },
      { company: 'Google India', type: 'phone_screen', scheduledAt: daysFromNow(-14), outcome: 'passed', notes: 'Standard Google screen — one medium-hard DSA problem on intervals. Clean O(n log n) solution.' },
      { company: 'Google India', type: 'coding', scheduledAt: daysFromNow(-8), outcome: 'passed', notes: 'Two coding rounds back-to-back: trie-based autocomplete and a scheduling problem. Communicated well.' },
      { company: 'Google India', type: 'system_design', scheduledAt: daysFromNow(5), outcome: 'pending', notes: 'Googleyness + design round. Review load balancing, sharding, and quota systems.' },
      { company: 'Atlassian', type: 'phone_screen', scheduledAt: daysFromNow(-20), outcome: 'passed', notes: 'Karat screen — data structures plus a short design discussion on Jira-scale webhooks.' },
      { company: 'Atlassian', type: 'coding', scheduledAt: daysFromNow(-15), outcome: 'passed', notes: 'Craft round: built a task-dependency resolver with cycle detection (DAG).' },
      { company: 'Atlassian', type: 'system_design', scheduledAt: daysFromNow(-10), outcome: 'passed', notes: 'Designed a distributed job runner for CI. Strong discussion on fault tolerance and retries.' },
      { company: 'Atlassian', type: 'behavioral', scheduledAt: daysFromNow(2), outcome: 'pending', notes: 'Values round with the EM. Prepare STAR stories — mentoring juniors and disagreeing respectfully.' },
      { company: 'Zerodha', type: 'phone_screen', scheduledAt: daysFromNow(-30), outcome: 'passed', notes: 'Intro call with the tech lead. Small team, deep ownership, Go/Python/Postgres stack.' },
      { company: 'Zerodha', type: 'coding', scheduledAt: daysFromNow(-25), outcome: 'passed', notes: 'Built a token-bucket rate limiter and a streaming order-book diff handler.' },
      { company: 'Zerodha', type: 'system_design', scheduledAt: daysFromNow(-20), outcome: 'passed', notes: 'Designed an order-management system for market-hours burst traffic. Discussed queuing and backpressure.' },
      { company: 'Zerodha', type: 'behavioral', scheduledAt: daysFromNow(-15), outcome: 'passed', notes: 'Culture chat with founders’ office. They value calm, self-directed engineers.' },
      { company: 'Juspay', type: 'phone_screen', scheduledAt: daysFromNow(-28), outcome: 'passed', notes: 'Intro call with hiring manager. Payments orchestration layer, Haskell + functional core.' },
      { company: 'Juspay', type: 'coding', scheduledAt: daysFromNow(-22), outcome: 'passed', notes: 'Built a simplified transaction-routing engine with pluggable gateway adapters.' },
      { company: 'InMobi', type: 'phone_screen', scheduledAt: daysFromNow(-26), outcome: 'passed', notes: 'Discussed ad-serving infrastructure and real-time bidding latency budgets.' },
      { company: 'InMobi', type: 'coding', scheduledAt: daysFromNow(-20), outcome: 'passed', notes: 'Time-series aggregation problem over campaign metrics. Clean solution.' },
      { company: 'InMobi', type: 'system_design', scheduledAt: daysFromNow(-14), outcome: 'failed', notes: 'Designed a metrics ingestion pipeline. Struggled on Kubernetes autoscaling specifics.' },
      { company: 'Paytm', type: 'phone_screen', scheduledAt: daysFromNow(-35), outcome: 'passed', notes: 'Standard screen — arrays and strings, plus a short wallet-ledger discussion.' },
      { company: 'Paytm', type: 'coding', scheduledAt: daysFromNow(-28), outcome: 'passed', notes: 'DP + graph problems. Passed both comfortably.' },
      { company: 'Paytm', type: 'system_design', scheduledAt: daysFromNow(-22), outcome: 'failed', notes: 'Design a wallet with concurrent debits. Got stuck on the double-spend prevention deep dive.' },
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
      { name: 'Ananya Iyer', company: 'Razorpay', role: 'Engineering Manager', relationship: 'referral', email: 'ananya.iyer@razorpay.com', followUp: true, followUpDate: daysAgo(-3), notes: 'Met at a fintech meetup in Koramangala. Offered to refer me. Check in after the system design round.', lastContactDate: daysAgo(5) },
      { name: 'Rohan Mehta', company: 'Flipkart', role: 'Senior Technical Recruiter', relationship: 'recruiter', email: 'rohan.m@flipkart.com', followUp: false, followUpDate: null, notes: 'Reached out on LinkedIn. Very responsive — pushed my profile through the internal referral track.', lastContactDate: daysAgo(14) },
      { name: 'Kavya Nair', company: 'Google India', role: 'Senior Software Engineer', relationship: 'alumni', email: 'kavya.nair@google.com', followUp: true, followUpDate: daysAgo(-5), notes: 'College senior (NIT Trichy, CSE 2019). On the Hyderabad Cloud team — shared great onsite prep tips.', lastContactDate: daysAgo(10) },
      { name: 'Arjun Malhotra', company: 'Atlassian', role: 'Engineering Manager', relationship: 'mentor', email: null, followUp: false, followUpDate: null, notes: 'Former manager at my last company. Now leads a platform team at Atlassian Bengaluru — got me the interview.', lastContactDate: daysAgo(20) },
      { name: 'Sneha Kulkarni', company: 'CRED', role: 'Founding Engineer', relationship: 'referral', email: 'sneha@cred.club', followUp: true, followUpDate: daysAgo(-2), notes: 'Met at React India, Goa. Very passionate about craft — can share pointers on the take-home rubric.', lastContactDate: daysAgo(8) },
      { name: 'Vikram Singh', company: 'Zerodha', role: 'Tech Lead', relationship: 'recruiter', email: 'vikram@zerodha.com', followUp: true, followUpDate: daysAgo(-1), notes: 'Handling my offer discussion. Need to close the compensation + joining date conversation this week.', lastContactDate: daysAgo(2) },
      { name: 'Deepika Reddy', company: 'Swiggy', role: 'Senior Engineer', relationship: 'colleague', email: null, followUp: false, followUpDate: null, notes: 'Former teammate, now on Instamart. Offered to run a mock system design round over the weekend.', lastContactDate: daysAgo(30) },
      { name: 'Aditya Verma', company: 'PhonePe', role: 'Talent Acquisition', relationship: 'recruiter', email: 'aditya.verma@phonepe.com', followUp: false, followUpDate: null, notes: 'Reached out after seeing my open-source work. UPI switch team is hiring aggressively in Pune.', lastContactDate: daysAgo(6) },
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
    const razorpayJD = 'We are looking for a Backend Engineer to join our Payments Infrastructure team in Bengaluru. You will design, build, and operate systems that process millions of UPI, card, and netbanking transactions daily. Requirements: 3+ years with Java/Spring Boot or Node.js, PostgreSQL, Redis, distributed systems, event-driven architectures. Nice to have: Kafka, AWS, payment gateway or UPI switch experience.';
    const googleJD = 'Software Engineer III, Google Cloud (Hyderabad) — Build planet-scale infrastructure for Google Cloud services. Focus on low-latency serving, reliability, and developer experience. Requirements: strong CS fundamentals, one of C++/Java/Go/Python, distributed systems, testing discipline. Nice to have: Kubernetes, gRPC, SRE exposure.';
    const atlassianJD = 'Senior Software Engineer, Bengaluru (Remote-friendly) — Lead the next generation of CI/CD and developer-experience tooling for Jira and Bitbucket. Design distributed job runners, mentor engineers, drive technical strategy. Requirements: TypeScript or Java, Docker, Kubernetes, CI/CD, distributed systems.';

    await client.query(
      `INSERT INTO job_analyses (user_id, application_id, job_description, summary, required_skills, ats_keywords, match_score, model, is_mock) VALUES
        ($1, $2, $5, 'Razorpay is hiring a backend engineer to build and scale payment infrastructure handling millions of daily UPI and card transactions. The role demands deep expertise in distributed systems, API design, and fintech-grade reliability.', ARRAY['Java','Spring Boot','Node.js','PostgreSQL','Redis','Kafka','AWS','Distributed Systems'], ARRAY['UPI','payment gateway','microservices','event-driven','high availability','idempotency','PCI DSS','reconciliation'], 84, 'mock', true),
        ($1, $3, $6, 'Google Cloud Hyderabad seeks an SWE III for planet-scale infrastructure. The role emphasizes strong CS fundamentals, low-latency serving, reliability engineering, and crisp code health practices.', ARRAY['Java','Go','C++','Distributed Systems','Testing','gRPC','Kubernetes'], ARRAY['planet-scale','SRE','load balancing','sharding','quota systems','borg','monitoring','code health'], 76, 'mock', true),
        ($1, $4, $7, 'Atlassian is hiring a Senior Engineer in Bengaluru to lead CI/CD and developer-experience tooling across Jira and Bitbucket. The role blends distributed-systems design with mentorship and technical strategy.', ARRAY['TypeScript','Java','Docker','Kubernetes','CI/CD','Distributed Systems','Technical Leadership'], ARRAY['workflow orchestration','job runner','containerization','DAG','fault tolerance','developer tools','platform engineering'], 88, 'mock', true)`,
      [user.id, appIds['Razorpay'], appIds['Google India'], appIds['Atlassian'], razorpayJD, googleJD, atlassianJD],
    );

    // ── AI: Cover Letters ──
    await client.query(
      `INSERT INTO cover_letters (user_id, application_id, content, model, is_mock) VALUES
        ($1, $2, $3, 'mock', true)`,
      [
        user.id,
        appIds['Razorpay'],
        `Dear Hiring Team at Razorpay,

I am writing to express my strong interest in the Backend Engineer position on the Payments Infrastructure team. With over 4 years of experience building high-throughput distributed systems and a genuine passion for India's digital payments ecosystem, I believe I would be a strong addition to your engineering team.

In my current role, I architected and deployed a real-time event processing pipeline handling 50,000+ events per second with sub-100ms latency. The system uses event-sourcing patterns similar to those in payment processing, ensuring consistency and auditability — non-negotiables in fintech.

Key highlights of my experience:
• Built and maintained REST APIs serving 10M+ daily requests at 99.99% uptime
• Designed idempotent payment workflows that prevented duplicate debits across distributed services
• Led a monolith-to-microservices migration that cut deployment time by 80%
• Deep expertise in Java, Spring Boot, TypeScript, PostgreSQL, Redis, and Kafka

What excites me most about Razorpay is the scale and reliability bar of powering payments for millions of Indian businesses — from kirana stores to unicorns. I have been a Razorpay user and admirer for years, and contributing to that rails-level infrastructure would be incredibly meaningful.

I look forward to discussing how my experience aligns with your team's goals.

Best regards,
Aarav Sharma`,
      ],
    );

    // ── AI: Interview Questions ──
    await client.query(
      `INSERT INTO interview_questions (user_id, application_id, company, role, questions, model, is_mock) VALUES
        ($1, $2, 'Razorpay', 'Backend Engineer — Payments', $3, 'mock', true)`,
      [
        user.id,
        appIds['Razorpay'],
        JSON.stringify([
          { category: 'technical', question: 'Design a UPI payment flow that guarantees idempotency across retries from the PSP, bank, and merchant sides. How do you prevent double debits?' },
          { category: 'technical', question: 'How would you implement a rate limiter that enforces both per-merchant and global limits on a payment API?' },
          { category: 'technical', question: 'Explain the trade-offs between synchronous and asynchronous payment capture. When would you choose each?' },
          { category: 'behavioral', question: 'Tell me about a time you had to make a critical decision during a production incident under time pressure.' },
          { category: 'behavioral', question: 'Describe a situation where you disagreed with your team on a technical approach. How did you resolve it?' },
          { category: 'behavioral', question: 'How do you balance shipping features against paying down technical debt?' },
          { category: 'company', question: 'What parts of Razorpay\'s developer experience (docs, SDKs, dashboard) would you improve, and how?' },
          { category: 'company', question: 'How would you approach building a new payment-method integration (e.g., a new UPI app or BNPL provider) from scratch?' },
          { category: 'company', question: 'Razorpay processes millions of transactions daily. How would you test changes to a critical payment path safely?' },
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
