import api from './api.js';

export const listDocuments = async () => {
  const response = await api.get('/api/documents');
  return response.data?.data || [];
};

export const getDocument = async (id: string) => {
  const response = await api.get(`/api/documents/${id}`);
  return response.data?.data;
};

export const getDocumentStatus = async (id: string) => {
  const response = await api.get(`/api/documents/${id}/status`);
  return response.data?.data;
};

export const getEmbeddingStatus = async (id: string) => {
  const response = await api.get(`/api/documents/${id}/embeddings/status`);
  return response.data?.data;
};

export const deleteDocument = async (id: string) => {
  const response = await api.delete(`/api/documents/${id}`);
  return response.data?.data;
};

export default {
  listDocuments,
  getDocument,
  getDocumentStatus,
  getEmbeddingStatus,
  deleteDocument,
};
