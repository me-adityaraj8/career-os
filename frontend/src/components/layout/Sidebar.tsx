import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Kanban,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Target,
  Sparkles,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useMissions } from '@/hooks/useMissions';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: Kanban },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/interviews', label: 'Interviews', icon: MessageSquare },
  { to: '/network', label: 'Network', icon: Users },
];

const toolsNav = [
  { to: '/ai', label: 'AI Tools', icon: Sparkles },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomNav = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({
  item,
  onNavigate,
}: {
  item: { to: string; label: string; icon: React.ElementType; end?: boolean };
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground/80 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl border border-border/60 bg-secondary shadow-elev-1"
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            />
          )}
          {!isActive && (
            <span className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:bg-secondary/50 group-hover:opacity-100" />
          )}
          <item.icon
            className={cn(
              'relative z-10 size-[17px] transition-colors',
              !isActive && 'text-muted-foreground/60 group-hover:text-foreground',
            )}
          />
          <span className="relative z-10">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function StreakWidget({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = useMissions();
  const navigate = useNavigate();
  const streak = data?.streak;
  if (!streak) return null;

  const todayDone = streak.todayCompleted;
  return (
    <motion.button
      type="button"
      aria-label={`${streak.current}-day streak — open Goals`}
      onClick={() => {
        navigate('/goals');
        onNavigate?.();
      }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="group/streak mx-1 mb-2 block w-[calc(100%-0.5rem)] cursor-pointer rounded-xl border border-sidebar-border bg-sidebar-accent/30 px-3 py-2.5 text-left transition-colors hover:border-orange-500/40 hover:bg-orange-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={todayDone ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="transition-transform duration-300 group-hover/streak:scale-125 group-hover/streak:-rotate-6"
        >
          <Flame
            className={cn(
              'size-4 transition-colors duration-300',
              todayDone ? 'text-orange-500' : 'text-muted-foreground/40 group-hover/streak:text-orange-500',
            )}
          />
        </motion.div>
        <span className="text-xs font-semibold tabular-nums">{streak.current}</span>
        <span className="text-[11px] text-muted-foreground/60">day streak</span>
        <ChevronRight className="ml-auto size-3 text-muted-foreground/0 transition-all duration-300 group-hover/streak:translate-x-0.5 group-hover/streak:text-muted-foreground/60" />
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-sidebar-accent">
        <motion.div
          className={cn('h-full rounded-full', todayDone ? 'bg-orange-500' : 'bg-muted-foreground/20')}
          initial={{ width: 0 }}
          animate={{ width: todayDone ? '100%' : '0%' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.button>
  );
}

export function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <div className="flex h-full flex-col px-3 py-5">
      <div className="mb-7 px-3">
        <Logo />
      </div>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-8">
        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/45">
            Overview
          </p>
          {mainNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/45">
            Tools
          </p>
          {toolsNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="mt-auto space-y-2 border-t border-sidebar-border pt-4">
          <StreakWidget onNavigate={onNavigate} />
          {bottomNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    </div>
  );
}
