module.exports = function (req, res, next) {
  // Assumes auth middleware has run and attached user to req
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }

  next();
}; 