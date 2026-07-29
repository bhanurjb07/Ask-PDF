import { useAppContext } from '../../context/AppContext.jsx';

export default function ToastViewport() {
  const { toasts, dismissToast } = useAppContext();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-soft ${
            toast.type === 'error'
              ? 'bg-rose-700 text-white'
              : 'bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900'
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              className="opacity-80 hover:opacity-100"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
