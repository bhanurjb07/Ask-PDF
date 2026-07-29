import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Network error. Please try again.';
    return Promise.reject(new Error(message));
  },
);

export const API_BASE_URL = baseURL;

export default api;