import Coupon from '../models/coupon.model.js';
import Order from '../models/order.model.js';
import { stripe } from '../lib/stripe.js';

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: 'Invalid or empty products array' });
    }

    // Validate user
    if (!req.user?._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      if (!product.price || !product.name) {
        throw new Error('Invalid product data');
      }

      const amount = Math.round(product.price * 100);
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: 'myr',
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    // Get coupon if couponCode is provided
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || '',
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Only try to create a new coupon if total amount is high enough
    if (totalAmount >= 20000) {
      try {
        await createNewCoupon(req.user._id);
      } catch (couponError) {
        // Log the error but don't fail the checkout
        console.error('Error creating coupon:', couponError);
      }
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({
      message: 'Error processing checkout',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Check if an order with this sessionId already exists
    const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already processed',
        orderId: existingOrder._id,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      //create a new order
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100, //convert from cents to ringgit
        stripeSessionId: sessionId,
      });

      await newOrder.save();
      res.status(200).json({
        success: true,
        message:
          'Payment successful, order created, and coupon deactivated if used',
        orderId: newOrder._id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }
  } catch (error) {
    console.log('Error processing successful checkout:', error);
    res.status(500).json({
      message: 'Error processing successful checkout',
      error: error.message,
    });
  }
};

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: 'once',
  });

  return coupon.id;
}

async function createNewCoupon(userId) {
  try {
    // Check if user already has a coupon
    const existingCoupon = await Coupon.findOne({
      userId: userId,
      isActive: true,
    });

    if (existingCoupon) {
      // User already has an active coupon, no need to create a new one
      return existingCoupon;
    }

    // Create a new coupon if user doesn't have an active one
    const newCoupon = new Coupon({
      code: 'GIFT' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      userId: userId,
    });

    await newCoupon.save();
    return newCoupon;
  } catch (error) {
    console.error('Error creating coupon:', error);
    // Return null instead of throwing an error to prevent checkout failure
    return null;
  }
}
