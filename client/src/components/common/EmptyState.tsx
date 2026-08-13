import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-box">
      <h3 className="font-display text-xl text-ink-900 dark:text-ink-50">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
