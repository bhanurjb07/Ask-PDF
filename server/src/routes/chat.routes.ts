import { Router } from 'express';
import chatController from '../controllers/chat.controller.js';
import {validateChatBody,validateDocumentIdParam,} from '../validators/chat.validator.js';

const router = Router();

// Start RAG chat streaming
router.post('/', validateChatBody, chatController.chat);

// Get chat history
router.get('/history/:documentId',
  validateDocumentIdParam,
  chatController.getHistory,
);

// Delete chat history
router.delete('/history/:documentId',
  validateDocumentIdParam,
  chatController.deleteHistory,
);

export default router;