import { AnimatePresence, motion } from 'framer-motion';
import { XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

function AnimatedCheck() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0">
      <circle
        cx="12" cy="12" r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-emerald-500"
        style={{
          strokeDasharray: 60,
          strokeDashoffset: 60,
          animation: 'check-circle 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      />
      <path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500"
        style={{
          strokeDasharray: 20,
          strokeDashoffset: 20,
          animation: 'check-draw 0.3s cubic-bezier(0.16,1,0.3,1) 0.25s forwards',
        }}
      />
    </svg>
  );
}

const staticIcons = {
  default: Info,
  error: XCircle,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const isSuccess = t.variant === 'success';
          const Icon = !isSuccess ? staticIcons[t.variant as keyof typeof staticIcons] : null;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-popover/90 p-4 shadow-elev-3 backdrop-blur-xl"
            >
              {isSuccess ? (
                <AnimatedCheck />
              ) : Icon ? (
                <Icon
                  className={cn(
                    'mt-0.5 size-5 shrink-0',
                    t.variant === 'error' && 'text-destructive',
                    t.variant === 'default' && 'text-muted-foreground',
                  )}
                />
              ) : null}
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
