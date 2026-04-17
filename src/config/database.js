const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/todo-app`);

    // Auto-create indexes
    const db = conn.connection.db;
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('users').createIndex({ oauthId: 1 }),
      db.collection('todos').createIndex({ userId: 1 }),
      db.collection('todos').createIndex({ userId: 1, completed: 1 }),
      db.collection('todos').createIndex({ dueDate: 1 }),
      db.collection('todos').createIndex({ tags: 1 }),
      db.collection('premium_purchases').createIndex({ userId: 1 }),
      db.collection('premium_purchases').createIndex({ razorpayPaymentId: 1 })
    ]);
    console.log('✅ Indexes Created');
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
    throw error;
  }
};

module.exports = connectDB;