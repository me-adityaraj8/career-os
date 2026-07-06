import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

/**
 * Split-screen auth layout: form on the left, marketing panel on the right.
 * Shared by the login and register pages.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-sm"
        >
          <Logo className="mb-10" />
          {children}
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.12),transparent_45%),radial-gradient(circle_at_70%_80%,hsl(var(--primary-foreground)/0.08),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-center px-16 text-primary-foreground">
          <blockquote className="max-w-md text-2xl font-medium leading-relaxed">
            “Your job search, unified.”
          </blockquote>
          <p className="mt-4 max-w-md text-primary-foreground/70">
            Track applications, manage resumes, prep for interviews, and get AI-powered insights —
            all in one workspace.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-primary-foreground/80">
            {['Kanban application tracker', 'AI job analyzer & cover letters', 'Interview coach & networking CRM', 'Career analytics dashboard'].map(
              (f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-foreground/60" />
                  {f}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
