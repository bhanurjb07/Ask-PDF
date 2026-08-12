import { Worker } from 'bullmq';
import logger from '../utils/logger';
import documentRepository from '../repositories/document.repository';
import { createBullmqConnection } from '../config/bullmqRedis';



let worker=null;
let connection=null;

//start the BullMQ worker
export const startDocumentWorker=()=>{
    if(worker){
        return worker;
    }

    connection= createBullmqConnection('BullMQ Worker');
}

