import { useState, type FormEvent } from 'react';
import { QUESTION_MAX_LENGTH } from '../../constants/index.js';

export default function ChatInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend?: (question: string) => void;
}) {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="border-t border-ink-200 p-3 dark:border-ink-700">
      <label className="sr-only" htmlFor="chat-question">
        Ask a question
      </label>
      <div className="flex gap-2">
        <textarea
          id="chat-question"
          rows={2}
          value={value}
          maxLength={QUESTION_MAX_LENGTH}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask something about the selected document..."
          className="input-base min-h-[56px] flex-1 resize-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="btn-primary self-end"
        >
          Send
        </button>
      </div>
      <p className="mt-1 text-right text-[11px] text-ink-400 dark:text-ink-500">
        {value.length}/{QUESTION_MAX_LENGTH}
      </p>
    </form>
  );
}
