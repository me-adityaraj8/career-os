import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';
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

/**
 * Authenticated app shell: fixed sidebar on desktop, slide-over drawer on mobile,
 * a top bar with theme toggle + user menu, and an <Outlet> for the active page.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();

  // Toggling theme also persists the preference to the user's account.
  function onToggleTheme() {
    toggle();
    updateProfile.mutate({ darkMode: theme !== 'dark' });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 border-r bg-background">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {user ? initials(user.name) : <UserIcon className="size-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
