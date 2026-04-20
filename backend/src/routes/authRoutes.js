import express from 'express';
import rateLimit from 'express-rate-limit';
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
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Please wait 5 minutes.' },
});

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

export default router;
