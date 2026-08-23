import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS, RETRIEVAL } from '../constants/index.js';

// Validate chat request body.
export const validateChatBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const { documentId, question } = req.body || {};

  if (!documentId) {
    next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'documentId is required'));
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid document id'));
    return;
  }

  if (question === undefined || question === null || String(question).trim() === '') {
    next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'question is required'));
    return;
  }

  const trimmed = String(question).trim();

  if (trimmed.length > RETRIEVAL.QUESTION_MAX_LENGTH) {
    next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `question must be at most ${RETRIEVAL.QUESTION_MAX_LENGTH} characters`,
      ),
    );
    return;
  }

  req.body.documentId = documentId;
  req.body.question = trimmed;
  next();
};

// Validate document ID route parameter.
export const validateDocumentIdParam = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const documentId = String(req.params.documentId);

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid document id'));
    return;
  }

  next();
};

export default validateChatBody;