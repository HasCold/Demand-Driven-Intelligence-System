const User = require('../models/User');
const {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  signAuthToken,
} = require('../utils/authTokens');

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validatePassword(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password is too long';
  return null;
}

function publicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name || '',
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

function setAuthCookie(res, user) {
  const token = signAuthToken(user._id.toString(), user.email);
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
  const opts = getAuthCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: opts.path || '/',
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
  });
}

exports.signUp = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ message: pwErr });

    const nameStr =
      typeof name === 'string' ? name.trim().slice(0, 120) : '';

    const hashedPassword = await User.hashPassword(password);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: nameStr,
    });

    setAuthCookie(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Could not create account' });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (
      typeof password !== 'string' ||
      password.length === 0 ||
      password.length > 128
    ) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password email name createdAt updatedAt'
    );
    const valid = user && (await user.comparePassword(password));
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    setAuthCookie(res, user);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not sign in' });
  }
};

exports.signOut = async (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  return res.json({ user: req.user });
};
