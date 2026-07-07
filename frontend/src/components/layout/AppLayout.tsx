import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, LogOut, User as UserIcon, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
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
import { initials } from '@/lib/utils';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();

  function onToggleTheme() {
    toggle();
    updateProfile.mutate({ darkMode: theme !== 'dark' });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen border-r border-sidebar-border bg-sidebar">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full w-[260px] border-r border-sidebar-border bg-sidebar lg:hidden"
            >
              <div className="absolute right-3 top-4">
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />

          <div className="flex items-center gap-1">
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
                <button className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-transform hover:scale-105">
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
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
