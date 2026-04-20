const jwt = require('jsonwebtoken');
const ms = require('ms');

const AUTH_COOKIE_NAME = 'bb_access_token';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  if (!secret) {
    if (isProd) {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'dev-only-insecure-jwt-secret-min-32-chars!!';
  }
  if (isProd && secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters in production'
    );
  }
  return secret;
}

function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

/**
 * Cookie maxAge must align with JWT expiry so the browser does not keep an expired cookie.
 */
function getAuthCookieMaxAgeMs() {
  const exp = getExpiresIn();
  const value = ms(exp);
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return ms('7d');
  }
  return value;
}

/**
 * httpOnly JWT cookie. Use env to tune SameSite/Secure for your deployment (SPA + API on different origins may need SameSite=None; Secure).
 */
function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && isProd);
  const sameSite = (process.env.COOKIE_SAME_SITE || (isProd ? 'strict' : 'lax'))
    .toLowerCase();

  const allowed = ['strict', 'lax', 'none'];
  const normalized = allowed.includes(sameSite) ? sameSite : 'lax';
  const secureFinal = normalized === 'none' ? true : secure;

  return {
    httpOnly: true,
    secure: secureFinal,
    sameSite: normalized,
    path: '/',
    maxAge: getAuthCookieMaxAgeMs(),
  };
}

function signAuthToken(userId, email) {
  const secret = getJwtSecret();
  const expiresIn = getExpiresIn();
  return jwt.sign(
    { sub: userId, email },
    secret,
    { expiresIn, algorithm: 'HS256' }
  );
}

function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthCookieMaxAgeMs,
  signAuthToken,
  verifyAuthToken,
};
