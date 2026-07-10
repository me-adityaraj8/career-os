import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  Command,
  FileText,
  Flame,
  Kanban,
  Loader2,
  Moon,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/useAuth';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Shared motion presets                                                */
/* ------------------------------------------------------------------ */

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Demo login — one click from landing into the live product           */
/* ------------------------------------------------------------------ */

function useDemoLogin() {
  const navigate = useNavigate();
  const login = useLogin();
  async function start() {
    try {
      await login.mutateAsync({ email: 'demo@rys.app', password: 'password123' });
      navigate('/dashboard');
    } catch (err) {
      toast({ title: apiErrorMessage(err, 'Demo is warming up — try again in a moment'), variant: 'error' });
    }
  }
  return { start, pending: login.isPending };
}

/* ------------------------------------------------------------------ */
/* Animated product preview — a living kanban inside window chrome     */
/* ------------------------------------------------------------------ */

type PreviewCard = { id: string; company: string; role: string; heat: 'hot' | 'warm' | 'cool' };

const initialColumns: { title: string; count: number; cards: PreviewCard[] }[] = [
  {
    title: 'Applied',
    count: 5,
    cards: [
      { id: 'flipkart', company: 'Flipkart', role: 'SDE-2, Full-Stack', heat: 'hot' },
      { id: 'swiggy', company: 'Swiggy', role: 'Full-Stack Engineer', heat: 'warm' },
      { id: 'cred', company: 'CRED', role: 'Product Engineer', heat: 'warm' },
    ],
  },
  {
    title: 'Interview',
    count: 3,
    cards: [
      { id: 'razorpay', company: 'Razorpay', role: 'Backend Engineer', heat: 'hot' },
      { id: 'google', company: 'Google India', role: 'Software Engineer III', heat: 'hot' },
    ],
  },
  {
    title: 'Offer',
    count: 2,
    cards: [{ id: 'zerodha', company: 'Zerodha', role: 'Backend Engineer', heat: 'hot' }],
  },
];

const heatDot: Record<PreviewCard['heat'], string> = {
  hot: 'bg-success',
  warm: 'bg-warning',
  cool: 'bg-muted-foreground/50',
};

