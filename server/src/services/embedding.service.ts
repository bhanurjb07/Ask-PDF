import {getEmbeddingModelName,getGeminiEmbeddingModel,initGemini} from '../config/gemini.js';
import chunkRepository from '../repositories/chunk.repository.js';
import documentRepository from '../repositories/document.repository.js';
import { DOCUMENT_STATUS, EMBEDDING, HTTP_STATUS } from '../constants/index.js';
import workerLogger from '../utils/workerLogger.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

// Wait before retrying an operation.
const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// Check if a Gemini error can be retried.
const isRetryableError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const status = error?.status || error?.statusCode;

  if (status === 429 || status === 500 || status === 503) {
    return true;
  }

  return (
    message.includes('rate') ||
    message.includes('quota') ||
    message.includes('timeout') ||
    message.includes('temporarily') ||
    message.includes('fetch failed') ||
    message.includes('econnreset')
  );
};

// Gemini embedding business logic.
const embeddingService = {
  // Validate a generated embedding.
  validateEmbedding(
    values: any[],
    expectedDimensions = EMBEDDING.EXPECTED_DIMENSIONS,
  ) {
    if (!Array.isArray(values) || values.length === 0) {
      const error = new Error('Embedding response is empty') as Error & {
        code?: string;
      };
      error.code = 'EMPTY_EMBEDDING';
      throw error;
    }

    if (values.some((v) => typeof v !== 'number' || Number.isNaN(v))) {
      const error = new Error(
        'Embedding contains null or non-numeric values',
      ) as Error & {
        code?: string;
      };
      error.code = 'INVALID_EMBEDDING_VALUES';
      throw error;
    }

    // gemini-embedding-001 may return flexible dims; accept non-zero and warn on mismatch.
    if (expectedDimensions && values.length !== expectedDimensions) {
      logger.warn(
        `Embedding dimension mismatch: expected=${expectedDimensions} actual=${values.length}`,
      );
    }

    return values.length;
  },

  // Generate an embedding for a single text.
  async generateEmbedding(
    text: string,
    { taskType = EMBEDDING.TASK_TYPE }: { taskType?: string } = {},
  ) {
    if (!text || !String(text).trim()) {
      const error = new Error('Cannot embed empty chunk text') as Error & {
        code?: string;
      };
      error.code = 'EMPTY_CHUNK';
      throw error;
    }

    initGemini();
    const model = getGeminiEmbeddingModel();

    const result = await model.embedContent({
      content: { parts: [{ text: String(text) }] },
      taskType,
    });

    const values = result?.embedding?.values;
    this.validateEmbedding(values);
    return values;
  },

  // Generate embeddings for multiple texts.
  async generateBatchEmbeddings(
    texts: string[],
    { attempt = 1 }: { attempt?: number } = {},
  ) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    if (texts.some((t) => !t || !String(t).trim())) {
      const error = new Error('Batch contains an empty chunk') as Error & {
        code?: string;
      };
      error.code = 'EMPTY_CHUNK';
      throw error;
    }

    initGemini();
    const model = getGeminiEmbeddingModel();
    const apiStarted = Date.now();

    try {
      const result = await model.batchEmbedContents({
        requests: texts.map((text) => ({
          content: { parts: [{ text: String(text) }] },
          taskType: EMBEDDING.TASK_TYPE,
        })),
      });

      const apiTimeMs = Date.now() - apiStarted;
      const embeddings = (result?.embeddings || []).map((item) => item.values);

      if (embeddings.length !== texts.length) {
        const error = new Error(
          `Embedding batch size mismatch: sent=${texts.length} received=${embeddings.length}`,
        ) as Error & {
          code?: string;
        };
        error.code = 'BATCH_SIZE_MISMATCH';
        throw error;
      }

      embeddings.forEach((values) => this.validateEmbedding(values));

      return {
        embeddings,
        apiTimeMs,
        dimensions: embeddings[0]?.length || 0,
      };
    } catch (error: any) {
      if (attempt < EMBEDDING.MAX_RETRIES && isRetryableError(error)) {
        const delay = EMBEDDING.RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        logger.warn(
          `Embedding batch retry ${attempt}/${EMBEDDING.MAX_RETRIES} in ${delay}ms: ${error.message}`,
        );
        await sleep(delay);
        return this.generateBatchEmbeddings(texts, { attempt: attempt + 1 });
      }

      throw error;
    }
  },

  // Save generated embeddings to the database.
  async saveEmbeddings(updates: any[]) {
    const dbStarted = Date.now();
    const result = await chunkRepository.bulkUpdateEmbeddings(updates);
    return {
      modifiedCount: result?.modifiedCount ?? updates.length,
      dbTimeMs: Date.now() - dbStarted,
    };
  },

  // Generate and save embeddings for a document.
  async embedDocument({
    documentId,
    jobId,
  }: {
    documentId: string;
    jobId: string | undefined;
  }) {
    const startedAt = Date.now();

    workerLogger.info({
      documentId,
      jobId,
      status: DOCUMENT_STATUS.GENERATING_EMBEDDINGS,
      message: 'Embedding Started',
    });

    await documentRepository.updateById(documentId, {
      status: DOCUMENT_STATUS.GENERATING_EMBEDDINGS,
      failureReason: null,
    });

    const pending = await chunkRepository.findWithoutEmbeddings(documentId);
    const totalChunks = await chunkRepository.countByDocumentId(documentId);

    if (totalChunks === 0) {
      const error = new Error('No chunks available for embedding') as Error & {
        code?: string;
      };
      error.code = 'NO_CHUNKS';
      throw error;
    }

    if (pending.length === 0) {
      workerLogger.info({
        documentId,
        jobId,
        status: DOCUMENT_STATUS.EMBEDDED,
        message: 'All chunks already embedded — skipping API calls',
      });

      await documentRepository.updateById(documentId, {
        status: DOCUMENT_STATUS.EMBEDDED,
        embeddedChunkCount: totalChunks,
      });

      return {
        chunks: totalChunks,
        embedded: totalChunks,
        remaining: 0,
        skipped: true,
        executionTimeMs: Date.now() - startedAt,
      };
    }

    const batchSize = EMBEDDING.BATCH_SIZE;
    const totalBatches = Math.ceil(pending.length / batchSize);
    let embeddedNow = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
      const batch = pending.slice(
        batchIndex * batchSize,
        batchIndex * batchSize + batchSize,
      );

      workerLogger.info({
        documentId,
        jobId,
        status: DOCUMENT_STATUS.GENERATING_EMBEDDINGS,
        message: `Batch Number=${batchIndex + 1}/${totalBatches} Batch Size=${batch.length}`,
      });

      const { embeddings, apiTimeMs, dimensions } =
        await this.generateBatchEmbeddings(batch.map((c) => c.chunkText));

      const embeddedAt = new Date();
      const updates = batch.map((chunk, index) => ({
        chunkId: chunk._id,
        embedding: embeddings[index],
        embeddingModel: getEmbeddingModelName(),
        embeddingDimensions: dimensions,
        embeddedAt,
        embeddingVersion: EMBEDDING.VERSION,
      }));

      const { dbTimeMs, modifiedCount } = await this.saveEmbeddings(updates);
      embeddedNow += modifiedCount;

      workerLogger.info({
        documentId,
        jobId,
        status: DOCUMENT_STATUS.GENERATING_EMBEDDINGS,
        message: `API Time=${apiTimeMs}ms Database Time=${dbTimeMs}ms Embedding Dimensions=${dimensions}`,
      });
    }

    const embeddedCount =
      await chunkRepository.countEmbeddedByDocumentId(documentId);
    const remaining = Math.max(totalChunks - embeddedCount, 0);

    if (remaining > 0) {
      const error = new Error(
        `Embedding incomplete: embedded=${embeddedCount} remaining=${remaining}`,
      ) as Error & {
        code?: string;
      };
      error.code = 'INCOMPLETE_EMBEDDINGS';
      throw error;
    }

    await documentRepository.updateById(documentId, {
      status: DOCUMENT_STATUS.EMBEDDED,
      embeddedChunkCount: embeddedCount,
    });

    const executionTimeMs = Date.now() - startedAt;

    workerLogger.success({
      documentId,
      jobId,
      status: DOCUMENT_STATUS.EMBEDDED,
      executionTimeMs,
      message: `Embedding Completed embedded=${embeddedCount}`,
    });

    return {
      chunks: totalChunks,
      embedded: embeddedCount,
      remaining: 0,
      embeddedNow,
      executionTimeMs,
    };
  },

  // Get embedding progress for a document. 
  async getEmbeddingStatus(documentId: string) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
    }

    const chunks = await chunkRepository.countByDocumentId(documentId);
    const embedded = await chunkRepository.countEmbeddedByDocumentId(documentId);
    const remaining = Math.max(chunks - embedded, 0);
    const progressPercentage =
      chunks === 0 ? 0 : Number(((embedded / chunks) * 100).toFixed(2));

    return {
      chunks,
      embedded,
      remaining,
      progressPercentage,
      status: document.status,
      embeddingModel: getEmbeddingModelName(),
      embeddingVersion: EMBEDDING.VERSION,
    };
  },
};

export default embeddingService;