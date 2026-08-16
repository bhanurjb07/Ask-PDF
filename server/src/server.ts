import createApp from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from '../src/config/env.js';
import logger from "./utils/logger.js";
import { initGemini } from './config/gemini.js';
import connectRedis, { disconnectRedis } from './config/redis.js';
import { disconnectBullmqRedis } from './config/bullmqRedis.js';

let server = null;
//Server start
const startServer=async()=>{
  try{
    logger.info(`Starting server in ${env.nodeEnv} mode`);

    await connectDB();
    await connectRedis();
    initGemini();

    const app=createApp();

    server = app.listen(env.port, ()=>{
      logger.success(`Server listening on port ${env.port}`);
    });


  }catch (error: unknown){
    logger.error(`Failed to start server: ${ error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

startServer();