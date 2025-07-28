import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies to the server
});

// Global refresh promise to prevent multiple simultaneous refresh attempts
let refreshPromise = null;

// Add response interceptor to handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip logging for /auth/profile 401s (these are expected when not authenticated)
    if (
      !(error.config.url === '/auth/profile' && error.response?.status === 401)
    ) {
      console.error('API Error:', error);
    }

    const originalRequest = error.config;

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Prevent multiple simultaneous refresh attempts
        if (refreshPromise) {
          await refreshPromise;
          return axiosInstance(originalRequest);
        }

        // Start refresh token request
        refreshPromise = axiosInstance.post('/auth/refresh-token');
        await refreshPromise;
        refreshPromise = null;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;

        // If refresh fails, redirect to login or handle logout
        if (typeof window !== 'undefined') {
          // Clear any stored auth state and redirect to login
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
