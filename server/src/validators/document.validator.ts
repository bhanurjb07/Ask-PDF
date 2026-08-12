import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';


//Validate :id route param as a MongoDB ObjectId.
export const validateObjectId: RequestHandler =(req, _res, next) =>{
  const { id }=req.params;
  if(!mongoose.Types.ObjectId.isValid(String(id))){
    next(
      new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Invalid document id',
       ),
    );
    return;
  }
  next();
};

//Ensure multer attached a file before service layer
export const validateUploadedFile: RequestHandler=(req, _res, next)=>{
  if(!req.file){
    next(new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'PDF file is required (field name: file)'
      ),
    );
    return;
  }

  if(req.file.mimetype !== 'application/pdf'){
    next(new ApiError(
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
        'Only PDF files are allowed'
      ),
    );
    return;
  }
  next();
};