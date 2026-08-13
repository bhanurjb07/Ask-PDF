import { Request, Response } from 'express';
import retrievalService from '../services/retrieval.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS, RETRIEVAL } from '../constants/index.js';

// Handle semantic search requests.
const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { documentId, question, topK, threshold } = req.body;

    const data = await retrievalService.retrieveRelevantChunks({
      documentId,
      question,
      topK: topK ?? RETRIEVAL.TOP_K_RESULTS,
      threshold: threshold ?? RETRIEVAL.SIMILARITY_THRESHOLD,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          data,
          data.results?.length
            ? 'Relevant chunks retrieved successfully'
            : 'No relevant context found.',
        ),
      );
  }),
};

export default searchController;