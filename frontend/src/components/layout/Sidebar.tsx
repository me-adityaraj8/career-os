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
          'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200',
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
              className="absolute inset-0 rounded-lg border border-border/60 bg-secondary shadow-elev-1"
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

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-3 py-5">
      <div className="mb-7 px-3">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-8">
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

        <div className="mt-auto space-y-0.5 border-t border-sidebar-border pt-4">
          {bottomNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    </div>
  );
}
