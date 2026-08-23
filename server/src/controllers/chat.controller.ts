import type{ Request, Response } from 'express';
import chatService from '../services/chat.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

// Thin HTTP adapters for RAG chat + history.
const chatController = {
  // Stream a chat response.
  chat: asyncHandler(async (req: Request, res: Response) => {
    const { documentId, question } = req.body;
    await chatService.streamChat({ documentId, question, res });
  }),

  // Get chat history for a document.
  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await chatService.getHistory(String(req.params.documentId), {
      page: req.query.page ? Number(req.query.limit) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, history, 'Chat history fetched successfully'));
  }),

  // Delete chat history for a document.
  deleteHistory: asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.deleteHistory(String(req.params.documentId));

    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, result, 'Chat history deleted successfully'));
  }),
};

export default chatController;