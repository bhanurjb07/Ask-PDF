import express from "express";
import cors from "cors";
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import {env} from '../src/config/env.js';
import rateLimiter from './middleware/rateLimiter.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';


const createApp =()=>{
  const app =express();

  app.use(helmet());
  app.use(
    compression({
      filter: (req, res)=>{
        if(req.originalUrl.includes('/chat') && req.method === 'POST') {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(rateLimiter);

  app.use('/', routes);
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);


  return app;
}; 

export default createApp;