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
    // Skip logging for 401 errors as they are expected during auth checks
    const is401 = error.response?.status === 401;

    if (!is401) {
      console.error('API Error:', error);
    }

    const originalRequest = error.config;

    // Handle 401 errors with token refresh, but skip for auth endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('auth/');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
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

        // Don't redirect directly, let the component handle auth state
        console.warn('Token refresh failed, user needs to re-authenticate');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
