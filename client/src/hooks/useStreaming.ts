import { useCallback, useRef, useState } from 'react';
import chatService from '../services/chatService.js';
import type { StreamDonePayload, StreamEventData } from '../types/index.js';

export default function useStreaming() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const start = useCallback(async ({
    documentId,
    question,
    onToken,
    onDone,
    onError,
  }: {
    documentId: string;
    question: string;
    onToken?: (token: string, full: string) => void;
    onDone?: (payload: StreamDonePayload) => void;
    onError?: (error: Error) => void;
  }) => {
    stop();
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    let answer = '';

    try {
      await chatService.streamChat({
        documentId,
        question,
        signal: controller.signal,
        onEvent: ({ event, data }) => {
          const payload = data as StreamEventData;
          if (event === 'token' && payload?.text) {
            answer += payload.text;
            onToken?.(payload.text, answer);
          }
          if (event === 'done') {
            onDone?.({ ...payload, answer: payload?.answer || answer });
          }
          if (event === 'error') {
            onError?.(new Error(payload?.message || 'Stream error'));
          }
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [stop]);

  return { streaming, start, stop };
}
