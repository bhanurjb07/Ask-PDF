import { useCallback, useEffect, useRef } from 'react';
import { ACCEPTED_MIME, MAX_FILE_SIZE, POLL_INTERVAL_MS, STATUS } from '../constants/index.js';
import { useAppContext } from '../context/AppContext.jsx';
import uploadService from '../services/uploadService.js';
import documentService from '../services/documentService.js';
import type { Document } from '../types/index.js';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function useUpload({ onCompleted }: { onCompleted?: (doc: Document) => void } = {}) {
  const { uploadState, setUploadState, pushToast, setDocuments } = useAppContext();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearPoll(), []);

  const validateFile = (file: File | null | undefined) => {
    if (!file) return 'Please choose a PDF file';
    if (file.type !== ACCEPTED_MIME && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File must be 20MB or smaller';
    }
    return null;
  };

  const pollStatus = useCallback(
    (documentId: string) => {
      clearPoll();
      timerRef.current = setInterval(async () => {
        try {
          const statusPayload = await documentService.getDocumentStatus(documentId);
          const status = statusPayload?.status;

          setUploadState((prev) => ({
            ...prev,
            status: status || prev.status,
            error: statusPayload?.failureReason || null,
          }));

          if (status === STATUS.COMPLETED || status === STATUS.FAILED) {
            clearPoll();
            const fresh: Document = await documentService.getDocument(documentId);
            setDocuments((prev) => {
              const others = prev.filter((d) => d.id !== documentId);
              return [fresh, ...others];
            });

            if (status === STATUS.COMPLETED) {
              pushToast({ type: 'success', message: 'Document processing completed' });
              onCompleted?.(fresh);
            } else {
              pushToast({
                type: 'error',
                message: statusPayload?.failureReason || 'Processing failed',
              });
            }
          }
        } catch (error) {
          clearPoll();
          setUploadState((prev) => ({ ...prev, status: 'FAILED', error: getErrorMessage(error) }));
          pushToast({ type: 'error', message: getErrorMessage(error) });
        }
      }, POLL_INTERVAL_MS);
    },
    [onCompleted, pushToast, setDocuments, setUploadState],
  );

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        pushToast({ type: 'error', message: validationError });
        setUploadState((prev) => ({ ...prev, error: validationError, status: 'FAILED' }));
        return;
      }

      setUploadState({
        file,
        progress: 0,
        status: 'UPLOADING',
        documentId: null,
        error: null,
      });

      try {
        const result = await uploadService.uploadDocument(file, (event) => {
          if (!event.total) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState((prev) => ({ ...prev, progress }));
        });

        setUploadState((prev) => ({
          ...prev,
          progress: 100,
          status: result?.status || STATUS.UPLOADED,
          documentId: result?.documentId,
        }));

        pushToast({ type: 'success', message: 'Upload queued for processing' });
        if (result?.documentId) {
          pollStatus(result.documentId);
        }
      } catch (error) {
        setUploadState((prev) => ({
          ...prev,
          status: 'FAILED',
          error: getErrorMessage(error),
        }));
        pushToast({ type: 'error', message: getErrorMessage(error) });
      }
    },
    [pollStatus, pushToast, setUploadState],
  );

  return {
    uploadState,
    upload,
    validateFile,
  };
}
