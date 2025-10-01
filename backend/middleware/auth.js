const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  // Read access token from httpOnly cookie
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: 'No access token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.userId = decoded.id; // attach user id to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Access token is not valid' });
  }
};
