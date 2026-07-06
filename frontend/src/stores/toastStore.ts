import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

/**
 * Tiny toast store. Components call `toast({ title, variant })`; the <Toaster>
 * renders and auto-dismisses them.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Convenience helper so callers don't need the hook selector boilerplate. */
export function toast(input: { title: string; description?: string; variant?: ToastVariant }) {
  useToastStore.getState().push({
    title: input.title,
    description: input.description,
    variant: input.variant ?? 'default',
  });
}
