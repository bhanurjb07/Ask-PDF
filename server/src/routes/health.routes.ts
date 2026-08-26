import { Router } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import asyncHandler from '../utils/asyncHandler.js';
import { getRedisStatus } from '../config/redis.js';
import { getBullmqRedisStatus } from '../config/bullmqRedis.js';
import { HTTP_STATUS } from '../constants/index.js';
import env from '../config/env.js';
import cacheService from '../services/cache.service.js';

const router = Router();

router.get('/',
  asyncHandler(async (req, res)=>{
    const database =mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    const redis = getRedisStatus();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Server is running',
      uptime: process.uptime(),
      environment: env.nodeEnv,
      database,
      redis,
    });
  }),
);

 //GET /health/details and /api/health/details

router.get('/details',
  asyncHandler(async (req, res)=>{
    const databaseReady = mongoose.connection.readyState === 1;
    const redis = getRedisStatus();
    const bullmqRedis = getBullmqRedisStatus();

    const details={
      success: true,
      message: 'Detailed health status',
      data:{
        service: 'rag-pdf-qa-backend',
        environment: env.nodeEnv,
        uptimeSeconds: Number(process.uptime().toFixed(2)),
        timestamp: new Date().toISOString(),
        dependencies:{
          mongodb: databaseReady ? 'connected' : 'disconnected',
          redis,
          bullmqRedis,
          cache: cacheService.isReady() ? 'ready' : 'unavailable',
        },
        process:{
          nodeVersion: process.version,
          pid: process.pid,
          memory: process.memoryUsage(),
          loadAverage: os.loadavg(),
        },
        config:{
          port: env.port,
          maxFileSize: env.maxFileSize,
          corsOrigin: env.corsOrigin,
          geminiConfigured: Boolean(
            env.geminiApi,
          ),
        },
      },
    };

    const healthy = databaseReady;
    res.status(healthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json(details);
  }),
);

export default router;