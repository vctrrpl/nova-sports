import { toast as hotToast } from 'react-hot-toast';

// Safe toast wrapper to prevent hook errors
export const toast = {
  success: (message, options = {}) => {
    try {
      return hotToast.success(message, options);
    } catch (error) {
      console.warn('Toast success failed:', error);
      console.log('Success:', message);
    }
  },

  error: (message, options = {}) => {
    try {
      return hotToast.error(message, options);
    } catch (error) {
      console.warn('Toast error failed:', error);
      console.error('Error:', message);
    }
  },

  loading: (message, options = {}) => {
    try {
      return hotToast.loading(message, options);
    } catch (error) {
      console.warn('Toast loading failed:', error);
      console.log('Loading:', message);
    }
  },

  dismiss: (toastId) => {
    try {
      return hotToast.dismiss(toastId);
    } catch (error) {
      console.warn('Toast dismiss failed:', error);
    }
  },

  // Default toast function
  default: (message, options = {}) => {
    try {
      return hotToast(message, options);
    } catch (error) {
      console.warn('Toast failed:', error);
      console.log('Toast:', message);
    }
  },
};

export default toast;
