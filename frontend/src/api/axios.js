import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor: attach access token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: handle token refresh or redirects
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized (401) and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Attempt token refresh using the dynamic base URL
          const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
          const refreshURL = apiURL.endsWith('/') ? `${apiURL}token/refresh/` : `${apiURL}/token/refresh/`;
          const res = await axios.post(refreshURL, {
            refresh: refreshToken,
          });

          if (res.status === 200) {
            localStorage.setItem('access_token', res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return API(originalRequest);
          }
        } catch (refreshError) {
          // Token expired or invalid, log out
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear data and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
