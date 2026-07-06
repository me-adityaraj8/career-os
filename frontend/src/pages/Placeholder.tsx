import { Hammer } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

/** Temporary page for sections built in later phases of the build. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={Hammer}
        title="Coming up in a later build phase"
        description={`The ${title} area is scaffolded and will be wired up shortly.`}
      />
    </div>
  );
}
