import logger from "../utils/logger.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from '../utils/ApiResponse.js';

interface UploadFile {
  originalname: string;
  filename: string;
  path?: string;
  mimetype: string;
  size: number;
}

interface UploadResponse {
  documentId: string;
  jobId: string;
  status: string;
}

const documentService= {
    async upload(file: UploadFile || undefined,
                 createdBy: string || null,

    ): 
    if(!file)
}