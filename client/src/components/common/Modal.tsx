import type { ReactNode } from 'react';

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/50 p-4" role="dialog" aria-modal="true">
      <div className="panel w-full max-w-md !rounded-2xl !p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg text-ink-900 dark:text-ink-50">{title}</h3>
          <button type="button" onClick={onClose} className="text-ink-500 dark:text-ink-400" aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
