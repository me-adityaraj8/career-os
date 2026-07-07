import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Kanban, Sparkles, MessageSquare, BarChart3, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

const features = [
  { icon: Kanban, label: 'Kanban application tracker', desc: 'Drag-and-drop pipeline from saved to offer' },
  { icon: Sparkles, label: 'AI job analyzer & cover letters', desc: 'Extract skills, ATS keywords, and match score' },
  { icon: MessageSquare, label: 'Interview coach & networking CRM', desc: 'Prep questions, track contacts and follow-ups' },
  { icon: BarChart3, label: 'Career analytics dashboard', desc: 'Conversion funnel, response rates, weekly trends' },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto w-full max-w-sm"
        >
          <Logo className="mb-10" />
          {children}
        </motion.div>
      </div>

      {/* Marketing panel */}
      <div className="relative hidden overflow-hidden bg-foreground lg:block">
        {/* Gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute -left-20 -top-20 size-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 size-96 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 size-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--background)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="mb-2 text-sm font-medium tracking-wide text-blue-400">
              CAREER OS
            </p>
            <h2 className="max-w-md text-3xl font-bold leading-tight text-background xl:text-4xl">
              Your job search,
              <br />
              unified.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-background/60">
              Track applications, manage resumes, prep for interviews, and get AI-powered insights — all in one workspace.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 space-y-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-3 rounded-xl border border-background/10 bg-background/5 p-3.5 backdrop-blur-sm"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/10">
                  <f.icon className="size-4 text-background/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-background/90">{f.label}</p>
                  <p className="mt-0.5 text-xs text-background/50">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 flex items-center gap-2 text-xs text-background/40"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Free forever. No credit card required.</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
