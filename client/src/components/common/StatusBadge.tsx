import { STATUS_LABELS } from '../../constants/index.js';

const toneMap: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  FAILED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  UPLOADING: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  default: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
};

export default function StatusBadge({ status }: { status?: string }) {
  const label = STATUS_LABELS[status || ''] || status || 'Unknown';
  const tone = toneMap[status || ''] || toneMap.default;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
