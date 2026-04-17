require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const connectDB = require('./config/database');
const redisClient = require('./config/redis');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const premiumRoutes = require('./routes/premium');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/premium', premiumRoutes);

// 404 Handler
app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();
    console.log('✅ MongoDB & Redis Connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`📱 Test: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Server Error:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await redisClient.quit();
  console.log('👋 Server stopped');
  process.exit(0);
});