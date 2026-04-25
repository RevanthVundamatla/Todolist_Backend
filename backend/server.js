import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from './src/config/passport.js';

import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import todoRoutes from './src/routes/todoRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// DB
connectDB();

// trust proxy (Render fix)
app.set('trust proxy', 1);

// security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

//
// 🚀 FIXED CORS (IMPORTANT PART)
//
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://todo-list-interface--revanthvundamat.replit.app'
];

// CLEAN CORS HANDLER (IMPORTANT FIX)
app.use(
  cors({
    origin: function (origin, callback) {
      // allow tools like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error('CORS Not Allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// passport
app.use(passport.initialize());

// rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests, try again later.',
  },
});

app.use(globalLimiter);

// health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API running',
    time: new Date(),
  });
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/payment', paymentRoutes);

// errors
app.use(notFound);
app.use(errorHandler);

// start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on ${PORT}`);
});

export default app;
