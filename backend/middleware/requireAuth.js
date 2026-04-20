const User = require('../models/User');
const { AUTH_COOKIE_NAME, verifyAuthToken } = require('../utils/authTokens');

/**
 * Requires a valid JWT in the httpOnly auth cookie. Attaches `req.user` with id, email, and profile fields.
 */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(payload.sub).select('email name createdAt updatedAt');
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication required' });
  }
}

module.exports = { requireAuth };
