import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Debug log: check incoming auth header
    console.log('Authorization Header:', req.headers.authorization);

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded JWT:', decoded);

    const user = await User.findById(decoded.userId)
      .select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (user.isLocked && user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed attempts.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication Error:', err);

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export const requirePremium = (req, res, next) => {
  const isPremiumActive =
    req.user?.isPremium &&
    (!req.user?.premiumExpiresAt ||
      new Date(req.user.premiumExpiresAt) > new Date());

  if (!isPremiumActive) {
    return res.status(403).json({
      success: false,
      message: 'This feature requires an active premium subscription.',
    });
  }

  next();
};
