import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/chat/Sidebar.jsx';
import ChatBubble from '../components/chat/ChatBubble.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import useDocuments from '../hooks/useDocuments.js';
import useChat from '../hooks/useChat.js';
import { useAppContext } from '../context/AppContext.js';
import { STATUS } from '../constants/index.js';

export default function Chat() {
  const { selectedDocumentId, setSelectedDocumentId, pushToast } = useAppContext();
  const { documents, allDocuments, loading, query, setQuery, remove } = useDocuments();
  const { messages, streaming, sendQuestion, clearChat, downloadChat } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () =>
      allDocuments.find((d) => d.id === selectedDocumentId) ||
      documents.find((d) => d.id === selectedDocumentId),
    [allDocuments, documents, selectedDocumentId],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const ready = selected?.status === STATUS.COMPLETED;

  return (
    <div className="flex min-h-[70vh] gap-4">
      <Sidebar
        documents={documents}
        loading={loading}
        query={query}
        onQueryChange={setQuery}
        selectedId={selectedDocumentId}
        onSelect={(doc) => setSelectedDocumentId(doc.id)}
        onDelete={remove}
      />

      <section className="panel flex min-h-[70vh] flex-1 flex-col overflow-hidden !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-3 dark:border-ink-700">
          <div>
            <h2 className="font-display text-xl text-ink-900 dark:text-ink-50">
              {selected?.originalName || 'Select a document'}
            </h2>
            {selected ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                <StatusBadge status={selected.status} />
                <span>pages {selected.pageCount ?? '—'}</span>
                <span>chunks {selected.chunkCount ?? 0}</span>
                <span>
                  embedded {selected.embeddedChunkCount ?? 0}
                  {selected.embeddingProgressPercentage != null
                    ? ` (${selected.embeddingProgressPercentage}%)`
                    : ''}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadChat} className="btn-outline-sm">
              Download
            </button>
            <button type="button" onClick={clearChat} className="btn-outline-sm">
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {!selected ? (
            <EmptyState
              title="No document selected"
              description="Choose a processed PDF from the sidebar, or upload one first."
              action={
                <Link to="/" className="text-sm font-medium text-ink-700 underline dark:text-ink-200">
                  Go to Home
                </Link>
              }
            />
          ) : null}

          {selected && !ready ? (
            <EmptyState
              title="Document still processing"
              description="Chat unlocks when status is COMPLETED."
            />
          ) : null}

          {selected && ready && messages.length === 0 ? (
            <EmptyState
              title="Ask your first question"
              description="Answers stream live from the RAG backend."
            />
          ) : null}

          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              onCopy={async (text) => {
                try {
                  await navigator.clipboard.writeText(text);
                  pushToast({ type: 'success', message: 'Copied response' });
                } catch {
                  pushToast({ type: 'error', message: 'Copy failed' });
                }
              }}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        <ChatInput
          disabled={!selected || !ready || streaming}
          onSend={sendQuestion}
        />
      </section>
    </div>
  );
}
