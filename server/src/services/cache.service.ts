import logger from '../utils/logger.js';
import { getRedisClient, getRedisStatus } from "../config/redis";


const DEFAULT_TTL_SECONDS=30;        //time to live

const cacheService={

    //check is redis currently connected
    isReady(){
        return getRedisStatus()==='connected';
    },

    //get cached value from Redis
    async get(key: string){
        if(!this.isReady())return null;

        try{
            const client= getRedisClient();
            const value= await client.get(key);
            return value ? JSON.parse(value): null;
        }catch(error: unknown){
            if(error instanceof Error){
                logger.warn(`Cache get failed key=${key}: ${error.message}`);
                return false;
            }else{
                logger.warn(`Cache get failed key=${key}: Unknown error`);
                return false;
            }
        }
    },

    //Store value in Redis by the given key
    async set(key: string, value: unknown, ttlSecond= DEFAULT_TTL_SECONDS){
        if(!this.isReady())return false;

        try{
            const client= getRedisClient();
            await client.set(key, JSON.stringify(value), {EX: ttlSecond});
            return true;
        }catch(error: unknown){
            if(error instanceof Error){
                logger.warn(`Cache set failed key=${key}: ${error.message}`);
                return false;
            }else{
                logger.warn(`Cache set failed key=${key}: Unknown error`);
                return false;
            }
        }
    },

    //Delete cached value from Redis
    async del(key: string){
       if(!this.isReady())return false;

       try{
            const client = getRedisClient();
            await client.del(key);
            return true;
        }catch(error: unknown){
            if(error instanceof Error){
                logger.warn(`Cache del failed key=${key}: ${error.message}`);
                return false;
            }else{
                logger.warn(`Cache del failed key=${key}: Unknown error`);
                return false
            }
        }
    },

    documentKey(id: string){
        return `doc:meta:${id}`;
    },

    statusKey(id : string){
        return `doc:status: ${id}`;
    },

    listKey(){
        return 'doc:list';
    },

    //delete all old data from RRedis
    async invalidateDocument(id:string){
        await Promise.all([                   ///finish all
        this.del(this.documentKey(id)),
        this.del(this.statusKey(id)),
        this.del(this.listKey()),
        ]);
    }

}

export default cacheService;