import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Loader2, User, Palette } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FounderConnect } from '@/components/FounderConnect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUpdateProfile } from '@/hooks/useAuth';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');

  async function saveName(e: FormEvent) {
    e.preventDefault();
    await updateProfile.mutateAsync({ name });
    toast({ title: 'Profile updated', variant: 'success' });
  }

  function setDark(dark: boolean) {
    setTheme(dark ? 'dark' : 'light');
    updateProfile.mutate({ darkMode: dark });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" /> Profile
              </CardTitle>
              <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled />
                </div>
                <Button type="submit" disabled={updateProfile.isPending || name === user?.name}>
                  {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4 text-muted-foreground" /> Appearance
              </CardTitle>
              <CardDescription>Choose your theme. This syncs to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  onClick={() => setDark(false)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                    theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border',
                  )}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                    <Sun className="size-5" />
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setDark(true)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                    theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border',
                  )}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                    <Moon className="size-5" />
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <FounderConnect />
        </motion.div>
      </motion.div>
    </div>
  );
}