function ProductPreview() {
  const reduced = useReducedMotion();
  const [columns, setColumns] = useState(initialColumns);

  // Every few seconds, move the top card of a column forward — the board
  // feels alive without being distracting.
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      setColumns((cols) => {
        const from = cols.findIndex((c) => c.cards.length > 1);
        if (from === -1 || from === cols.length - 1) return initialColumns.map((c) => ({ ...c, cards: [...c.cards] }));
        const next = cols.map((c) => ({ ...c, cards: [...c.cards] }));
        const card = next[from].cards.shift()!;
        next[from + 1].cards.unshift(card);
        return next;
      });
    }, 2800);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div className="surface relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <div className="mx-auto flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1 text-[11px] text-muted-foreground">
          <Command className="size-3" />
          rys.app — Applications
        </div>
      </div>

      <div className="flex">
        {/* Mini sidebar */}
        <div className="hidden w-36 shrink-0 border-r p-3 sm:block">
          <div className="space-y-1">
            {['Dashboard', 'Applications', 'Resumes', 'Interviews', 'Network'].map((item, i) => (
              <div
                key={item}
                className={cn(
                  'rounded-md px-2 py-1.5 text-[11px]',
                  i === 1 ? 'bg-foreground font-medium text-background' : 'text-muted-foreground',
                )}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] text-muted-foreground">
            <Flame className="size-3 text-warning" /> 12-day streak
          </div>
        </div>

        {/* Kanban */}
        <div className="flex flex-1 gap-3 overflow-hidden p-4">
          {columns.map((col) => (
            <div key={col.title} className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.title}
                </span>
                <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {col.cards.length}
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {col.cards.map((card) => (
                    <motion.div
                      key={card.id}
                      layout
                      layoutId={card.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      className="rounded-lg border bg-background p-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn('size-1.5 rounded-full', heatDot[card.heat])} />
                        <span className="truncate text-[12px] font-semibold">{card.company}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{card.role}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating accents */}
      <div className="pointer-events-none absolute -right-2 bottom-6 hidden animate-float md:block">
        <div className="surface flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-[11px] shadow-lg">
          <Sparkles className="size-3.5 text-info" />
          <span className="font-medium">Match score: 94</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page sections                                                       */
/* ------------------------------------------------------------------ */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b shadow-sm' : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" aria-label="Rys home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const demo = useDemoLogin();
  return (
    <section className="relative px-5 pb-20 pt-32 sm:pt-40">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            variants={rise}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            Now in early access — free while in beta
          </motion.div>

          <motion.h1
            variants={rise}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            Your job search,
            <br />
            <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              finally under control.
            </span>
          </motion.h1>

          <motion.p
            variants={rise}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            Rys unifies your applications, resumes, interviews, and network into one
            fast, keyboard-first workspace — with AI that helps you land the offer.
          </motion.p>

          <motion.div
            variants={rise}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-11 px-6 text-[15px]">
              <Link to="/register">
                Start for free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-6 text-[15px]"
              onClick={demo.start}
              disabled={demo.pending}
            >
              {demo.pending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
              Explore the live demo
            </Button>
          </motion.div>

          <motion.p
            variants={rise}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            Free forever · No credit card · Demo needs zero signup
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          {/* Halo behind the preview */}
          <div
            aria-hidden
            className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[32px] bg-gradient-to-b from-foreground/[0.06] to-transparent blur-2xl"
          />
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const companies = ['Google India', 'Flipkart', 'Razorpay', 'CRED', 'Atlassian', 'Zerodha'];
  return (
    <section className="border-y bg-card/40 px-5 py-10">
      <Reveal className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built for candidates interviewing at
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {companies.map((c) => (
            <span key={c} className="text-lg font-semibold tracking-tight text-muted-foreground/60">
              {c}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

const stories = [
  {
    icon: Kanban,
    eyebrow: 'Pipeline',
    title: 'Every application, one board.',
    body: 'Drag applications from saved to offer on a Kanban board that feels like Linear. Priorities, tags, salary, resume version, and notes — every detail lives on the card, one click away.',
    points: ['Six-stage drag-and-drop pipeline', 'Opportunity score on every card', 'Instant search and smart filters'],
  },
  {
    icon: Sparkles,
    eyebrow: 'AI toolkit',
    title: 'An unfair advantage, built in.',
    body: 'Paste a job description and Rys extracts the skills that matter, scores your resume against it, drafts a tailored cover letter, and preps you with interview questions for that exact role.',
    points: ['ATS keyword & skill extraction', 'Resume match scoring', 'Cover letters & interview prep'],
  },
  {
    icon: BarChart3,
    eyebrow: 'Momentum',
    title: 'See what is actually working.',
    body: 'Conversion funnel, response rates, weekly trends — plus goals, streaks, and daily missions that keep you moving. A job search is a campaign; Rys is the war room.',
    points: ['Funnel & response-rate analytics', 'Weekly goals with live progress', 'Streaks and daily missions'],
  },
];

function FeatureStories() {
  return (
    <section id="features" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything the spreadsheet was never going to do.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Rys replaces the tab-graveyard of trackers, docs, and sticky notes with one
            deliberate workspace.
          </p>
        </Reveal>

        <div className="mt-16 space-y-6">
          {stories.map((story, i) => (
            <Reveal key={story.eyebrow} delay={i * 0.05}>
              <div className="spotlight surface grid gap-8 rounded-2xl border bg-card/70 p-8 backdrop-blur-sm md:grid-cols-2 md:p-12">
                <div className={cn('flex flex-col justify-center', i % 2 === 1 && 'md:order-2')}>
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl border bg-background">
                    <story.icon className="size-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {story.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{story.title}</h3>
                  <p className="mt-3 text-pretty text-muted-foreground">{story.body}</p>
                  <ul className="mt-5 space-y-2">
                    {story.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-sm">
                        <Check className="size-4 shrink-0 text-success" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn('flex items-center justify-center', i % 2 === 1 && 'md:order-1')}>
                  <StoryVisual index={i} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Lightweight, code-drawn visuals so each story has a picture without assets. */
function StoryVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="w-full max-w-sm space-y-2">
        {[
          { company: 'Razorpay', stage: 'Interview', width: 'w-[88%]' },
          { company: 'Google India', stage: 'Interview', width: 'w-full' },
          { company: 'Zerodha', stage: 'Offer', width: 'w-[92%]' },
        ].map((row) => (
          <div key={row.company} className={cn('surface rounded-xl border bg-background p-3.5', row.width)}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{row.company}</span>
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {row.stage}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-4/5 rounded-full bg-foreground/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="surface w-full max-w-sm rounded-xl border bg-background p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-info" /> Job analysis
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Resume match</span>
              <span className="font-semibold text-foreground">94%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-success"
                initial={{ width: 0 }}
                whileInView={{ width: '94%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['TypeScript', 'React', 'PostgreSQL', 'Node.js', 'AWS', 'GraphQL'].map((s) => (
              <span key={s} className="rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="surface w-full max-w-sm rounded-xl border bg-background p-5">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>Conversion funnel</span>
        <span className="text-xs font-medium text-success">↑ 38% interview rate</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {[
          { label: 'Applied', pct: 100 },
          { label: 'Response', pct: 62 },
          { label: 'Interview', pct: 38 },
          { label: 'Offer', pct: 12 },
        ].map((row, i) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-16 text-right text-[11px] text-muted-foreground">{row.label}</span>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
              <motion.div
                className="h-full rounded-md"
                style={{ background: `var(--viz-seq-${i + 1})` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${row.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const bento = [
  { icon: Command, title: 'Command center', body: 'Hit ⌘K anywhere. Jump between pages, add applications, and search everything without touching the mouse.' },
  { icon: Users, title: 'Recruiter CRM', body: 'Track every recruiter and referral with relationship context and follow-up flags, so no warm intro goes cold.' },
  { icon: Bell, title: 'Smart reminders', body: 'Rys watches your pipeline and nudges you when a follow-up is due or an interview is coming up.' },
  { icon: FileText, title: 'Resume versions', body: 'Keep every tailored resume in one place, tag them, and see exactly which version each application used.' },
  { icon: Target, title: 'Goals & streaks', body: 'Weekly targets with live progress, XP, and streaks that turn a grind into a game you can win.' },
  { icon: Moon, title: 'Fast & focused', body: 'Instant navigation, keyboard shortcuts, dark mode, and zero clutter. Built to disappear while you work.' },
];

function BentoGrid() {
  return (
    <section className="px-5 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bento.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.06}>
              <div className="spotlight surface h-full rounded-2xl border bg-card/70 p-6 backdrop-blur-sm">
                <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg border bg-background">
                  <item.icon className="size-[18px]" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote: 'I went from a chaotic spreadsheet with 40 rows to seeing my whole pipeline at a glance. Two offers in six weeks — Bengaluru fintech and a big-tech role.',
    name: 'Ananya S.',
    role: 'SDE-2 · accepted a fintech offer in Bengaluru',
  },
  {
    quote: 'The AI job analyzer told me exactly which ATS keywords my resume was missing. My response rate doubled in three weeks.',
    name: 'Rohit M.',
    role: 'Product Manager · 3 final rounds in one month',
  },
  {
    quote: 'The streaks sound silly until they work. I applied every single day for a month because I refused to break the chain.',
    name: 'Priya R.',
    role: 'New grad · landed a backend role in Hyderabad',
  },
];

function Testimonials() {
  return (
    <section className="border-y bg-card/40 px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            The job search is brutal. Your tools shouldn't be.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.07}>
              <figure className="surface flex h-full flex-col rounded-2xl border bg-card p-6">
                <blockquote className="flex-1 text-pretty text-[15px] leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t pt-4">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const demo = useDemoLogin();
  return (
    <section id="pricing" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Free while you need it most.
          </h2>
          <p className="mt-4 text-muted-foreground">
            You're job hunting — the last thing you need is another subscription. Everything is
            free during early access.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
          <Reveal>
            <div className="surface relative h-full rounded-2xl border-2 border-foreground bg-card p-7">
              <span className="absolute -top-3 left-6 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-background">
                Early access
              </span>
              <h3 className="text-lg font-bold">Free</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">$0</span>
                <span className="text-sm text-muted-foreground">/ forever</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  'Unlimited applications & boards',
                  'AI job analysis, cover letters & prep',
                  'Resume manager with versioning',
                  'Recruiter CRM & smart reminders',
                  'Analytics, goals, streaks & missions',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="size-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full">
                <Link to="/register">
                  Start for free <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.07}>
            <div className="surface h-full rounded-2xl border bg-card/60 p-7">
              <h3 className="text-lg font-bold">Pro</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">Soon</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                For power users, once we're out of beta.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                {[
                  'Everything in Free',
                  'Advanced AI models & longer context',
                  'Email & calendar integrations',
                  'Shared boards for coaches & cohorts',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="size-4 shrink-0 opacity-40" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-7 w-full" onClick={demo.start} disabled={demo.pending}>
                {demo.pending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                Try the demo meanwhile
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: 'Is Rys really free?',
    a: 'Yes. Everything is free during early access, and the core tracker will stay free forever. A Pro tier with integrations and advanced AI will arrive later — but we will never paywall your own data.',
  },
  {
    q: 'How does the AI work?',
    a: 'Rys uses Claude to analyze job descriptions, extract ATS keywords, score your resume against a role, draft cover letters, and generate interview prep questions. Your resume match score is computed deterministically, so it is consistent and explainable.',
  },
  {
    q: 'Can I try it without creating an account?',
    a: 'Yes — the live demo is one click, no signup. It is a read-only workspace pre-filled with a realistic pipeline so you can feel the product before committing.',
  },
  {
    q: 'What happens to my data?',
    a: 'Your data belongs to you. It is stored securely, never sold, and never used to train models. Delete your account and it is gone.',
  },
  {
    q: 'Does it work for any industry?',
    a: 'The pipeline, CRM, reminders, and analytics are industry-agnostic. The AI tooling shines brightest for roles with written job descriptions — tech, product, design, marketing, finance, and beyond.',
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t bg-card/40 px-5 py-24">
      <div className="mx-auto max-w-2xl">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.04}>
                <div className="surface overflow-hidden rounded-xl border bg-card">
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    {item.q}
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const demo = useDemoLogin();
  return (
    <section className="px-5 py-28">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Your next role is a system away.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Stop managing your job search in your head. Start running it like the
          campaign it is.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-[15px]">
            <Link to="/register">
              Start for free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-6 text-[15px]"
            onClick={demo.start}
            disabled={demo.pending}
          >
            {demo.pending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            Explore the live demo
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Logo />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          <Link to="/login" className="transition-colors hover:text-foreground">Log in</Link>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Rys. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <LogoStrip />
        <FeatureStories />
        <BentoGrid />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
