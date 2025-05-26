import { create } from 'zustand';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  login: async (email, password) => {
    try {
      set({ loading: true });
      const response = await axios.post('/auth/login', {
        email,
        password,
      });
      set({ user: response.data, loading: false });
      toast.success('Successfully logged in!');
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || 'Failed to login');
      throw error;
    }
  },

  logout: async () => {
    try {
      await axios.post('/auth/logout');
      set({ user: null });
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'An error occurred during logout'
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get('/auth/profile');
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      set({ user: null, checkingAuth: false });
      // Only show error toast for unexpected errors
      if (!error.response || error.response.status !== 401) {
        toast.error(error.response?.data?.message || 'An error occurred');
        console.error('Auth check error:', error);
      }
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post('/auth/refresh-token');
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip logging for profile check 401s
    if (
      !(error.config.url === '/auth/profile' && error.response?.status === 401)
    ) {
      console.error('API Error:', error);
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
