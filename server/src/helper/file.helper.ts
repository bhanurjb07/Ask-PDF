import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

//define absolute path to the uploads directory
const __filename = fileURLToPath(import.meta.url);     //path 
const __dirname = path.dirname(__filename);            //directory
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export const deleteLocalFile = async (absolutePath: any) => {
    if(!absolutePath){
        return false;
    }

    try{
        await fs.unlink(absolutePath);
        return true;
    }catch (error: unknown) {
        if(error instanceof Error && "code" in error &&
            error.code === "ENOENT"
        ) {
            return false;
        }
       throw error;
    }
};

//validate pdf and non-pdf files
type PdfError = Error & {
    code: string;
};
export const assertPdfMagicBytes = async(
    absolutePath: string,
): Promise<void> =>{
    const handle =await fs.open(absolutePath, 'r');
    try{
        //5 bytes alloaction
        const buffer = Buffer.alloc(5);

        /*
        handle.read(
            buffer  where to put the bytes
            0,      start writing into buffer at position 0
            5,      read 5 bytes
            0       start reading from position 0 in the file
        */
        await handle.read(buffer, 0, 5, 0);   //every pdf start with %PDF-
        
        //byte to string
        const header = buffer.toString('utf8');

        if(!header.startsWith('%PDF')){
            const error = new Error(
                'Uploaded file is not a valid PDF',
            )as PdfError;

            error.code = 'INVALID_PDF';
            throw error;
        }
    }finally{
        await handle.close();
    }
};


//Sanitize a client-provided filename(remove unnnessary charcter form name)
export const sanitizeOriginalName = (name: string = ''): string => {
    const base = path
        .basename(String(name))
        .replace(/[^\w.\- ()[\]]+/g, '_');

    return base.trim() || 'document.pdf';
};