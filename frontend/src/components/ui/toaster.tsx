import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

const icons = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
};

/** Fixed-position stack of animated toasts. Mount once near the app root. */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-card/95 p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-sm"
            >
              <Icon
                className={cn(
                  'mt-0.5 size-5 shrink-0',
                  t.variant === 'success' && 'text-emerald-500',
                  t.variant === 'error' && 'text-destructive',
                  t.variant === 'default' && 'text-muted-foreground',
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
