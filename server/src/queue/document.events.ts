import { QueueEvents } from 'bullmq';
import { createBullmqConnection } from '../config/bullmqRedis.js';
import { QUEUE_NAMES } from '../constants/index.js';
import logger from '../utils/logger.js';

let queueEvents: QueueEvents | null = null;
let connection: any = null;

export const startDocumentQueueEvents = () =>{
  if(queueEvents){
    return queueEvents;
  }

  connection = createBullmqConnection('BullMQ QueueEvents');
  queueEvents = new QueueEvents(QUEUE_NAMES.DOCUMENT_PROCESSING, { connection });

  queueEvents.on('added', ({ jobId }) => {
    logger.info(`Queue Event | Job Added | jobId=${jobId}`);
  });

  queueEvents.on('active', ({ jobId, prev }) => {
    logger.info(`Queue Event | Job Active | jobId=${jobId} prev=${prev}`);
  });

  queueEvents.on('completed', ({ jobId }) => {
    logger.success(`Queue Event | Job Completed | jobId=${jobId}`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Queue Event | Job Failed | jobId=${jobId} reason=${failedReason}`);
  });

  queueEvents.on('retries-exhausted', ({ jobId }) => {
    logger.error(`Queue Event | Job Retries Exhausted | jobId=${jobId}`);
  });

  //BullMQ emits delayed /waiting after a failed attempt before retry.
  queueEvents.on('delayed', ({ jobId }) => {
    logger.warn(`Queue Event | Job Retried (delayed) | jobId=${jobId}`);
  });

  logger.info('Document queue event listeners started');
  return queueEvents;
};

export const stopDocumentQueueEvents = async () => {
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }

  if (connection) {
    await connection.quit();
    connection = null;
  }

  logger.info('Document queue event listeners stopped');
};

export default startDocumentQueueEvents;