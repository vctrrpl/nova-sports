import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import axios from '../lib/axios';
import { toast } from '../lib/toast';
import LoadingSpinner from './LoadingSpinner';

const PeopleAlsoBought = () => {
  const [recommendations, setRecommendations] = useState([]); // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get('/products/recommendations');
        setRecommendations(Array.isArray(res.data) ? res.data : []); // Ensure it's an array
      } catch (error) {
        toast.error(
          error.response.data.message ||
            'An error occurred while fetching recommendations'
        );
        setRecommendations([]); // Reset to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semilbold text-emerald-400">
        People also bought
      </h3>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(recommendations) &&
          recommendations.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
      </div>
    </div>
  );
};

export default PeopleAlsoBought;
