const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication required: No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication failed: Token expired' });
      }
      return res.status(403).json({ message: 'Authentication failed: Invalid token' });
    }

    // Attach the decoded user payload (e.g., { user: { id: ..., username: ..., role: ... } }) to the request object
    req.user = decoded.user;
    console.log("Auth middleware - User info attached to request:", {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    });
    next();
  });
}

// Middleware to authorize based on roles
function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // This should ideally not happen if authenticateToken runs first
      return res.status(403).json({ message: 'Authorization failed: User role not found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Authorization failed: Access restricted to ${allowedRoles.join(' or ')} roles` });
    }

    next(); // User has the required role
  };
}

module.exports = { authenticateToken, authorizeRole }; 