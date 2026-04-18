import { getXBeatApiBase } from './xBeatApi';

const withCreds = { credentials: 'include' };

async function parseJson(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json;
}

/**
 * Uses the same origin as x-beat. Send cookies on every request (httpOnly JWT).
 * If the SPA and API run on different ports, set backend COOKIE_SAME_SITE=none and COOKIE_SECURE=true (localhost is a secure context in modern browsers).
 */
export async function signUp({ email, password, name }) {
  const base = getXBeatApiBase();
  const res = await fetch(`${base}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...withCreds,
    body: JSON.stringify({ email, password, name: name || '' }),
  });
  return parseJson(res);
}

export async function signIn({ email, password }) {
  const base = getXBeatApiBase();
  const res = await fetch(`${base}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...withCreds,
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function signOut() {
  const base = getXBeatApiBase();
  const res = await fetch(`${base}/auth/signout`, {
    method: 'POST',
    ...withCreds,
  });
  return parseJson(res);
}

export async function getMe() {
  const base = getXBeatApiBase();
  const res = await fetch(`${base}/auth/me`, {
    ...withCreds,
  });
  return parseJson(res);
}
