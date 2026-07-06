import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import type { AuthResponse, User } from '@/types';

/** Log in; on success store token+user and sync theme from the account. */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setTheme = useThemeStore((s) => s.setTheme);
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) =>
      (await api.post<AuthResponse>('/auth/login', body)).data,
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      setTheme(user.darkMode ? 'dark' : 'light');
    },
  });
}

/** Register a new account; same post-success handling as login. */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (body: { email: string; password: string; name: string }) =>
      (await api.post<AuthResponse>('/auth/register', body)).data,
    onSuccess: ({ token, user }) => setAuth(token, user),
  });
}

/** Fetch the current user (used to validate a persisted token on app load). */
export function useMe() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['me'],
    enabled: Boolean(token),
    queryFn: async () => {
      const user = (await api.get<{ user: User }>('/auth/me')).data.user;
      setUser(user);
      return user;
    },
  });
}

/** Update profile (name / dark mode) and keep the auth store in sync. */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { name?: string; darkMode?: boolean }) =>
      (await api.patch<{ user: User }>('/auth/me', patch)).data.user,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['me'], user);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return () => {
    clear();
    queryClient.clear();
  };
}
