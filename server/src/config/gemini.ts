import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {env} from './env.js';
import { CHAT } from '../constants/index.js';
import logger from '../utils/logger.js';

let genAI: GoogleGenerativeAI | null = null;
let embeddingModel: GenerativeModel | null = null;
let chatModel: GenerativeModel | null = null;

// Initialize reusable Gemini clients.
export const initGemini = () => {
  if (!genAI) {
    if (!env.geminiApi || env.geminiApi === 'your_gemini_api_key_here') {
      logger.warn(
        'GEMINI_API_KEY is missing or still a placeholder. Gemini features will fail until configured.',
      );
    }

    genAI = new GoogleGenerativeAI(env.geminiApi);
  }

  if (!embeddingModel) {
    embeddingModel = genAI.getGenerativeModel({
      model: env.geminiEmbeddingModel,
    });
    logger.info(
      `Gemini embedding client ready (model=${env.geminiEmbeddingModel})`,
    );
  }

  if (!chatModel) {
    chatModel = genAI.getGenerativeModel({
      model: env.geminiChatModel,
      generationConfig: {
        temperature: CHAT.TEMPERATURE,
        topP: CHAT.TOP_P,
        maxOutputTokens: CHAT.MAX_CHAT_TOKENS,
      },
    });
    logger.info(`Gemini chat client ready (model=${env.geminiChatModel})`);
  }

  return { embeddingModel, chatModel };
};

// Get the Gemini embedding model.
export const getGeminiEmbeddingModel = () => {
  if (!embeddingModel) {
    initGemini();
  }

  return embeddingModel;
};

// Get the Gemini chat model.
export const getGeminiChatModel = () => {
  if (!chatModel) {
    initGemini();
  }

  return chatModel;
};

// Get the configured chat model name.
export const getChatModelName = () => env.geminiChatModel;

// Get the configured embedding model name.
export const getEmbeddingModelName = () => env.geminiEmbeddingModel;

// Get the reusable Gemini client.
export const getGeminiClient = () => {
  if (!genAI) {
    initGemini();
  }

  return genAI;
};

export default {
  initGemini,
  getGeminiEmbeddingModel,
  getGeminiChatModel,
  getChatModelName,
  getEmbeddingModelName,
  getGeminiClient,
};