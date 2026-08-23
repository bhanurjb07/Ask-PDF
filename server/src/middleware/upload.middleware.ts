import fs from 'fs';
import { env } from '../config/env.js';
import path from 'path';
import multer from 'multer';
import { Request,Response , ErrorRequestHandler} from 'express';
import {v4 as uuidv4 } from 'uuid';
import { UPLOADS_DIR, sanitizeOriginalName } from '../helper/file.helper.js';
import ApiError from '../utils/ApiError.js';
import type { FileFilterCallback } from 'multer';
import { HTTP_STATUS } from '../constants/index.js';

//creting folder
if(!fs.existsSync(UPLOADS_DIR)){
    fs.mkdirSync(UPLOADS_DIR, {recursive: true});
}

//only pdf allowed
const ALLOWED_MIME_TYPES= new Set(['application/pdf']);              //multipurpose internet mail extensions

//destination and filename set
const storage= multer.diskStorage({
    destination: (_req, file, cb)=>{
        cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb)=>{
        const uniqueName= `${uuidv4()}.pdf`;
        cb(null, uniqueName);
    },
});

//
const fileFilter=(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void=>{
  const mimeType =(file.mimetype || '').toLowerCase();
  const original =sanitizeOriginalName(file.originalname);
  const extension =path.extname(original).toLowerCase();

  if(!ALLOWED_MIME_TYPES.has(mimeType) || extension !== '.pdf'){
    cb(
      new ApiError(
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
        'Only PDF files are allowed',
      ),
    );
    return;
  }
  cb(null, true);
};

//multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(env.maxFileSize),
    files: 1,
  },
});

//single-file PDF upload middleware
export const uploadPdf = upload.single('file');

//Normalize Multer errors into ApiError

export const handleUploadError: ErrorRequestHandler=(error, _req, _res, next)=>{
  if(!error){
    next();
    return;
  }

  if(error instanceof multer.MulterError){
    if(error.code === 'LIMIT_FILE_SIZE'){
        next(
            new ApiError(
               HTTP_STATUS.PAYLOAD_TOO_LARGE,
               `File too large. Maximum size is ${env.maxFileSize} bytes`,
            ),
        );
      return;
    }

    if(error.code === 'LIMIT_UNEXPECTED_FILE'){
      next(
        new ApiError(
              HTTP_STATUS.BAD_REQUEST,
              'Unexpected file field. Use form field name "file"',
            ),
        );
      return;
    }

    next(new ApiError(HTTP_STATUS.BAD_REQUEST, error.message));
    return;
  }
  next(error);
};
