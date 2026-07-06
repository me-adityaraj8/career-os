import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

/** Friendly empty state with an icon, message, and optional CTA. */
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
