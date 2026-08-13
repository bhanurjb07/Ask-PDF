import { formatDate } from '../../utils/format.js';
import TypingIndicator from '../common/TypingIndicator.jsx';
import type { ChatMessage } from '../../types/index.js';

export default function ChatBubble({
  message,
  onCopy,
}: {
  message: ChatMessage;
  onCopy?: (text: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900'
            : 'border border-ink-200 bg-white text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50'
        }`}
      >
        {message.streaming && !message.content ? <TypingIndicator /> : null}
        {message.content ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] opacity-70">
          <span>{formatDate(message.createdAt)}</span>
          {!isUser && message.content ? (
            <button type="button" onClick={() => onCopy?.(message.content)}>
              Copy
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
