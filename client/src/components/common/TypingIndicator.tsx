export default function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-ink-100 px-3 py-2 dark:bg-ink-800" aria-label="Assistant is typing">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500" />
    </div>
  );
}
