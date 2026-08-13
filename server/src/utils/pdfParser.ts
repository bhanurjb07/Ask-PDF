import fs from 'fs/promises';
import path from 'path';
import { PDFParse, PasswordException, InvalidPDFException, FormatError } from 'pdf-parse';
import { UPLOADS_DIR } from '../helper/file.helper.js';
import { cleanExtractedText, countWords } from '../helper/text.helper.js';
import {env} from '../config/env.js';

interface AppError extends Error {
  code: string;
}
interface PdfStats {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  averageWordsPerPage: number;
}
interface PdfMetadata {
  pdfFormatVersion: string | null;
  title: string | null;
  author: string | null;
  creator: string | null;
  producer: string | null;
  isEncrypted: boolean;
}
interface ParsedPdf {
  rawText: string;
  metadata: PdfMetadata;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  averageWordsPerPage: number;
}

//crte error with custom error
const createError = (message: string, code: string): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  return error;
};

//Ensure absolutePath resolves inside the uploads directory
export const assertSafeUploadPath =(absolutePath: string ): string => {
  const resolved = path.resolve(absolutePath);
  const uploadsRoot = path.resolve(UPLOADS_DIR);

  if(resolved !== uploadsRoot && !resolved.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw createError('Invalid file path', 'UNSAFE_PATH');
  }

  return resolved;
};


   //Build statistics about the extracted PDF text.

const buildStats =(
  rawText: string, pageCount: number,
): PdfStats=>{
  const wordCount = countWords(rawText);
  const characterCount = rawText.length;

  const safePages = pageCount > 0 ? pageCount : 1;

  const averageWordsPerPage = Number((wordCount / safePages).toFixed(2));

  return {
    pageCount,
    wordCount,
    characterCount,
    averageWordsPerPage,
  };
};


   // Load a PDF from disk, extract text + metadata,
  // and compute statistics.
 
export const parsePdfFile = async (
  absolutePath: string,
): Promise<ParsedPdf> => {
  const safePath = assertSafeUploadPath(absolutePath);

  const stat = await fs.stat(safePath);

  if (!stat.isFile()) {
    throw createError(
      'PDF path is not a file',
      'UNSUPPORTED_FILE',
    );
  }

  if(stat.size > Number(env.maxFileSize)){
    throw createError(
      'PDF exceeds configured MAX_FILE_SIZE',
      'FILE_TOO_LARGE',
    );
  }

  if (stat.size === 0) {
    throw createError(
      'PDF file is empty',
      'EMPTY_PDF',
    );
  }

  const data = await fs.readFile(safePath);
  let parser: PDFParse | null = null;
  try{
    parser = new PDFParse({ data });

    const infoResult = await parser.getInfo();
    const textResult = await parser.getText();

    const pageCount = Number( textResult?.total || infoResult?.total || 0);

    const metadata = infoResult?.info || {};

    if( metadata.EncryptFilterName || infoResult?.permission){
      // Encrypted documents may still parse if opened
      // without a password.
      //
      // PasswordException is handled below.
    }

    if (!pageCount || pageCount < 1){
      throw createError(
        'PDF has zero pages',
        'ZERO_PAGES',
      );
    }

    /**
     * pdf-parse can return text page-by-page.
     *
     * We join all pages together.
     */
    const joinedPageText = Array.isArray(textResult?.pages)
      ? textResult.pages
          .map((page) => page.text || '')
          .join('\n\n')
      : String(textResult?.text || '');

    const rawText =cleanExtractedText(joinedPageText);

    if(!rawText || rawText.length === 0){
      throw createError(
        'PDF has no readable text',
        'NO_TEXT',
      );
    }

    const stats = buildStats(rawText,pageCount);

    return{
      rawText,

      metadata: {
        pdfFormatVersion:
          metadata.PDFFormatVersion || null,

        title:
          metadata.Title || null,

        author:
          metadata.Author || null,

        creator:
          metadata.Creator || null,

        producer:
          metadata.Producer || null,

        isEncrypted:
          Boolean(metadata.EncryptFilterName),
      },

      ...stats,
    };
  }catch(error: unknown){
    if(typeof error === 'object' && error !== null && 'code' in error){
      throw error;
    }
    if(
      error instanceof PasswordException ||
      (error instanceof Error &&
        error.name === 'PasswordException')
    ){
      throw createError(
        'PDF is encrypted and cannot be parsed',
        'ENCRYPTED_PDF',
      );
    }

    if(
      error instanceof InvalidPDFException ||
      error instanceof FormatError ||
      (error instanceof Error &&
        (error.name === 'InvalidPDFException' ||
          error.name === 'FormatError'))
    ){
      throw createError(
        'PDF is corrupted or has an unsupported structure',
        'CORRUPTED_PDF',
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to parse PDF';

    throw createError(
      message,
      'PARSE_FAILED',
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Ignore destroy errors.
      }
    }
  }
};

export default parsePdfFile;