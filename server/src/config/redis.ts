import { createClient, type RedisClientType } from "redis";
import {env} from './env.js';
import logger from '../utils/logger.js';


let redisClient: RedisClientType | null = null;
let hasConnectedOnce = false;


//create and connect a resuable rdish clinet
const connectRedis= async()=>{
    if(redisClient?.isOpen){
        return redisClient;
    }

    redisClient = createClient({
        url: env.redisUrl,
        socket:{
            connectTimeout: 3000,
            reconnectStrategy: (retries)=>{

                //decide what to do after connection failure

                if(!hasConnectedOnce){
                    return new Error('Redis intial connect failed');
                }

                if(retries > 10){
                    logger.error("Redis reconnect attemps exceeded");
                    return new Error("Redis reconnect failed");
                }

                const delay = Math.min(retries * 100, 3000);
                logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
                return delay;
            },
        },
    });

    redisClient.on('connect', ()=>{
        logger.info('Redis connecting...');
    });

    redisClient.on('ready', ()=>{
        hasConnectedOnce= true;
        logger.success('Redis connected and ready');
    });

    redisClient.on('error', (error)=>{
        //to Avoid noisy logs before first successful connection.
        if(hasConnectedOnce){
            logger.error(`Redis error: ${error.message}`);
        }
    });

    redisClient.on('end', ()=>{
        logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () =>{
        if(hasConnectedOnce){
            logger.warn('Redis reconnecting...');
        }
    });


    try{
        ///Attempt the initial connection to Redis
        await redisClient.connect();
        return redisClient;
    }catch(error: unknown){
        if(error instanceof Error){
            logger.warn(`Redis unavailable (${error.message}). Continuing without Redis`);
        }else{
            logger.warn(`Redis unavailable. Continuing without Redis`);
        }

        try{
            //Clean up the client if the connection was partially established
            if(redisClient?.isOpen){
                await redisClient.quit();
            }
        }catch{}


        //Reset Redis state for fresh client for future
        redisClient=null;
        hasConnectedOnce=false;
        return null;
    }

};

//return the Redis client if it has been created
export const getRedisClient = ()=>{
    if(!redisClient){
        throw new Error('Redis client is not connected. Provide a valid REDIS_URL and restart.');
    }
  return redisClient;
};

//tell redish status
export const getRedisStatus =()=>{
    if(!redisClient) {
        return 'disconnected';
    }

    return redisClient.isReady ? 'connected' : 'disconnected';
};

//close redis and resrt state
export const disconnectRedis =async()=>{
  if(redisClient?.isOpen){
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  }

  redisClient = null;
  hasConnectedOnce = false;
};

export default connectRedis;