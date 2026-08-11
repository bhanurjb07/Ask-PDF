import logger from "../utils/logger.js";
import path from 'path';
import ApiError from "../utils/ApiError.js";
import ApiResponse from '../utils/ApiResponse.js';
import documentRepository from "../repositories/document.repository.js";
import { HTTP_STATUS, DOCUMENT_STATUS } from "../constants/index.js";
import { addDocumentProcessingJob } from "../queue/document.queue.js";
import { deleteLocalFile, assertPdfMagicBytes, sanitizeOriginalName, UPLOADS_DIR } from "../helper/file.helper.js";

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

//remove uploaded file after a failed operation
const cleanupUploadedFile =async(absolutePath: string) =>{
    try{
        await deleteLocalFile(absolutePath);
    }catch (error: unknown){
        if(error instanceof Error){
            logger.warn(`Failed to cleanup uploaded file: ${error.message}`);
        }else{
            logger.warn("Failed to cleanup uploaded file");
        }
    }
};

const documentService={
  async upload(file: any, createdBy: string | null = null) {
    if(!file){
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'PDF file is required',
        );
    }

    const absolutePath= file.path || path.join(UPLOADS_DIR, file.filename);

    logger.info(`Upload started: ${sanitizeOriginalName(file.originalname)}`);

    try{
        //check if file is pdf or not
        await assertPdfMagicBytes(absolutePath);

        //document creation
        const document = await documentRepository.create({
            originalName: sanitizeOriginalName(file.originalname),
            storedName: file.filename,
            filePath: absolutePath,
            mimeType: file.mimetype,
            fileSize: file.size,
            status: DOCUMENT_STATUS.UPLOADED,
            pageCount: null,
            uploadedAt: new Date(),
            createdBy: createdBy || null,
        });

        let job;
        try{
            job = await addDocumentProcessingJob({
                documentId: document._id,
                filePath: document.filePath,
                storedName: document.storedName,
                createdAt: new Date().toISOString(),
            });
        } catch (queueError: unknown) {
            await documentRepository.updateById(document._id, {
                status: DOCUMENT_STATUS.FAILED,
                failureReason: 'Failed to enqueue processing job',
            });

            if (queueError instanceof Error) {
                logger.error(
                    `Queue enqueue failed: ${queueError.message}`,
                );
            } else {
                logger.error('Queue enqueue failed');
            }

            throw new ApiError(
                HTTP_STATUS.SERVICE_UNAVAILABLE,
                'Document saved but failed to queue for processing. Ensure Redis is running.',
            );
        }

        await cacheService.del(cacheService.listKey());

        logger.success(
            `Upload queued: documentId=${document._id} jobId=${job.id}`,
        );

        return {
            documentId: document._id,
            jobId: job.id,
            status: DOCUMENT_STATUS.UPLOADED,
        };

    }catch(error: unknown){

        if(!(error instanceof ApiError)){
            await cleanupUploadedFile(absolutePath);

        }else if(error.statusCode !== HTTP_STATUS.SERVICE_UNAVAILABLE){
            await cleanupUploadedFile(absolutePath);
        }

        if(error instanceof Error){
            logger.error(`Upload failed: ${error.message}`);
        }else{
            logger.error('Upload failed');
        }

        if(
            error instanceof Error &&
            'code' in error &&
            error.code === 'INVALID_PDF'
        ){
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                'Uploaded file is corrupted or not a valid PDF',
            );
        }

        if(error instanceof ApiError){
            throw error;
        }

        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            'Failed to upload document',
        );
    }
  },
}