const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware
 * Extracts and verifies JWT from Authorization header
 * Attaches user object to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.',
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication — doesn't fail if no token,
 * but attaches user if valid token is present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch {
      // Token invalid — continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, optionalAuth };
