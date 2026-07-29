export const STATUS = {
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  TEXT_EXTRACTED: 'TEXT_EXTRACTED',
  CHUNKING: 'CHUNKING',
  CHUNKED: 'CHUNKED',
  GENERATING_EMBEDDINGS: 'GENERATING_EMBEDDINGS',
  EMBEDDED: 'EMBEDDED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  UPLOADING: 'UPLOADING',
};

export const STATUS_LABELS: Record<string, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  TEXT_EXTRACTED: 'Text extracted',
  CHUNKING: 'Chunking',
  CHUNKED: 'Chunked',
  GENERATING_EMBEDDINGS: 'Generating embeddings',
  EMBEDDED: 'Embedded',
  COMPLETED: 'Ready',
  FAILED: 'Failed',
  UPLOADING: 'Uploading',
};

export const QUESTION_MAX_LENGTH = 2000;
export const ACCEPTED_MIME = 'application/pdf';
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const POLL_INTERVAL_MS = 3000;
