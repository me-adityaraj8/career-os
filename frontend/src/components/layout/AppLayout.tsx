import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Moon, Sun, LogOut, User as UserIcon, X, Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { SmartReminders } from '@/components/SmartReminders';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { cn, initials } from '@/lib/utils';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const SIDEBAR_W = 260;
const COLLAPSED_W = 0;
const HOVER_ZONE = 16;

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverReveal, setHoverReveal] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { theme, toggleWithTransition } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const { collapsed, toggle: toggleSidebar } = useSidebarStore();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const location = useLocation();

  useKeyboardShortcuts();

  function onToggleTheme(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    toggleWithTransition(x, y);
    updateProfile.mutate({ darkMode: theme !== 'dark' });
  }

  function openPalette() {
    window.dispatchEvent(new Event('rys:command-palette'));
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!collapsed || mobileOpen) return;
      if (e.clientX <= HOVER_ZONE) {
        if (!hoverTimer.current) {
          hoverTimer.current = setTimeout(() => setHoverReveal(true), 200);
        }
      } else if (hoverReveal && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setHoverReveal(false);
        clearTimeout(hoverTimer.current);
        hoverTimer.current = undefined;
      } else if (!hoverReveal) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = undefined;
      }
    },
    [collapsed, hoverReveal, mobileOpen],
  );

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hoverTimer.current);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    if (!collapsed) setHoverReveal(false);
  }, [collapsed]);

  return (
    <div className="relative flex min-h-screen">
      {/* Desktop sidebar — animated width for collapse */}
      <motion.aside
        className="hidden shrink-0 lg:block"
        initial={false}
        animate={{ width: collapsed ? COLLAPSED_W : SIDEBAR_W }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {!collapsed && (
          <div className="sticky top-0 h-screen w-[260px] border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
            <Sidebar />
          </div>
        )}
      </motion.aside>

      {/* Hover-reveal overlay sidebar when collapsed */}
      {collapsed && (
        <>
          <motion.div
            initial={false}
            animate={{ opacity: hoverReveal ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] hidden lg:block',
              hoverReveal ? 'pointer-events-auto' : 'pointer-events-none',
            )}
            onClick={() => setHoverReveal(false)}
          />
          <motion.div
            ref={sidebarRef}
            initial={false}
            animate={{ x: hoverReveal ? 0 : -SIDEBAR_W }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed left-0 top-0 z-40 hidden h-full w-[260px] border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl lg:block',
              !hoverReveal && 'pointer-events-none',
            )}
          >
            <Sidebar />
          </motion.div>
        </>
      )}

      {/* Mobile drawer */}
      <motion.div
        initial={false}
        animate={{ opacity: mobileOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
      />
      <motion.div
        initial={false}
        animate={{ x: mobileOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-[260px] border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:hidden',
          !mobileOpen && 'pointer-events-none',
        )}
      >
        <div className="absolute right-3 top-4">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </motion.div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-1">
            {/* Mobile: the top-left opens search; primary nav lives in the
                bottom bar, secondary nav in the drawer via its "More" tab. */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={openPalette}
              aria-label="Search"
            >
              <Search className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex text-muted-foreground"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </div>

          <button
            onClick={openPalette}
            className="group hidden h-10 w-full max-w-[340px] items-center gap-2.5 rounded-xl border bg-secondary/40 px-3.5 text-[13.5px] text-muted-foreground/70 transition-all duration-200 ease-premium hover:border-border-strong hover:bg-secondary sm:flex"
          >
            <Search className="size-4" />
            <span>Search or jump to…</span>
            <kbd className="ml-auto rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
            <SmartReminders />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="text-muted-foreground"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all hover:ring-border-strong">
                  {user ? initials(user.name) : <UserIcon className="size-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-5 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-10 lg:px-12 lg:py-12 lg:pb-12"
          role="main"
          tabIndex={-1}
        >
          <Suspense fallback={<div className="mx-auto max-w-[1400px]"><PageSkeleton /></div>}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                className="mx-auto max-w-[1400px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {/* Thumb-friendly bottom navigation — phones only */}
      <MobileNav onOpenMore={() => setMobileOpen(true)} />
    </div>
  );
}
