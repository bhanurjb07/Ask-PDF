import { Request, Response } from 'express'; 
import documentService from '../services/document.service.js'; 
import ApiResponse from '../utils/ApiResponse.js' 
import { HTTP_STATUS } from '../constants/index.js' 
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
    getDocuments: asyncHandler(async(req:Request, res:Response)=>{ 
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
 
     
    //get document text 
    getDocumentText: asyncHandler(async (req:Request, res:Response) =>{ 
    const text = await documentService.getText(String(req.params.id), { 
        limit: req.query.limit ? Number(req.query.limit) : undefined, 
        offset: req.query.offset ? Number(req.query.limit) : undefined, 
    }); 
 
    res.status(HTTP_STATUS.OK).json(new ApiResponse( 
        HTTP_STATUS.OK, text, 'Document text fetched successfully')); 
    }), 
 
 
    //get document embeddings status 
    getDocumentEmbeddingsStatus: asyncHandler(async (req:Request, res:Response) =>{ 
    const status = await documentService.getEmbeddingStatus(String(req.params.id)); 
 
    res.status(HTTP_STATUS.OK).json(new ApiResponse( 
        HTTP_STATUS.OK, status, 'Document embedding status fetched successfully')); 
    }), 
 
 
    //get document chunks 
    getDocumentChunks: asyncHandler(async (req:Request, res:Response) =>{ 
    const chunks = await documentService.getChunks(String(req.params.id), { 
        page: req.query.page ? Number(req.query.page) : undefined, 
        limit: req.query.limit ? Number(req.query.page) : undefined,
    }); 
 
    res.status(HTTP_STATUS.OK).json(new ApiResponse( 
        HTTP_STATUS.OK, chunks, 'Document chunks fetched successfully')); 
    }), 
 
 
    //delete document 
    deleteDocument: asyncHandler(async (req:Request, res:Response) =>{ 
    const result = await documentService.remove(String(req.params.id)); 
 
    res.status(HTTP_STATUS.OK).json(new ApiResponse( 
        HTTP_STATUS.OK, result, 'Document deleted successfully')); 
    }), 
 
 
}; 
 
export default documentController;