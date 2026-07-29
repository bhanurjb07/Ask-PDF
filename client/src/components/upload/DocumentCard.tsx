import StatusBadge from '../common/StatusBadge.jsx';
import { formatBytes, formatDate } from '../../utils/format.js';
import type { Document } from '../../types/index.js';

export default function DocumentCard({
  document: doc,
  selected,
  onSelect,
  onDelete,
  compact = false,
}: {
  document: Document;
  selected?: boolean;
  onSelect?: (doc: Document) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  if (!doc) return null;

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        selected
          ? 'border-ink-700 bg-ink-50 dark:border-ink-400 dark:bg-ink-800'
          : 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-850'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onSelect?.(doc)}
        >
          <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
            {doc.originalName}
          </p>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{formatDate(doc.uploadedAt || doc.createdAt)}</p>
        </button>
        <StatusBadge status={doc.status} />
      </div>

      {!compact ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-600 dark:text-ink-300 sm:grid-cols-4">
          <div>
            <dt>Pages</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{doc.pageCount ?? '—'}</dd>
          </div>
          <div>
            <dt>Words</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{doc.wordCount ?? '—'}</dd>
          </div>
          <div>
            <dt>Chunks</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{doc.chunkCount ?? 0}</dd>
          </div>
          <div>
            <dt>Embedded</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">
              {doc.embeddedChunkCount ?? 0}
              {doc.embeddingProgressPercentage != null
                ? ` (${doc.embeddingProgressPercentage}%)`
                : ''}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
          {formatBytes(doc.fileSize)} · chunks {doc.chunkCount ?? 0}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onSelect?.(doc)} className="btn-primary-sm">
          Select
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(doc.id)}
            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-rose-700 dark:border-rose-700 dark:text-rose-300"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}
