import dotenv from 'dotenv';
dotenv.config();
import { CHAT, EMBEDDING, RETRIEVAL } from '../constants/index.js';

const required = [
  "PORT",
  "MONGO_URI",
  "REDIS_URL",
  "GEMINI_API_KEY",

  "MAX_FILE_SIZE",
];

for(const key of required){
    if(!process.env[key]){
        throw new Error(`${key} is missing in .env`);
    }
}

export const env = {
  port: Number(process.env.PORT) || 4001,

  mongoUri: process.env.MONGO_URI!,
  redisUrl: process.env.REDIS_URL!,
  
  geminiApi: process.env.GEMINI_API_KEY!,
  geminiChatModel: CHAT.MODEL!,
  geminiEmbeddingModel: EMBEDDING.MODEL!,

  maxFileSize: process.env.MAX_FILE_SIZE!,

  corsOrigin: process.env.CORS_ORIGIN!,

  nodeEnv: process.env.NODE_ENV || 'development',

  isProduction: process.env.NODE_ENV === 'production'!,
  isDevelopment: process.env.NODE_ENV === 'development'!,
}

export default env;