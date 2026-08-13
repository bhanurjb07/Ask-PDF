import { Worker } from 'bullmq';
import { createBullmqConnection } from '../config/bullmqRedis.js';
import documentRepository from '../repositories/document.repository.js';
import pdfProcessingService from '../services/pdfProcessing.service.js';
import { DOCUMENT_STATUS, QUEUE_NAMES } from '../constants/index.js';
import workerLogger from '../utils/workerLogger.js';
import logger from '../utils/logger.js';

let worker: Worker | null = null;
let connection: any = null;


 //Background processor for document-processing jobs.
 // Worker errors must never crash the Express process.
export const startDocumentWorker = () =>{
  if (worker) {
    return worker;
  }

  connection = createBullmqConnection('BullMQ Worker');

  worker = new Worker(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    async (job) => {
      const { documentId, filePath, storedName } = job.data;

      return pdfProcessingService.processDocument({
        documentId,
        filePath,
        storedName,
        jobId: job.id,
      });
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on('active', (job) => {
    workerLogger.info({
      documentId: job.data?.documentId,
      jobId: job.id,
      status: 'ACTIVE',
      message: 'Job became active',
    });
  });

  worker.on('completed', (job, result) => {
    workerLogger.success({
      documentId: job.data?.documentId,
      jobId: job.id,
      status: DOCUMENT_STATUS.COMPLETED,
      executionTimeMs: result?.executionTimeMs,
      message: 'Job completed event',
    });
  });

  worker.on('failed', async (job, error) => {
    const documentId = job?.data?.documentId;
    const attempts = job?.opts?.attempts || 3;
    const attemptsMade = job?.attemptsMade || 0;

    workerLogger.error({
      documentId,
      jobId: job?.id,
      status: DOCUMENT_STATUS.FAILED,
      message: `Job failed (${attemptsMade}/${attempts}): ${error.message}`,
    });

    if (documentId && attemptsMade >= attempts) {
      try {
        await documentRepository.updateById(documentId, {
          status: DOCUMENT_STATUS.FAILED,
          failureReason: error.message || 'PDF processing failed after retries',
        });
        workerLogger.error({
          documentId,
          jobId: job?.id,
          status: DOCUMENT_STATUS.FAILED,
          message: 'Document marked FAILED after retries exhausted',
        });
      } catch (updateError: any) {
        logger.error(`Failed to mark document FAILED: ${updateError.message}`);
      }
    } else {
      workerLogger.warn({
        documentId,
        jobId: job?.id,
        status: 'RETRY',
        message: 'Job will be retried with exponential backoff',
      });
    }
  });

  worker.on('error', (error) => {
    logger.error(`Document worker error (non-fatal): ${error.message}`);
  });

  logger.success('Document processing worker started');
  return worker;
};

export const stopDocumentWorker = async () => {
  if (worker) {
    await worker.close();
    worker = null;
  }

  if (connection) {
    await connection.quit();
    connection = null;
  }

  logger.info('Document processing worker stopped');
};

export default startDocumentWorker;