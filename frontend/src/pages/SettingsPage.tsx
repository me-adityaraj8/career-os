import { FormEvent, useState } from 'react';
import { Moon, Sun, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUpdateProfile } from '@/hooks/useAuth';
import { toast } from '@/stores/toastStore';

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

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose your theme. This syncs to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setDark(false)}
              >
                <Sun className="size-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setDark(true)}
              >
                <Moon className="size-4" />
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
