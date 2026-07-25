import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { HTTP_STATUS } from "../constants";

const rateLimiter = rateLimit({
  windowMs: 15*60*1000,    ///15 minutes

  max: env.isProduction ? 200 : 1000,

  standardHeaders: true,
  legacyHeaders: false,

  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,

  message:{
    success: false,
    message: "Too many requests. Please try again later.",
    data: null,
  },

  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

export default rateLimiter;