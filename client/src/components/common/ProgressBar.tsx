export default function ProgressBar({ value = 0, label }: { value?: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1" aria-label={label || 'Progress'}>
      {label ? <p className="text-xs text-ink-500 dark:text-ink-300">{label}</p> : null}
      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-700">
        <div
          className="h-full rounded-full bg-ink-900 transition-all duration-300 dark:bg-ink-50"
          style={{ width: `${safe}%` }}
        />
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-300">{safe}%</p>
    </div>
  );
}
