import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, LogOut, User as UserIcon, X, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Starfield } from '@/components/Starfield';
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
import { useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { cn, initials } from '@/lib/utils';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const location = useLocation();

  function onToggleTheme() {
    toggle();
    updateProfile.mutate({ darkMode: theme !== 'dark' });
  }

  function openPalette() {
    window.dispatchEvent(new Event('rys:command-palette'));
  }

  return (
    <div className="noise ambient relative flex min-h-screen bg-background">
      {/* Ambient starfield behind all content */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <Starfield density={0.7} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen border-r border-sidebar-border bg-sidebar">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile drawer. Kept mounted and driven by the `animate` prop instead
          of AnimatePresence exit — a stuck exit here previously left an
          invisible full-screen backdrop that swallowed every click and drag.
          pointer-events is gated on state, so the closed drawer can never
          block the app even if an animation misbehaves. */}
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
          'fixed left-0 top-0 z-50 h-full w-[260px] border-r border-sidebar-border bg-sidebar lg:hidden',
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
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/70 px-4 backdrop-blur-xl lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <button
            onClick={openPalette}
            className="group hidden h-9 w-full max-w-[280px] items-center gap-2 rounded-lg border bg-secondary/40 px-3 text-[13px] text-muted-foreground/70 transition-all duration-200 ease-premium hover:border-border-strong hover:bg-secondary sm:flex"
          >
            <Search className="size-3.5" />
            <span>Search or jump to…</span>
            <kbd className="ml-auto rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
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

        <main className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="mx-auto max-w-[1440px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
