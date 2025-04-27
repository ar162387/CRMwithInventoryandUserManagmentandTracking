const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  let token = req.header('x-auth-token');

  // If no token in x-auth-token header, check Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Add user payload to request object
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 