import { motion } from 'framer-motion';
import { Bug, Lightbulb, MessageSquareHeart, CalendarDays, Mail, Github } from 'lucide-react';
import { founder, founderLinks } from '@/lib/founder';
import { cn } from '@/lib/utils';

/* Brand marks lucide doesn't ship — kept inline for accuracy. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.369a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

interface QuickAction {
  label: string;
  href: string;
  external?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

/** Configured founder socials (blank channels omitted). Shared with the footer. */
export const founderSocials = [
  { label: 'Email', href: `mailto:${founder.email}`, icon: Mail },
  { label: 'GitHub', href: founder.github, icon: Github },
  { label: 'LinkedIn', href: founder.linkedin, icon: LinkedinIcon },
  { label: 'X', href: founder.x, icon: XIcon },
  { label: 'Discord', href: founder.discord, icon: DiscordIcon },
].filter((s) => Boolean(s.href));

/**
 * A personal "reach out to the founder" card. Used in Settings, on the landing
 * page, and anywhere else — quick actions to report bugs, request features,
 * send feedback, or just say hi.
 */
export function FounderConnect({ className }: { className?: string }) {
  const actions: QuickAction[] = [
    { label: 'Report a Bug', href: founderLinks.reportBug, external: true, icon: Bug },
    { label: 'Request a Feature', href: founderLinks.requestFeature, external: true, icon: Lightbulb },
    { label: 'Send Feedback', href: founderLinks.sendFeedback, icon: MessageSquareHeart },
    ...(founder.bookACall
      ? [{ label: 'Book a Call', href: founder.bookACall, external: true, icon: CalendarDays }]
      : []),
  ];

  return (
    <div
      className={cn(
        'spotlight surface relative overflow-hidden rounded-[20px] border bg-card p-6 sm:p-7',
        className,
      )}
    >
      {/* Soft accent glow in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-gradient-to-br from-foreground/[0.06] to-transparent blur-2xl"
      />

      <div className="relative flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-lg font-bold text-background">
          {founder.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            From the founder
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            Hey, I'm {founder.name} — I'm building Rys.
          </h3>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
            Rys is actively evolving, and every piece of feedback directly shapes the product.
            Found a bug, want a feature, or just have a thought? I read everything — reach out.
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="relative mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {actions.map((action, i) => (
          <motion.a
            key={action.label}
            href={action.href}
            {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2 }}
            className="group flex items-center gap-3 rounded-xl border bg-background px-3.5 py-3 text-sm font-medium transition-colors hover:border-border-strong hover:bg-secondary/50"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
              <action.icon className="size-4" />
            </span>
            {action.label}
          </motion.a>
        ))}
      </div>

      {/* Social row */}
      {founderSocials.length > 0 && (
        <div className="relative mt-5 flex items-center gap-2 border-t pt-5">
          <span className="mr-1 text-xs text-muted-foreground">Connect</span>
          {founderSocials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-border-strong hover:text-foreground"
            >
              <s.icon className="size-4" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
