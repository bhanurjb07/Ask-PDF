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

export const config = {
  port: Number(process.env.PORT) || 4001,

  mongoUri: process.env.MONGO_URI!,
}