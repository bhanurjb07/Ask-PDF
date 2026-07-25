import dotenv from 'dotenv';
dotenv.config();

const required = [
  "MONGO_URI",
];

for(const key of required){
    if(!process.env[key]){
        throw new Error(`${key} is missing in .env`);
    }
}

export const env = {
  port: Number(process.env.PORT) || 4001,

  mongoUri: process.env.MONGO_URI!,

  isProduction: process.env.NODE_ENV === 'production'!,
  isDevelopment: process.env.NODE_ENV === 'development'!,
}