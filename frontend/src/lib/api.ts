import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

/**
 * Shared axios instance for the API. Reads the base URL from Vite env
 * (VITE_API_URL), attaches the JWT from the auth store on every request, and
 * logs the user out on a 401 so stale tokens don't leave the app in limbo.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const data = error.response?.data as { error?: { code?: string } } | undefined;
    if (error.response?.status === 403 && data?.error?.code === 'demo_readonly') {
      toast({
        title: 'Demo account is read-only',
        description: 'Sign up for a free account to start tracking your applications.',
        variant: 'error',
      });
      (error as any)._demoReadonly = true;
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

/** True when the axios interceptor already showed a toast for this error. */
export function isDemoReadonly(err: unknown): boolean {
  return Boolean((err as any)?._demoReadonly);
}

/** Extract a human-readable message from an axios error's API envelope. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message ?? fallback;
  }
  return fallback;
}
