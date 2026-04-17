const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: String,
  amount: { type: Number, required: true },
  status: { type: String, enum: ['created', 'successful', 'failed'], default: 'created' },
  validUntil: Date
}, { timestamps: true });

module.exports = mongoose.model('PremiumPurchase', schema);