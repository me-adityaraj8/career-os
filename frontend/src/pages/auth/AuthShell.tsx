import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Kanban, Sparkles, MessageSquare, BarChart3, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Starfield } from '@/components/Starfield';

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

      {/* Marketing panel — deep-space monochrome */}
      <div className="relative hidden overflow-hidden bg-[#050506] lg:block">
        {/* Starfield */}
        <div className="absolute inset-0">
          <Starfield mode="dark" density={1.2} />
        </div>

        {/* Soft monochrome glows — a distant light source, not color */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/[0.16] blur-3xl" />
          <div className="absolute -bottom-32 -right-24 size-96 rounded-full bg-violet-500/[0.12] blur-3xl" />
          <div className="absolute left-1/4 top-1/2 size-72 rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        {/* Horizon line — thin gradient rule, Interstellar-style */}
        <div className="absolute left-1/2 top-24 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/70 backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              Rys — early access
            </p>
            <h2 className="max-w-md text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
              Your job search,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                unified.
              </span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
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
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07] p-3.5 backdrop-blur-sm"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="size-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{f.label}</p>
                  <p className="mt-0.5 text-xs text-white/50">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 flex items-center gap-2 text-xs text-white/40"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Free forever. No credit card required.</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
