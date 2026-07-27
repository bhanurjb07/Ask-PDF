import {env} from '../config/env.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS } from '../constants/index.js';
import type { Request, Response, NextFunction }from 'express';


const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
): void =>{
    let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    //Mongoose Cast Error
    if (err.name === 'CastError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Invalid resource identifier';
    }

    //Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Validation failed';
        errors = Object.values(err.errors || {}).map(
            (e: any) => e.message,
        );
    }

    // MongoDB Duplicate Key Error
    if(err.code === 11000){
        statusCode = HTTP_STATUS.CONFLICT;
        message = 'Duplicate key error';
    }

    // Multer File Size Error
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = HTTP_STATUS.PAYLOAD_TOO_LARGE;
        message = 'File too large';
    }

    if(statusCode >= 500){
        logger.error(`${req.method} ${req.originalUrl} - ${message}`);
    } else {
        logger.warn(`${req.method} ${req.originalUrl} - ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message,
        data: null,
        errors,
        ...(env.isDevelopment && { stack: err.stack }),
    });
};

export default errorHandler;