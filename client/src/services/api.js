// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://192.168.0.45:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// API wrapper with error handling
export const createApiWithErrorHandling = (handleApiError) => {
  // Create request methods that catch errors and use the notification system
  const get = async (url, config = {}) => {
    try {
      return await api.get(url, config);
    } catch (error) {
      handleApiError(error);
      throw error; // Re-throw for additional handling if needed
    }
  };

  const post = async (url, data = {}, config = {}) => {
    try {
      return await api.post(url, data, config);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const put = async (url, data = {}, config = {}) => {
    try {
      return await api.put(url, data, config);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const del = async (url, config = {}) => {
    try {
      return await api.delete(url, config);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const patch = async (url, data = {}, config = {}) => {
    try {
      return await api.patch(url, data, config);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  return {
    get,
    post,
    put,
    delete: del,
    patch,
    // Expose the original axios instance for advanced use cases
    axios: api,
  };
};
