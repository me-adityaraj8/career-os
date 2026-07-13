import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Kanban, Sparkles, Target, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Board', icon: Kanban },
  { to: '/ai', label: 'AI', icon: Sparkles },
  { to: '/goals', label: 'Goals', icon: Target },
];

/**
 * Thumb-friendly bottom tab bar for phones (hidden at lg+ where the sidebar
 * takes over). The "More" tab opens the full navigation drawer for the
 * secondary destinations (Resumes, Interviews, Network, Analytics, Settings).
 */
export function MobileNav({ onOpenMore }: { onOpenMore: () => void }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-2 inset-y-1.5 -z-10 rounded-xl bg-secondary"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <tab.icon
                  className={cn(
                    'size-[22px] transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onOpenMore}
          aria-label="More"
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl active:scale-95"
        >
          <Menu className="size-[22px] text-muted-foreground/70" />
          <span className="text-[10px] font-medium text-muted-foreground/70">More</span>
        </button>
      </div>
    </nav>
  );
}
