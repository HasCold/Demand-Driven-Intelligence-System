const express = require('express');
const rateLimit = require('express-rate-limit');
const { signUp, signIn, signOut, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

const authWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

router.post('/signup', authWriteLimiter, signUp);
router.post('/signin', authWriteLimiter, signIn);
router.post('/signout', signOut);
router.get('/me', requireAuth, me);

module.exports = router;
