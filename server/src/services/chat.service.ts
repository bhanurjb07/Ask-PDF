import { Response } from 'express';
import mongoose from 'mongoose';
import retrievalService from './retrieval.service.js';
import chatRepository from '../repositories/chat.repository.js';
import {getChatModelName,getGeminiChatModel,initGemini} from '../config/gemini.js';
import { buildRagPrompt } from '../prompts/rag.prompt.js';
import { initSse, sendSseEvent, closeSse } from './streaming.service.js';
import { CHAT, HTTP_STATUS } from '../constants/index.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

// Wait before retrying a Gemini request.
const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

// Check if a Gemini error can be retried.
const isRetryableGeminiError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const status = error?.status || error?.statusCode;

  // Quota exhaustion resets on a minute/day window, far longer than a request
  // can wait, so retrying inline only delays the error the user needs to see.
  if (status === 429 || message.includes('quota')) {
    return false;
  }

  if (status === 500 || status === 503) {
    return true;
  }

  return (
    message.includes('timeout') ||
    message.includes('temporarily') ||
    message.includes('fetch failed') ||
    message.includes('econnreset')
  );
};

// Check whether the error is related to Gemini quota limits.
const isQuotaError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    (error?.status || error?.statusCode) === 429 ||
    message.includes('quota') ||
    message.includes('too many requests')
  );
};

// Convert Gemini errors into short client-friendly messages.
const toClientErrorMessage = (error: any) => {
  if (isQuotaError(error)) {
    return `${CHAT.QUOTA_MESSAGE} (model: ${getChatModelName()})`;
  }

  if (error?.code === 'GEMINI_TIMEOUT') {
    return 'Gemini took too long to respond. Please try again.';
  }

  if ((error?.status || error?.statusCode) === 404) {
    return `Gemini model "${getChatModelName()}" is not available for this API key. Set GEMINI_CHAT_MODEL to a supported model.`;
  }

  const message = String(error?.message || 'Chat failed');
  return message.length > 300 ? `${message.slice(0, 300)}...` : message;
};

// Convert retrieved chunks into response metadata.
const toRetrievedMeta = (chunks: any[] = []) =>
  chunks.map((chunk) => ({
    chunkIndex: chunk.chunkIndex,
    similarity: chunk.similarity,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    preview:
      String(chunk.text || '').length > 160
        ? `${String(chunk.text).slice(0, 160)}...`
        : chunk.text,
  }));

