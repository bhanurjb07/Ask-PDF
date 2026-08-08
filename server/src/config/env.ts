import dotenv from 'dotenv';
dotenv.config();

const required = [
  "MONGO_URI",
  "REDIS_URL",
  "GEMINI_API_KEY",
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

  isProduction: process.env.NODE_ENV === 'production'!,
  isDevelopment: process.env.NODE_ENV === 'development'!,
}