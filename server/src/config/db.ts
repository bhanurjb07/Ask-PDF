import mongoose from "mongoose";
import {env} from './env.js';
import logger from "../utils/logger.js";

export async function connectDB(): Promise<void>{
    try{
        await mongoose.connect(env.mongoUri);

        logger.success("MongoDB Connected");
        mongoose.connection.on("error", err =>{
            logger.error(err.message);
        });

        mongoose.connection.on("disconnected", ()=>{
            logger.warn("MongoDB disconnected");
        });

    }catch(err: unknown){
        if(err instanceof Error){
            logger.error(err.message);
        }
        process.exit(1);
    }
}

export async function disconnectDB() {
    await mongoose.connection.close();
}
