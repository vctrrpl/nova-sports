import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies to the server
});

// Add response interceptor to handle /auth/profile 401s silently
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't reject promise for /auth/profile 401s
    if (
      error.config.url === '/auth/profile' &&
      error.response?.status === 401
    ) {
      return { status: 401, data: null };
    }

    // Log API errors except for profile check 401s
    if (
      !(error.config.url === '/auth/profile' && error.response?.status === 401)
    ) {
      console.error('API Error:', error);
    }

    return Promise.reject(error);
  }
);

// Prevent browser from logging 401s for profile checks
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  const promise = originalFetch(url, options);
  if (url.includes('/api/auth/profile')) {
    return promise.catch((err) => {
      if (err.status === 401) {
        return { status: 401, data: null };
      }
      throw err;
    });
  }
  return promise;
};

export default axiosInstance;
