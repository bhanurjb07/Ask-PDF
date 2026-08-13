import type { AxiosProgressEvent } from 'axios';
import api from './api.js';

export const uploadDocument = async (
  file: File,
  onUploadProgress?: (event: AxiosProgressEvent) => void,
) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

  return response.data?.data;
};

export default { uploadDocument };
