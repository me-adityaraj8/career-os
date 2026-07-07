import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
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
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-secondary"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-brand to-brand-2" />
            </motion.div>
          )}
          <item.icon className={cn('relative z-10 size-4', isActive && 'text-brand')} />
          <span className="relative z-10">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="mb-8 px-3 py-1">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-7">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Overview
          </p>
          {mainNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Tools
          </p>
          {toolsNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="mt-auto space-y-1">
          {bottomNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    </div>
  );
}
