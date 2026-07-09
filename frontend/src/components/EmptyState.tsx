import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
      className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
        transition={{
          scale: { duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 },
          opacity: { duration: 0.4, delay: 0.1 },
          y: { duration: 4, ease: 'easeInOut', repeat: Infinity, delay: 0.6 },
        }}
        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"
      >
        <Icon className="size-7" />
      </motion.div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
