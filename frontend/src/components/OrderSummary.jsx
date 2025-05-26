import { motion as Motion } from 'framer-motion';
import { useCartStore } from '../stores/useCartStore';
import { Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(
  'pk_test_51Oe6GeJNlK8eflWDvdt3z98yInVoYOv1qWlyvlyrTFkfOQ96SyKr562XwFmFsBPxJmX7EdspzZjaZ9bp8OydhF4A004Ib2sYpV'
);

const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();

  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);

  const handlePayment = async () => {
    try {
      if (!cart.length) {
        throw new Error('Your cart is empty');
      }

      const stripe = await stripePromise;

      // Add better error logging
      const res = await axios
        .post('/payments/create-checkout-session', {
          products: cart.map((item) => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          couponCode: coupon?.code || null,
        })
        .catch((error) => {
          console.error(
            'Checkout request error:',
            error.response?.data || error.message
          );
          throw error;
        });

      const { id } = res.data;
      if (!id) {
        throw new Error('Failed to create checkout session');
      }

      const result = await stripe.redirectToCheckout({
        sessionId: id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Checkout error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to process checkout'
      );
    }
  };

  return (
    <Motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-emerald-400">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">
              Original price
            </dt>
            <dd className="text-base font-medium text-white">
              -RM {formattedSubtotal}
            </dd>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">Savings</dt>
              <dd className="text-base font-medium text-emerald-400">
                -RM {formattedSavings}
              </dd>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">
                Coupon ({coupon.code})
              </dt>
              <dd className="text-base font-medium text-emerald-400">
                - {coupon.discountPercentage || coupon.discount}%
              </dd>
            </dl>
          )}

          <dl className="flex items-center justify-between gap-4 border-t border-gray-600 pt-2">
            <dt className="text-base font-bold text-white">Total</dt>
            <dd className="text-base font-bold text-emerald-400">
              - {formattedTotal}
            </dd>
          </dl>
        </div>

        <Motion.button
          className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
        >
          Proceed to Checkout
        </Motion.button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </Motion.div>
  );
};

export default OrderSummary;
