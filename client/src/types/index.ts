export type Document = {
  id: string;
  originalName?: string;
  status?: string;
  uploadedAt?: string;
  createdAt?: string;
  pageCount?: number;
  wordCount?: number;
  chunkCount?: number;
  embeddedChunkCount?: number;
  embeddingProgressPercentage?: number;
  fileSize?: number;
  failureReason?: string;
};

export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  streaming?: boolean;
  error?: boolean;
  meta?: unknown;
};

export type ChatHistoryItem = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  retrievedChunks?: unknown;
};

export type StreamDonePayload = {
  answer?: string;
  retrievedChunks?: unknown;
};

export type StreamEventData = {
  text?: string;
  message?: string;
  answer?: string;
  retrievedChunks?: unknown;
};
