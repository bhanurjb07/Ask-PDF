import chunkRepository from '../repositories/chunk.repository.js';
import documentRepository from '../repositories/document.repository.js';
import {splitIntoChunks,calculateStatistics,normalizeText}from '../utils/chunker.js';
import { CHUNKING, DOCUMENT_STATUS } from '../constants/index.js';
import workerLogger from '../utils/workerLogger.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const PREVIEW_LENGTH = 160;

const chunkService = {
  // Process and save document chunks.
  async chunkDocument({
    documentId,
    rawText,
    pageCount,
    jobId,
  }: {
    documentId: string;
    rawText: string;
    pageCount: number | null;
    jobId: string | undefined;
  }) {
    const startedAt = Date.now();

    workerLogger.info({
      documentId,
      jobId,
      status: DOCUMENT_STATUS.CHUNKING,
      message: `Chunking Started size=${CHUNKING.CHUNK_SIZE_WORDS} overlap=${CHUNKING.OVERLAP_WORDS}`,
    });

    await documentRepository.updateById(documentId, {
      status: DOCUMENT_STATUS.CHUNKING,
      failureReason: null,
    });

    // Idempotent re-runs: clear previous chunks first.
    await chunkRepository.deleteByDocumentId(documentId);

    try {
      if (!rawText || !normalizeText(rawText)) {
        const error = new Error('Extracted text is missing for chunking') as Error & {
          code?: string;
        };
        error.code = 'NO_TEXT_FOR_CHUNKING';
        throw error;
      }

      const chunks = splitIntoChunks(rawText, {
        chunkSizeWords: CHUNKING.CHUNK_SIZE_WORDS,
        overlapWords: CHUNKING.OVERLAP_WORDS,
        pageCount,
      });

      const stats = calculateStatistics(chunks);

      workerLogger.info({
        documentId,
        jobId,
        status: DOCUMENT_STATUS.CHUNKING,
        message: `Chunk Count=${stats.chunkCount}`,
      });

      const docs = chunks.map((chunk) => ({
        documentId,
        ...chunk,
      }));

      await chunkRepository.insertMany(docs);

      workerLogger.info({
        documentId,
        jobId,
        status: DOCUMENT_STATUS.CHUNKED,
        message: `Chunks Saved count=${docs.length}`,
      });

      await documentRepository.updateById(documentId, {
        status: DOCUMENT_STATUS.CHUNKED,
        chunkCount: stats.chunkCount,
      });

      const processingTimeMs = Date.now() - startedAt;

      workerLogger.success({
        documentId,
        jobId,
        status: DOCUMENT_STATUS.CHUNKED,
        executionTimeMs: processingTimeMs,
        message: 'Chunking Completed',
      });

      return {
        ...stats,
        processingTimeMs,
      };
    } catch (error: any) {
      logger.error(
        `Chunking failed documentId=${documentId}: ${error.message}\n${error.stack || ''}`,
      );

      // Remove partial inserts to avoid orphan / half-written chunk sets.
      try {
        await chunkRepository.deleteByDocumentId(documentId);
      } catch (cleanupError: any) {
        logger.warn(`Chunk cleanup failed: ${cleanupError.message}`);
      }

      await documentRepository.updateById(documentId, {
        status: DOCUMENT_STATUS.FAILED,
        failureReason: error.message || 'Chunking failed',
        chunkCount: 0,
      });

      throw error;
    }
  },

  // Get paginated chunks for a document.
  async getChunksByDocument(
    documentId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
  ) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Document not found');
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, chunks] = await Promise.all([
      chunkRepository.countByDocumentId(documentId),
      chunkRepository.findByDocumentId(documentId, {
        skip,
        limit: safeLimit,
      }),
    ]);

    return {
      documentId,
      totalChunks: total,
      page: safePage,
      limit: safeLimit,
      totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      chunks: chunks.map((chunk) => ({
        id: chunk._id,
        chunkIndex: chunk.chunkIndex,
        preview:
          chunk.chunkText.length > PREVIEW_LENGTH
            ? `${chunk.chunkText.slice(0, PREVIEW_LENGTH)}...`
            : chunk.chunkText,
        wordCount: chunk.wordCount,
        characterCount: chunk.characterCount,
        startWord: chunk.startWord,
        endWord: chunk.endWord,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        tokenEstimate: chunk.tokenEstimate,
        createdAt: chunk.createdAt,
        updatedAt: chunk.updatedAt,
      })),
    };
  },

  // Delete all chunks for a document.
  async deleteChunksForDocument(documentId: string) {
    const result = await chunkRepository.deleteByDocumentId(documentId);
    return {
      deletedCount: result?.deletedCount || 0,
    };
  },
};

export default chunkService;