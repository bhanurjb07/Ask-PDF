import { useCallback, useEffect, useMemo } from 'react';
import { QUESTION_MAX_LENGTH } from '../constants/index.js';
import { useAppContext } from '../context/AppContext.jsx';
import chatService from '../services/chatService.js';
import type { ChatHistoryItem, ChatMessage, StreamDonePayload } from '../types/index.js';
import useStreaming from './useStreaming.js';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function useChat() {
  const {
    selectedDocumentId,
    messagesByDoc,
    setMessagesByDoc,
    pushToast,
  } = useAppContext();
  const { streaming, start, stop } = useStreaming();

  const messages = useMemo(
    () => (selectedDocumentId ? messagesByDoc[selectedDocumentId] || [] : []),
    [messagesByDoc, selectedDocumentId],
  );

  const loadHistory = useCallback(async () => {
    if (!selectedDocumentId) return;
    try {
      const items: ChatHistoryItem[] = await chatService.getChatHistory(selectedDocumentId);
      const mapped: ChatMessage[] = items
        .slice()
        .reverse()
        .flatMap((item) => [
          {
            id: `${item.id}-q`,
            role: 'user',
            content: item.question,
            createdAt: item.createdAt,
          },
          {
            id: `${item.id}-a`,
            role: 'assistant',
            content: item.answer,
            createdAt: item.createdAt,
            meta: item.retrievedChunks,
          },
        ]);
      setMessagesByDoc((prev) => ({ ...prev, [selectedDocumentId]: mapped }));
    } catch (error) {
      pushToast({ type: 'error', message: getErrorMessage(error) });
    }
  }, [pushToast, selectedDocumentId, setMessagesByDoc]);

  useEffect(() => {
    if (selectedDocumentId && !messagesByDoc[selectedDocumentId]) {
      loadHistory();
    }
  }, [loadHistory, messagesByDoc, selectedDocumentId]);

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = String(question || '').trim();
      if (!selectedDocumentId) {
        pushToast({ type: 'error', message: 'Select a document first' });
        return;
      }
      if (!trimmed) {
        pushToast({ type: 'error', message: 'Question cannot be empty' });
        return;
      }
      if (trimmed.length > QUESTION_MAX_LENGTH) {
        pushToast({
          type: 'error',
          message: `Question must be under ${QUESTION_MAX_LENGTH} characters`,
        });
        return;
      }

      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantId = `a-${Date.now()}`;

      setMessagesByDoc((prev) => ({
        ...prev,
        [selectedDocumentId]: [
          ...(prev[selectedDocumentId] || []),
          userMessage,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            streaming: true,
            createdAt: new Date().toISOString(),
          },
        ],
      }));

      await start({
        documentId: selectedDocumentId,
        question: trimmed,
        onToken: (_token: string, full: string) => {
          setMessagesByDoc((prev) => ({
            ...prev,
            [selectedDocumentId]: (prev[selectedDocumentId] || []).map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: full, streaming: true }
                : msg,
            ),
          }));
        },
        onDone: (payload: StreamDonePayload) => {
          setMessagesByDoc((prev) => ({
            ...prev,
            [selectedDocumentId]: (prev[selectedDocumentId] || []).map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: payload.answer || msg.content,
                    streaming: false,
                    meta: payload.retrievedChunks,
                  }
                : msg,
            ),
          }));
        },
        onError: (error: Error) => {
          const reason = error?.message?.trim() || 'Sorry, something went wrong.';
          pushToast({ type: 'error', message: reason });
          setMessagesByDoc((prev) => ({
            ...prev,
            [selectedDocumentId]: (prev[selectedDocumentId] || []).map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: msg.content || reason,
                    streaming: false,
                    error: true,
                  }
                : msg,
            ),
          }));
        },
      });
    },
    [pushToast, selectedDocumentId, setMessagesByDoc, start],
  );

  const clearChat = useCallback(async () => {
    if (!selectedDocumentId) return;
    try {
      await chatService.clearChatHistory(selectedDocumentId);
      setMessagesByDoc((prev) => ({ ...prev, [selectedDocumentId]: [] }));
      pushToast({ type: 'success', message: 'Chat cleared' });
    } catch (error) {
      pushToast({ type: 'error', message: getErrorMessage(error) });
    }
  }, [pushToast, selectedDocumentId, setMessagesByDoc]);

  const downloadChat = useCallback(() => {
    if (!messages.length) return;
    const text = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${selectedDocumentId || 'export'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [messages, selectedDocumentId]);

  return {
    messages,
    streaming,
    sendQuestion,
    clearChat,
    downloadChat,
    stop,
    loadHistory,
  };
}
