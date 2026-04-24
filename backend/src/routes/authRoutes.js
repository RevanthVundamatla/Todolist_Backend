import express from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import {
  register,
  verifyEmail,
  resendOTP,
  login,
  verifyMFA,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getProfile,
  toggleMFA,
} from '../controllers/authController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 5 minutes.',
  },
});

// ====================
// Standard Auth Routes
// ====================
router.post('/register', authLimiter, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.post('/verify-mfa', authLimiter, verifyMFA);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

router.get('/profile', protect, getProfile);
router.patch('/toggle-mfa', protect, toggleMFA);

// ====================
// Google OAuth Routes
// ====================

// Start Google Authentication
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || 'http://localhost:5173'
    }/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        {
          id: req.user._id,
          email: req.user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.redirect(
        `${
          process.env.FRONTEND_URL || 'http://localhost:5173'
        }/oauth-success?token=${token}`
      );
    } catch (error) {
      console.error('Google OAuth Error:', error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || 'http://localhost:5173'
        }/login?error=oauth_token_generation_failed`
      );
    }
  }
);

export default router;
