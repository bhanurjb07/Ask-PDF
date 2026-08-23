import mongoose from 'mongoose';
import embeddingService from './embedding.service.js';
import documentRepository from '../repositories/document.repository.js';
import chunkRepository from '../repositories/chunk.repository.js';
import { cosineSimilarity } from '../utils/vector.utils.js';
import {DOCUMENT_STATUS,EMBEDDING,HTTP_STATUS,RETRIEVAL,}from '../constants/index.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

type ScoredChunk = {
  chunkIndex: number;
  similarity: number;
  pageStart?: number | null;
  pageEnd?: number | null;
  wordCount?: number;
  text: string;
};

type RankOptions = {
  topK: number;
  threshold: number;
};

type RetrieveRelevantChunksOptions = {
  documentId: string;
  question: string;
  topK?: number;
  threshold?: number;
};


//  Semantic retrieval for a single document's chunks.
//  Does not generate answers — ranking only.
 
const retrievalService ={
  async generateQuestionEmbedding(question: string): Promise<number[]>{
    return embeddingService.generateEmbedding(question, {
      taskType: EMBEDDING.QUERY_TASK_TYPE,
    });
  },

  calculateSimilarity(
    questionEmbedding: number[],
    chunkEmbedding: number[],
  ): number {
    return cosineSimilarity(questionEmbedding, chunkEmbedding);
  },

  rankChunks(
    scoredChunks: ScoredChunk[],
    { topK, threshold }: RankOptions,
  ): ScoredChunk[] {
    return scoredChunks
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  },

  validateQuestion(question: string): string {
    if (question === undefined || question === null || question.trim() === '') {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Question is required',
      );
    }

    const trimmed = question.trim();

    if (trimmed.length < RETRIEVAL.QUESTION_MIN_LENGTH) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Question must be at least ${RETRIEVAL.QUESTION_MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > RETRIEVAL.QUESTION_MAX_LENGTH) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Question must be at most ${RETRIEVAL.QUESTION_MAX_LENGTH} characters`,
      );
    }

    return trimmed;
  },

  async retrieveRelevantChunks({
    documentId,
    question,
    topK = RETRIEVAL.TOP_K_RESULTS,
    threshold = RETRIEVAL.SIMILARITY_THRESHOLD,
  }: RetrieveRelevantChunksOptions){
    const startedAt = Date.now();

    const cleanQuestion=this.validateQuestion(question);

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid document id',
      );
    }

    logger.info(`Question received documentId=${documentId}`);

    const document = await documentRepository.findById(documentId);

    if (!document){
      throw new ApiError(HTTP_STATUS.NOT_FOUND,
        'Document not found',
      );
    }

    const embeddedCount =
      await chunkRepository.countEmbeddedByDocumentId(documentId);

    if(embeddedCount === 0 ||
      ![
        DOCUMENT_STATUS.EMBEDDED,DOCUMENT_STATUS.COMPLETED,
      ].includes(document.status)
    ){
      // Still allow search if embeddings exist even if status briefly differs.
      if (embeddedCount === 0) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'No embeddings available for this document. Wait until processing completes.',
        );
      }
    }

    const questionEmbedding =await this.generateQuestionEmbedding(cleanQuestion);
    logger.info(
      `Embedding generated documentId=${documentId} dims=${questionEmbedding.length}`,
    );

    const chunks =await chunkRepository.findEmbeddedByDocumentId(documentId);

    if(!chunks.length){
      throw new ApiError(HTTP_STATUS.BAD_REQUEST,
        'No embeddings available for this document. Wait until processing completes.',
      );
    }

    const scored: ScoredChunk[]=[];

    for(const chunk of chunks){
      if(!Array.isArray(chunk.embedding) ||
        chunk.embedding.length === 0
      ){
        continue;
      }

      if(chunk.embedding.length !== questionEmbedding.length) {
        logger.warn(
          `Skipping chunkIndex=${chunk.chunkIndex} due to dimension mismatch ` +
            `(${chunk.embedding.length} vs ${questionEmbedding.length})`,
        );
        continue;
      }

      try{
        const similarity = this.calculateSimilarity(questionEmbedding,chunk.embedding);

        scored.push({
          chunkIndex: chunk.chunkIndex,
          similarity: Number(similarity.toFixed(6)),
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          wordCount: chunk.wordCount,
          text: chunk.chunkText,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);

        logger.warn(
          `Similarity skipped chunkIndex=${chunk.chunkIndex}: ${message}`,
        );
      }
    }

    logger.info(
      `Similarity calculated documentId=${documentId} candidates=${scored.length}`,
    );

    const safeTopK = Math.min(
      Math.max(Number(topK) || RETRIEVAL.TOP_K_RESULTS, 1),
      20,
    );

    const safeThreshold = Number(threshold);

    const finalThreshold = Number.isFinite(safeThreshold)
      ? safeThreshold
      : RETRIEVAL.SIMILARITY_THRESHOLD;

    const ranked = this.rankChunks(scored, {
      topK: safeTopK,
      threshold: finalThreshold,
    });

    logger.info(
      `Chunks ranked documentId=${documentId} matched=${ranked.length} topK=${safeTopK}`,
    );

    const executionTimeMs = Date.now() - startedAt;

    logger.success(
      `Retrieval completed documentId=${documentId} results=${ranked.length} timeMs=${executionTimeMs}`,
    );

    if (!ranked.length) {
      return {
        question: cleanQuestion,
        documentId,
        topK: safeTopK,
        threshold: finalThreshold,
        message: 'No relevant context found.',
        results: [],
        executionTimeMs,
      };
    }

    return {
      question: cleanQuestion,
      documentId,
      topK: safeTopK,
      threshold: finalThreshold,
      results: ranked,
      executionTimeMs,
    };
  },
};

export default retrievalService;