import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ChatMessage, Document } from '../types/index.js';

type ToastItem = {
  id: string;
  type?: string;
  message: string;
};

type UploadState = {
  file: File | null;
  progress: number;
  status: string;
  documentId: string | null;
  error: string | null;
};

type AppContextValue = {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  selectedDocumentId: string | null;
  setSelectedDocumentId: React.Dispatch<React.SetStateAction<string | null>>;
  messagesByDoc: Record<string, ChatMessage[]>;
  setMessagesByDoc: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  uploadState: UploadState;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  toasts: ToastItem[];
  pushToast: (toast: { type?: string; message: string }) => void;
  dismissToast: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [messagesByDoc, setMessagesByDoc] = useState<Record<string, ChatMessage[]>>({});
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    documentId: null,
    error: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rag-theme') === 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pushToast = useCallback((toast: { type?: string; message: string }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('rag-theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      documents,
      setDocuments,
      selectedDocumentId,
      setSelectedDocumentId,
      messagesByDoc,
      setMessagesByDoc,
      uploadState,
      setUploadState,
      toasts,
      pushToast,
      dismissToast,
      darkMode,
      toggleDarkMode,
      sidebarOpen,
      setSidebarOpen,
    }),
    [
      documents,
      selectedDocumentId,
      messagesByDoc,
      uploadState,
      toasts,
      pushToast,
      dismissToast,
      darkMode,
      toggleDarkMode,
      sidebarOpen,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};

export default AppContext;
