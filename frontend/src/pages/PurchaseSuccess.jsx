import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { useUserStore } from '../stores/useUserStore';
import axios from '../lib/axios';
import Confetti from 'react-confetti';

const PurchaseSuccess = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const { clearCart } = useCartStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Clear cart immediately when component mounts
    clearCart();

    const handleCheckoutSuccess = async (sessionId) => {
      try {
        const response = await axios.post('/payments/create-checkout-success', {
          sessionId,
        });

        setOrderId(response.data.orderId);
      } catch (error) {
        console.error(
          'Checkout success error:',
          error.response?.data || error.message
        );

        // Check if it's a duplicate key error
        const errorMsg = error.response?.data?.error || '';
        if (errorMsg.includes('duplicate key error')) {
          // For duplicate key errors, just show success with a generic order ID
          setOrderId(
            'ORDER' + Math.random().toString(36).substring(2, 10).toUpperCase()
          );
        } else {
          setError('Failed to process checkout');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    const sessionId = new URLSearchParams(window.location.search).get(
      'session_id'
    );
    if (sessionId) {
      handleCheckoutSuccess(sessionId);
    } else {
      setIsProcessing(false);
      setError('No session ID found in the URL');
    }
  }, [clearCart, user, navigate]);

  if (isProcessing)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Processing your order...</div>
      </div>
    );

  if (error)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.1}
        style={{ zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center">
            <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2">
            Purchase Successful
          </h1>

          <p className="text-gray-300 text-center mb-2">
            Thank you for your order. {"We're"} processing it now
          </p>
          <p className="text-emerald-400 text-center text-sm mb-6">
            Check your email for order details and updates
          </p>
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Order number</span>
              <span className="text-sm font-semibold text-emerald-400">
                #{orderId ? orderId.substring(0, 8) : 'Processing...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Estimated delivery</span>
              <span className="text-sm font-semibold text-emerald-400">
                3-5 business days
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center">
              Thanks for trusting us!
            </button>
            <Link
              to={'/'}
              className="w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
