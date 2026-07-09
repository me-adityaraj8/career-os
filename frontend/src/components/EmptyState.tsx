import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

function FloatingDots() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-1 rounded-full bg-foreground/[0.04]"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3 + i * 0.5,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 py-20 text-center"
    >
      <FloatingDots />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="relative mb-6"
      >
        <div className="absolute -inset-3 rounded-3xl bg-secondary/50 blur-xl" />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
          className="relative flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-secondary/80 text-muted-foreground shadow-sm"
        >
          <Icon className="size-7" />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-lg font-semibold tracking-tight"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
