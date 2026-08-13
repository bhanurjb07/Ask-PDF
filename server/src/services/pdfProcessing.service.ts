import documentRepository from '../repositories/document.repository.js'
import { DOCUMENT_STATUS } from '../constants/index.js';
import workerLogger from '../utils/workerLogger.js';



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

                    
        }catch(error){}

    }
}

export default pdfProcessingService;