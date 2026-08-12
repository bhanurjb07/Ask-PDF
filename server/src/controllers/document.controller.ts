import { Request, Response } from 'express';
import documentService from "../services/document.service";
import ApiResponse from "../utils/ApiResponse";
import { HTTP_STATUS } from "../constants";
import asyncHandler from '../utils/asyncHandler.js';


const documentController={
    //uploading document
    uploadDocument: asyncHandler(async(req: Request, res: Response)=>{
        const result= await documentService.upload(req.file, req.body?.createdBy);

        res.status(HTTP_STATUS.ACCEPTED).json(
            new ApiResponse(
                HTTP_STATUS.ACCEPTED,result,
                'Document uploaded successfully and queued for processing.',
            ),
        );
    }),

    //all document
    getDocument: asyncHandler(async(req:Request, res:Response)=>{
        const documents= await documentService.getAll();
        res.status(HTTP_STATUS.OK).json(new ApiResponse(
            HTTP_STATUS.OK, documents, 'Documents fetched successfully'
        ));
    }),

    //get doc by id
    getDocumentById: asyncHandler(async (req:Request, res:Response)=>{
    const document = await documentService.getById(String(req.params.id));

    res.status(HTTP_STATUS.OK).json(new ApiResponse(
        HTTP_STATUS.OK, document, 'Document fetched successfully'));
    }),


    //get the processing status
    getDocumentStatus: asyncHandler(async (req:Request, res:Response) =>{
    const status = await documentService.getStatus(String(req.params.id));

    res.status(HTTP_STATUS.OK).json(new ApiResponse(
        HTTP_STATUS.OK, status, 'Document status fetched successfully'));
    }),


};

export default documentController;