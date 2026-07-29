import { useNavigate } from 'react-router-dom';
import UploadCard from '../components/upload/UploadCard.jsx';
import DocumentCard from '../components/upload/DocumentCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import useDocuments from '../hooks/useDocuments.js';
import { useAppContext } from '../context/AppContext.jsx';

export default function Home() {
  const navigate = useNavigate();
  const { setSelectedDocumentId } = useAppContext();
  const { documents, loading, query, setQuery, refresh, remove } = useDocuments();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <UploadCard
        onCompleted={(doc) => {
          setSelectedDocumentId(doc.id);
        }}
      />

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="panel-header">Recent uploads</h2>
            <p className="panel-subtext mt-1">
              Stats update as processing finishes.
            </p>
          </div>
          <button type="button" onClick={refresh} className="btn-outline">
            Refresh
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents"
          className="input-base mt-4"
          aria-label="Search documents"
        />

        <div className="mt-4 space-y-3">
          {loading ? <LoadingSpinner label="Loading documents" /> : null}
          {!loading && documents.length === 0 ? (
            <EmptyState
              title="No uploads yet"
              description="Your processed PDFs will appear here."
            />
          ) : null}
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onSelect={(d) => {
                setSelectedDocumentId(d.id);
                navigate('/chat');
              }}
              onDelete={remove}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
