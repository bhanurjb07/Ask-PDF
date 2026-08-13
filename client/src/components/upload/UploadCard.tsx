import { useRef, useState } from 'react';
import ProgressBar from '../common/ProgressBar.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import useUpload from '../../hooks/useUpload.js';
import { formatBytes } from '../../utils/format.js';
import { STATUS_LABELS } from '../../constants/index.js';
import type { Document } from '../../types/index.js';

export default function UploadCard({
  onCompleted,
}: {
  onCompleted?: (doc: Document) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploadState, upload } = useUpload({ onCompleted });

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) upload(file);
  };

  return (
    <section className="panel">
      <h2 className="panel-header">Upload PDF</h2>
      <p className="panel-subtext mt-1">
        Drag a PDF here or browse. Max 20MB. Processing runs in the background.
      </p>

      <div
        className={`dropzone mt-5 ${dragging ? 'dropzone-active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-ink-600 dark:text-ink-200">Drop PDF file</p>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {uploadState.file ? (
        <div className="muted-box mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{uploadState.file.name}</p>
              <p className="text-xs text-ink-500">{formatBytes(uploadState.file.size)}</p>
            </div>
            <StatusBadge status={uploadState.status} />
          </div>
          {uploadState.status === 'UPLOADING' ? (
            <ProgressBar value={uploadState.progress} label="Uploading..." />
          ) : (
            <p className="text-sm text-ink-600 dark:text-ink-200">
              {STATUS_LABELS[uploadState.status] || uploadState.status}
            </p>
          )}
          {uploadState.error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{uploadState.error}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
