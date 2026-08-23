import documentRepository from '../repositories/document.repository.js'
import { DOCUMENT_STATUS } from '../constants/index.js';
import workerLogger from '../utils/workerLogger.js';
import embeddingService from './embedding.service.js';
import { parsePdfFile } from '../utils/pdfParser.js';
import chunkService from './chunk.service.js';
import logger from '../utils/logger.js';

interface ProcessDocumentParams{
  documentId: string;
  filePath: string;
  storedName: string;
  jobId: string;
}

//error handle in uploaded pdf
const failureMessageFromCode = (code: string, fallback?: string): string => {
  switch(code){
    case 'ENCRYPTED_PDF':
      return 'Encrypted PDFs are not supported';
    case 'EMPTY_PDF':
      return 'PDF file is empty';
    case 'ZERO_PAGES':
      return 'PDF has zero pages';
    case 'NO_TEXT':
      return 'PDF has no readable text';
    case 'CORRUPTED_PDF':
      return 'PDF is corrupted or unsupported';
    case 'UNSAFE_PATH':
      return 'Invalid file path';
    case 'FILE_TOO_LARGE':
      return 'PDF exceeds maximum allowed size';
    case 'UNSUPPORTED_FILE':
      return 'Unsupported file type';
    case 'NO_TEXT_FOR_CHUNKING':
      return 'Extracted text is missing for chunking';
    case 'INVALID_OVERLAP':
      return 'Invalid chunk overlap configuration';
    case 'EMPTY_CHUNKS':
      return 'Chunking produced no chunks';
    case 'EMPTY_CHUNK':
      return 'Cannot embed empty chunk text';
    case 'EMPTY_EMBEDDING':
      return 'Embedding API returned an empty vector';
    case 'NO_CHUNKS':
      return 'No chunks available for embedding';
    case 'INCOMPLETE_EMBEDDINGS':
      return 'Embedding generation incomplete';
    case 'BATCH_SIZE_MISMATCH':
      return 'Embedding batch response size mismatch';
    default:
      return fallback || 'PDF processing failed';
  }
};

const pdfProcessingService={
    async processDocument({documentId,filePath,storedName,jobId}: ProcessDocumentParams){
        const startedAt = Date.now();
        const processingStartedAt= new Date();

        workerLogger.info({documentId,jobId,status: DOCUMENT_STATUS.PROCESSING,message: 'Worker Started'});

        await documentRepository.updateById(documentId, {status: DOCUMENT_STATUS.PROCESSING,
           processingStartedAt,
           failureReason: null,
        });

        try{
            //PDF is ready to be processed
            workerLogger.info({documentId,jobId, status: DOCUMENT_STATUS.PROCESSING,
                    message: `PDF Loaded path validated for ${storedName}`});

            const parsed = await parsePdfFile(filePath);

            await documentRepository.updateById(documentId, {
              rawText: parsed.rawText,
              pageCount: parsed.pageCount,
              wordCount: parsed.wordCount,
              characterCount: parsed.characterCount,
              averageWordsPerPage: parsed.averageWordsPerPage,
              pdfMetadata: parsed.metadata,
              status: DOCUMENT_STATUS.TEXT_EXTRACTED,
            });

            workerLogger.info({documentId,jobId, status: DOCUMENT_STATUS.TEXT_EXTRACTED,
              message: 'Mongo Updated (TEXT_EXTRACTED)',
            });

            const chunkResult = await chunkService.chunkDocument({documentId,
              rawText: parsed.rawText,
              pageCount: parsed.pageCount,
              jobId
            });

            const embedResult = await embeddingService.embedDocument({documentId,jobId});
            const processingCompletedAt = new Date();
            const processingDuration = Date.now() - startedAt;

            await documentRepository.updateById(documentId, {
              status: DOCUMENT_STATUS.COMPLETED,
              processingCompletedAt,
              processingDuration,
              failureReason: null,
              embeddedChunkCount: embedResult.embedded,
            });

            workerLogger.success({documentId, jobId,
              status: DOCUMENT_STATUS.COMPLETED,
              executionTimeMs: processingDuration,
              message: `Worker Completed chunks=${chunkResult.chunkCount} embedded=${embedResult.embedded}`,
            });

            return {
              documentId,
              status: DOCUMENT_STATUS.COMPLETED,
              pageCount: parsed.pageCount,
              wordCount: parsed.wordCount,
              chunkCount: chunkResult.chunkCount,
              embeddedChunkCount: embedResult.embedded,
              executionTimeMs: processingDuration,
            };
                    
        }catch(error:unknown){
          const err =error instanceof Error ? error : new Error(String(error));
          const reason = failureMessageFromCode((error as { code:any}).code,
            err.message
          );

          const processingCompletedAt = new Date();
          const processingDuration = Date.now() - startedAt;

          logger.error(`PDF processing failed documentId=${documentId}: ${reason}\n${err.stack || ''}`);

          workerLogger.error({
            documentId,
            jobId,
            status: DOCUMENT_STATUS.FAILED,
            executionTimeMs: processingDuration,
          });

            // Keep chunks on embedding failures so retries can skip already-embedded chunks.
            // Chunk service already cleans partial inserts if chunking itself fails.

          await documentRepository.updateById(documentId, {
            status: DOCUMENT_STATUS.FAILED,
            failureReason: reason,
            processingCompletedAt,
            processingDuration,
          });

        }

    }
}

export default pdfProcessingService;