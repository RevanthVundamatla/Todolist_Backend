const Razorpay = require('razorpay');
const User = require('../models/User');
const PremiumPurchase = require('../models/PremiumPurchase');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
  try {
    const amount = 49900; // ₹499

    const order = await rzp.orders.create({
      amount,
      currency: 'INR',
      receipt: `premium_${Date.now()}`,
    });

    const purchase = new PremiumPurchase({
      userId: req.user.userId,
      razorpayOrderId: order.id,
      amount: amount / 100
    });
    await purchase.save();

    res.json({ 
      key: process.env.RAZORPAY_KEY_ID,
      order,
      name: 'Todo App Premium'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const purchase = await PremiumPurchase.findOne({ razorpayOrderId: razorpay_order_id });

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      purchase.status = 'failed';
      await purchase.save();
      return res.status(400).json({ message: 'Invalid signature' });
    }

    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.status = 'successful';
    purchase.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await purchase.save();

    const user = await User.findById(purchase.userId);
    user.isPremium = true;
    user.premiumUntil = purchase.validUntil;
    await user.save();

    res.json({ message: 'Premium activated! 🎉' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};