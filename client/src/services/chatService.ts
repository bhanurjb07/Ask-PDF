import api, { API_BASE_URL } from './api.js';

export const getChatHistory = async (documentId: string) => {
  const response = await api.get(`/api/chat/history/${documentId}`);
  return response.data?.data?.items || [];
};

export const clearChatHistory = async (documentId: string) => {
  const response = await api.delete(`/api/chat/history/${documentId}`);
  return response.data?.data;
};

export const streamChat = async ({
  documentId,
  question,
  onEvent,
  signal,
}: {
  documentId: string;
  question: string;
  onEvent?: (payload: { event: string; data: unknown }) => void;
  signal?: AbortSignal;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ documentId, question }),
    signal,
  });

  if (!response.ok) {
    let message = 'Chat request failed';
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming is not supported in this browser');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n');
      let event = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          data += line.slice(5).trim();
        }
      }

      if (!data) continue;

      try {
        onEvent?.({ event, data: JSON.parse(data) });
      } catch {
        onEvent?.({ event, data });
      }
    }
  }
};

export default {
  getChatHistory,
  clearChatHistory,
  streamChat,
};
