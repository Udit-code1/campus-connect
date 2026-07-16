const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

/**
 * POST /api/auth/register
 * Create a new user account
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, year, societyName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create user (password hashing handled by pre-save hook)
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'student',
      department: role === 'student' ? department : undefined,
      year: role === 'student' ? year : undefined,
      societyName: role === 'society_admin' ? societyName : undefined,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          societyName: user.societyName,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate with email and password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          avatar: user.avatar,
          skills: user.skills,
          interests: user.interests,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Issue a new access token using a refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
      });
    }
    next(error);
  }
};

/**
 * Google OAuth callback handler
 * Called after successful Google authentication
 */
const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refresh = generateRefreshToken(user);

    // Store refresh token
    user.refreshToken = refresh;
    await user.save();

    // Redirect to frontend with tokens
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
      `${clientUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refresh}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  googleCallback,
  logout,
  getMe,
};
