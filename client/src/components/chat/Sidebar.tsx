import DocumentCard from '../upload/DocumentCard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { useAppContext } from '../../context/AppContext.jsx';
import type { Document } from '../../types/index.js';

export default function Sidebar({
  documents,
  loading,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  onDelete,
}: {
  documents: Document[];
  loading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (doc: Document) => void;
  onDelete: (id: string) => void;
}) {
  const { sidebarOpen, setSidebarOpen } = useAppContext();

  const content = (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h2 className="panel-header text-xl">Documents</h2>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search uploads"
          className="input-base mt-3"
          aria-label="Search uploaded documents"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? <LoadingSpinner label="Loading documents" /> : null}
        {!loading && documents.length === 0 ? (
          <EmptyState
            title="No documents"
            description="Upload a PDF on the Home page first."
          />
        ) : null}
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            compact
            selected={selectedId === doc.id}
            onSelect={(d) => {
              onSelect(d);
              setSidebarOpen(false);
            }}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className="panel hidden w-80 shrink-0 lg:block">{content}</aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/50"
            aria-label="Close sidebar overlay"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="panel absolute left-0 top-0 h-full w-[85%] max-w-sm !rounded-none !rounded-r-3xl">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
