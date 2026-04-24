import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  monthly: { amount: 9900, duration: 30, label: '1 Month' },
  quarterly: { amount: 24900, duration: 90, label: '3 Months' },
  yearly: { amount: 79900, duration: 365, label: '1 Year' },
};

export const createOrder = async (req, res) => {
  try {
    const { plan = 'monthly' } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required.',
      });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected.',
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay configuration is missing.',
      });
    }

    const selectedPlan = PLANS[plan];

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: 'INR',
      receipt: `receipt_${req.user._id}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        plan,
        email: req.user.email,
      },
    });

    await User.findByIdAndUpdate(req.user._id, {
      razorpayOrderId: order.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: selectedPlan.label,
        keyId: process.env.RAZORPAY_KEY_ID,
        user: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (err) {
    console.error('Create Order Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create payment order.',
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan = 'monthly',
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required.',
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment details incomplete.',
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    const selectedPlan = PLANS[plan] || PLANS.monthly;
    const premiumExpiresAt = new Date(
      Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumExpiresAt,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Premium activated! Valid until ${premiumExpiresAt.toDateString()}.`,
      data: {
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (err) {
    console.error('Verify Payment Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed.',
    });
  }
};

export const getPlans = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      plans: Object.entries(PLANS).map(([key, val]) => ({
        id: key,
        label: val.label,
        amount: val.amount,
        amountFormatted: `₹${(val.amount / 100).toFixed(2)}`,
        duration: val.duration,
      })),
      features: {
        free: ['Up to 10 todos', 'Basic priority levels', 'Status tracking'],
        premium: [
          'Unlimited todos',
          'Advanced priority levels',
          'Tags and categories',
          'Due date reminders',
          'Bulk actions',
          'Export todos',
          'Priority support',
        ],
      },
    },
  });
};

export const getPaymentStatus = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required.',
    });
  }

  const isPremiumActive =
    user.isPremium &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  return res.status(200).json({
    success: true,
    data: {
      isPremium: isPremiumActive,
      premiumExpiresAt: user.premiumExpiresAt,
      daysRemaining: user.premiumExpiresAt
        ? Math.max(
            0,
            Math.ceil(
              (user.premiumExpiresAt - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
    },
  });
};
