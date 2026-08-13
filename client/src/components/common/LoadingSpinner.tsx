export default function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-ink-300" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-ink-900 dark:border-ink-600 dark:border-t-ink-50" />
      <span>{label}</span>
    </div>
  );
}
