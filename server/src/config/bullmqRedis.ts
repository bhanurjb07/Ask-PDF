import {env} from './env';
import logger from '../utils/logger';
import Redis from 'ioredis';

//object containing configuration for the Redis connection
const bullmqRedisOptions={
    maxRetriesPerRequest: null,
    enableReadyCheck: true,                //Don't consider Redis fully ready until Redis tells us it is ready
    lazyConnect: false,                   //starts automatically when create the Redis client.
    

    //tell to ioredis hoow long should i wait before trying again to connect to redish
    retryStrategy(times: any){
        if(times > 20){
            logger.error('BullMQ Redis reconnect attempts exceeded');
            return null;
        }

        const delay= Math.min(times * 200, 3000);
        logger.warn(`BullMQ Redis reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
    },
};

//logging redish connection
let sharedConnection: any=null;
const attachListeners =(client: Redis, label = 'BullMQ Redis')=>{

  client.on('connect', ()=>{
    logger.info(`${label} connecting...`);
  });

  client.on('ready', ()=>{
    logger.success(`${label} connected and ready`);
  });

  client.on('error', (error: Error)=>{
    logger.error(`${label} error: ${error.message}`);
  });

  client.on('close', ()=>{
    logger.warn(`${label} connection closed`);
  });

  client.on('reconnecting', (delay: number)=>{
    logger.warn(`${label} reconnecting in ${delay}ms`);
  });

  client.on('end', ()=>{
    logger.warn(`${label} connection ended`);
  });
};


export const createBullmqConnection = (label = 'BullMQ Redis') => {
    const client = new Redis(env.redisUrl, bullmqRedisOptions);
    attachListeners(client, label);
    return client;
};


export const getBullmqConnection = () => {
    if(!sharedConnection) {
        sharedConnection = createBullmqConnection('BullMQ Redis (shared)');
    }

    return sharedConnection;
};

export const getBullmqRedisStatus = () => {
    if(!sharedConnection) {
        return 'disconnected';
    }

    return sharedConnection.status === 'ready' ? 'connected' : 'disconnected';
};

/**
 * Gracefully close the shared BullMQ Redis connection.
 */
export const disconnectBullmqRedis = async () => {
  if (!sharedConnection) {
    return;
  }

  try {
    await sharedConnection.quit();
    logger.info('BullMQ Redis shared connection closed gracefully');
  } catch (error: unknown) {
    logger.warn(`BullMQ Redis quit failed, forcing disconnect: ${error.message}`);
    sharedConnection.disconnect();
  } finally {
    sharedConnection = null;
  }
};

export default{
    bullmqRedisOptions,
    
}