/**
 * Role-Based Access Control middleware
 * Usage: authorize('society_admin', 'college_admin')
 * Checks if the authenticated user's role is in the allowed list
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or is an admin
 * Used for edit/delete operations
 */
const authorizeOwnerOrAdmin = (getOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // College admins can always access
    if (req.user.role === 'college_admin') {
      return next();
    }

    // Check ownership
    const ownerId = getOwnerId(req);
    if (ownerId && ownerId.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not own this resource.',
    });
  };
};

module.exports = { authorize, authorizeOwnerOrAdmin };
