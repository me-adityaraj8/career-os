import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="space-y-1.5">
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-md text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
