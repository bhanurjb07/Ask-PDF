import { Queue } from 'bullmq';


interface DocumentProcessingJobData {
    documentId: string;
    filePath: string;
    storedName: string;
    createdAt?: string;
}

export const dDocumentQueue = new Queue<DocumentProcessingJobData>(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    {
        connection: connection,

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


interface DocumentProcessingJobData {
    documentId: string;
    filePath: string;
    storedName: string;
    createdAt?: string;
}

export const addDocumentProcessingJob = async({
    documentId,
    filePath,
    storedName,
    createdAt = new Date().toISOString(),
}: DocumentProcessingJobData) =>{
    const job = await documentQueue.add(
        JOB_NAMES.PROCESS_DOCUMENT,
        {
            documentId: String(documentId),
            filePath,
            storedName,
            createdAt,
        },
        {
            jobId: `document-${documentId}`,
        },
    );

    logger.info(
        `Job Added: id=${job.id} documentId=${documentId}`,
    );

    return job;
};