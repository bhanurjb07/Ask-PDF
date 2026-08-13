import { Router, Request, Response, NextFunction } from 'express';
import documentController from '../controllers/document.controller.js';
import { uploadPdf, handleUploadError } from '../middleware/upload.middleware.js';
import {validateObjectId,validateUploadedFile} from '../validators/document.validator.js';

const router = Router();

// Upload a new PDF document
router.post('/upload',
  (req: Request, res: Response, next: NextFunction) =>{
    uploadPdf(req, res, (error) => handleUploadError(error, req, res, next));
  },
  validateUploadedFile,
  documentController.uploadDocument,
);

// Get all documents
router.get('/', documentController.getDocuments);

// Get document processing status
router.get('/:id/status', validateObjectId,
  documentController.getDocumentStatus,
);

//get extracted document text
router.get('/:id/text', validateObjectId,
  documentController.getDocumentText,
);

//Get document embedding status
router.get('/:id/embeddings/status', validateObjectId,
  documentController.getDocumentEmbeddingsStatus,
);

// Get document chunks
router.get('/:id/chunks',
  validateObjectId,
  documentController.getDocumentChunks,
);

// Get a document by ID
router.get('/:id', validateObjectId, documentController.getDocumentById);

// Delete a document
router.delete('/:id', validateObjectId, documentController.deleteDocument);

export default router;