export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const DOCUMENT_STATUS = {
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  TEXT_EXTRACTED: 'TEXT_EXTRACTED',
  CHUNKING: 'CHUNKING',
  CHUNKED: 'CHUNKED',
  GENERATING_EMBEDDINGS: 'GENERATING_EMBEDDINGS',
  EMBEDDED: 'EMBEDDED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export const CHUNKING = {
  CHUNK_SIZE_WORDS: 500,
  OVERLAP_WORDS: 50,
  WORDS_PER_TOKEN: 0.75,
};

export const EMBEDDING = {
  MODEL: 'gemini-embedding-001',
  VERSION: 'v1',
  BATCH_SIZE: 10,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 1000,
  EXPECTED_DIMENSIONS: 3072,
  TASK_TYPE: 'RETRIEVAL_DOCUMENT' as const,
  QUERY_TASK_TYPE: 'RETRIEVAL_QUERY' as const,
};

//RAG chat defaults
export const CHAT = {
  MODEL: 'gemini-flash-latest',
  MAX_CONTEXT_TOKENS: 8000,
  MAX_CHAT_TOKENS: 2048,
  STREAM_TIMEOUT_MS: 60000,
  TEMPERATURE: 0.2,
  TOP_P: 0.9,
  MAX_RETRIES: 2,
  RETRY_BASE_DELAY_MS: 1000,
  NO_CONTEXT_MESSAGE:
    "I couldn't find relevant information in the uploaded document.",
  NO_ANSWER_MESSAGE:
    "I couldn't find that information in the uploaded document.",
  QUOTA_MESSAGE:
    'Gemini API quota exceeded for the configured chat model. Wait for the quota window to reset, switch GEMINI_CHAT_MODEL, or enable billing on your Google AI Studio project.',
};

export const RETRIEVAL = {
  SIMILARITY_THRESHOLD: 0.55,
  TOP_K_RESULTS: 5,
  QUESTION_MAX_LENGTH: 2000,
  QUESTION_MIN_LENGTH: 3,
};

export const QUEUE_NAMES = {
  DOCUMENT_PROCESSING: 'document-processing',
};

export const JOB_NAMES = {
  PROCESS_DOCUMENT: 'process-document',
};