// RAG chat orchestration — retrieve → prompt → Gemini stream → persist.
const chatService = {
  // Stream a RAG response for a document question.
  async streamChat({
    documentId,
    question,
    res,
  }: {
    documentId: string;
    question: string;
    res: Response;
  }) {
    const startedAt = Date.now();

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid document id');
    }

    const cleanQuestion = retrievalService.validateQuestion(question);

    logger.info(`Chat question received documentId=${documentId}`);
    initSse(res);
    sendSseEvent(res, 'status', { stage: 'started' });

    let clientClosed = false;
    res.on('close', () => {
      clientClosed = true;
    });

    try {
      const retrieval = await retrievalService.retrieveRelevantChunks({
        documentId,
        question: cleanQuestion,
        topK: env.topKResults,
        threshold: env.similarityThreshold,
      });

      logger.info(
        `Retrieval completed documentId=${documentId} results=${retrieval.results.length}`,
      );
      sendSseEvent(res, 'status', {
        stage: 'retrieval_completed',
        matched: retrieval.results.length,
      });

      // Hallucination prevention: no relevant chunks → do not call Gemini.
      if (!retrieval.results.length) {
        const answer = CHAT.NO_CONTEXT_MESSAGE;
        sendSseEvent(res, 'token', { text: answer });
        sendSseEvent(res, 'done', {
          answer,
          usedGemini: false,
          retrievedChunks: [],
        });

        await chatRepository.create({
          documentId,
          question: cleanQuestion,
          answer,
          retrievedChunks: [],
          responseTime: Date.now() - startedAt,
          model: null,
          usedGemini: false,
        });

        logger.success(
          `Chat completed without Gemini documentId=${documentId} timeMs=${Date.now() - startedAt}`,
        );
        closeSse(res);
        return;
      }

      const prompt = buildRagPrompt({
        question: cleanQuestion,
        chunks: retrieval.results,
      });

      logger.info(
        `Prompt built documentId=${documentId} contextTokens≈${prompt.estimatedContextTokens}`,
      );
      sendSseEvent(res, 'status', {
        stage: 'prompt_built',
        contextChunks: prompt.contextChunks.length,
      });

      initGemini();
      const model = getGeminiChatModel();

      logger.info(`Gemini request started documentId=${documentId}`);
      sendSseEvent(res, 'status', { stage: 'streaming_started' });

      let answer = '';
      let tokenUsage: {
        promptTokens: number | null;
        candidatesTokens: number | null;
        totalTokens: number | null;
      } | null = null;
      let attempt = 1;
      let streamResult: any = null;

      while (attempt <= CHAT.MAX_RETRIES) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('Gemini stream timed out') as Error & {
                code?: string;
              };
              error.code = 'GEMINI_TIMEOUT';
              reject(error);
            }, CHAT.STREAM_TIMEOUT_MS);
          });

          streamResult = await Promise.race([
            model.generateContentStream({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt.userPrompt }],
                },
              ],
              systemInstruction: prompt.systemInstruction,
            }),
            timeoutPromise,
          ]);

          break;
        } catch (error: any) {
          if (attempt < CHAT.MAX_RETRIES && isRetryableGeminiError(error)) {
            const delay = CHAT.RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
            logger.warn(
              `Gemini chat retry ${attempt}/${CHAT.MAX_RETRIES} in ${delay}ms: ${error.message}`,
            );
            await sleep(delay);
            attempt += 1;
            continue;
          }

          throw error;
        }
      }

      for await (const chunk of streamResult.stream) {
        if (clientClosed) {
          break;
        }

        const text = chunk?.text?.() || '';
        if (!text) {
          continue;
        }

        answer += text;
        sendSseEvent(res, 'token', { text });
      }

      const aggregated = await streamResult.response;
      const usage = aggregated?.usageMetadata;
      if (usage) {
        tokenUsage = {
          promptTokens: usage.promptTokenCount ?? null,
          candidatesTokens: usage.candidatesTokenCount ?? null,
          totalTokens: usage.totalTokenCount ?? null,
        };
      }

      if (!answer.trim()) {
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Gemini returned an empty response',
        );
      }

      logger.info(`Gemini response completed documentId=${documentId}`);

      const responseTime = Date.now() - startedAt;
      const retrievedMeta = toRetrievedMeta(prompt.contextChunks);

      await chatRepository.create({
        documentId,
        question: cleanQuestion,
        answer,
        retrievedChunks: retrievedMeta,
        responseTime,
        tokenUsage,
        model: getChatModelName(),
        usedGemini: true,
      });

      sendSseEvent(res, 'done', {
        answer,
        usedGemini: true,
        retrievedChunks: retrievedMeta,
        responseTime,
        tokenUsage,
      });

      logger.success(
        `Streaming completed documentId=${documentId} timeMs=${responseTime}`,
      );
      closeSse(res);
    } catch (error: any) {
      logger.error(
        `Chat failed documentId=${documentId}: ${error.message}\n${error.stack || ''}`,
      );

      // Prefer a clean error event over a corrupted partial stream ending.
      sendSseEvent(res, 'error', {
        message: toClientErrorMessage(error),
        code: isQuotaError(error) ? 'GEMINI_QUOTA_EXCEEDED' : undefined,
      });
      closeSse(res);
    }
  },

  // Get paginated chat history for a document.
  async getHistory(
    documentId: string,
    { page = 1, limit = 50 }: { page?: number; limit?: number } = {},
  ) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid document id');
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const items = await chatRepository.findByDocumentId(documentId, {
      skip,
      limit: safeLimit,
    });

    return {
      documentId,
      page: safePage,
      limit: safeLimit,
      items: items.map((item) => ({
        id: item._id,
        question: item.question,
        answer: item.answer,
        retrievedChunks: item.retrievedChunks,
        responseTime: item.responseTime,
        tokenUsage: item.tokenUsage,
        model: item.model,
        usedGemini: item.usedGemini,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  },

  // Delete all chat history for a document.
  async deleteHistory(documentId: string) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid document id');
    }

    const result = await chatRepository.deleteByDocumentId(documentId);
    return {
      documentId,
      deletedCount: result?.deletedCount || 0,
    };
  },
};

export default chatService;