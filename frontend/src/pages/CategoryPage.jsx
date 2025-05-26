import { useEffect, useState } from 'react';
import { useProductStore } from '../stores/useProductStore';
import { useParams } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CategoryPage = () => {
  const { fetchProductsByCategory, products, loading } = useProductStore();
  const { category } = useParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`About to fetch products for category: ${category}`);
    const fetchData = async () => {
      try {
        console.log('Making API call...');
        await fetchProductsByCategory(category.toLowerCase());
        console.log('API call completed');
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      }
    };
    fetchData();
  }, [fetchProductsByCategory, category]);

  console.log('products', products);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Motion.h1
          className="text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Motion.h1>

        {error && (
          <div className="text-red-500 text-center mb-4">Error: {error}</div>
        )}

        {!error && products?.length === 0 && (
          <h2 className="text-3xl font-semibold text-gray-300 text-center col-span-full">
            No products found
          </h2>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
