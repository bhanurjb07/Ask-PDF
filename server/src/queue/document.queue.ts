import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/index.js';
import { createBullmqConnection } from '../config/bullmqRedis.js';
import logger from '../utils/logger.js';


interface DocumentProcessingJobData {
    documentId: string;
    filePath: string;
    storedName: string;
    createdAt?: string;
}

//creates the connection to the queue's storage/server(redish)
const connection = createBullmqConnection('BullMQ Queue');


export const documentQueue = new Queue<DocumentProcessingJobData>(QUEUE_NAMES.DOCUMENT_PROCESSING,{
        connection,

        defaultJobOptions:{
            // Try each job up to 3 times if processing fails.
            attempts: 3,

            // Wait before retrying a failed job.
            backoff:{
                type: 'exponential',
                delay: 2000,
            },

            // Remove completed jobs after 1 hour,
            // while keeping at most 1000 completed jobs.
            removeOnComplete: {
                age: 3600,
                count: 1000,
            },

            //Remove failed jobs after 24 hours,
            //while keeping at most 5000 failed jobs.
            removeOnFail: {
                age: 24 * 3600,
                count: 5000,
            },
        },
    },
);

//add a document-processing job to the queue
export const addDocumentProcessingJob = async({
    documentId,
    filePath,
    storedName,
    createdAt = new Date().toISOString(),
}: DocumentProcessingJobData) =>{
    //puttting a job into the queue
    const job = await documentQueue.add(                 ///queue.add(name, data, opts?)       
        JOB_NAMES.PROCESS_DOCUMENT,
        {
            documentId,
            filePath,
            storedName,
            createdAt,
        },
        {
            jobId: `document-${documentId}`,
        },
    );

    logger.info(`Job Added: id=${job.id} documentId=${documentId}`);

    return job;
};

//shut down the queue promperly
export const closeDocumentQueue =async ()=>{
    await documentQueue.close();
    await connection.quit();
    logger.info('Document processing queue closed');
};