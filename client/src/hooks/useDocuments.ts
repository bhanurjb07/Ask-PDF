import { useCallback, useEffect, useState } from 'react';
import documentService from '../services/documentService.js';
import { useAppContext } from '../context/AppContext.jsx';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function useDocuments() {
  const { documents, setDocuments, pushToast } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const items = await documentService.listDocuments();
      setDocuments(items);
    } catch (error) {
      pushToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [pushToast, setDocuments]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await documentService.deleteDocument(id);
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        pushToast({ type: 'success', message: 'Document deleted' });
      } catch (error) {
        pushToast({ type: 'error', message: getErrorMessage(error) });
      }
    },
    [pushToast, setDocuments],
  );

  const filtered = documents.filter((doc) =>
    String(doc.originalName || '')
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return {
    documents: filtered,
    allDocuments: documents,
    loading,
    query,
    setQuery,
    refresh,
    remove,
  };
}
