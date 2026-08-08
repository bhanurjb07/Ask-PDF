import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import connectRedis from "./config/redis.js";


//Server start
async function startServer(): Promise<void>{
  try{
    await connectDB();
    await connectRedis();

    app.listen(env.port, ()=>{
      logger.success(`Server listening on port ${env.port}`);
      //console.log(`Server running on port ${env.port}`);
    });

  }catch(error){
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();