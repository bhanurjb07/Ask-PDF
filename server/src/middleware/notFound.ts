import ApiError from "../utils/ApiError";
import { HTTP_STATUS } from "../constants";
import type { Request, Response, NextFunction }from 'express';

//Catch-all middleware for unmatched routes.
const notFound = (
    req: Request,
    res: Response,
    next: NextFunction,
): void =>{
    next(
        new ApiError(
            HTTP_STATUS.NOT_FOUND,
            `Route not found: ${req.method} ${req.originalUrl}`,
        ),
    );
};

export default notFound;