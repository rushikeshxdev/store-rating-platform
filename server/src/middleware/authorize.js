/**
 * Authorization middleware factory
 * Creates middleware that checks if the authenticated user has one of the allowed roles
 * @param {...string} allowedRoles - One or more roles that are allowed to access the endpoint
 * @returns {Function} Express middleware function
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        }
      });
    }

    next();
  };
}

module.exports = authorize;
