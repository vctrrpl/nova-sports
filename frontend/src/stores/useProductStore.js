import { create } from 'zustand';
import { toast } from '../lib/toast';
import axios from '../lib/axios';

export const useProductStore = create((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),

  // Create Product
  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post('/products', productData);
      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
      }));
    } catch (error) {
      console.error('Create product error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create product';
      toast.error(errorMessage);
      set({ loading: false });
    }
  },

  // Fetch All Products
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get('/products');
      set({ products: response.data.products, loading: false });
    } catch (error) {
      console.error('Fetch all products error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch products';
      set({ error: 'Failed to fetch products', loading: false });
      toast.error(errorMessage);
    }
  },

  // Fetch Products By Category
  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/category/${category}`);
      console.log('API Response:', response.data);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      console.log('API Error:', error);
      set({ error: 'Failed to fetch products', loading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch products');
    }
  },

  // Delete Product
  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Delete product error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete product';
      set({ loading: false });
      toast.error(errorMessage);
    }
  },

  // Toggle Featured Product
  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/products/${productId}`);
      // this will update the isFeatured prop of the product
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Update product error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update product';
      set({ loading: false });
      toast.error(errorMessage);
    }
  },

  // Fetch Featured Products
  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      console.log('Fetching featured products...');
      const response = await axios.get('/products/featured');
      console.log('Featured products response:', response.data);
      set({ products: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching featured products:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: error.config,
      });
      set({ error: 'Failed to fetch featured products', loading: false });
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to fetch featured products'
      );
    }
  },
}));
