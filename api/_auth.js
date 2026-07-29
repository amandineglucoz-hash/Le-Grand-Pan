// Shared session helpers for the admin API routes.
// Sessions are a signed, expiring cookie — no database needed for a
// small internal tool with a handful of known users.
const crypto = require('crypto');

const COOKIE_NAME = 'lgp_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSessionCookie(login) {
  const payload = JSON.stringify({ login, exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = sign(encoded);
  const value = `${encoded}.${sig}`;
  const secure = process.env.VERCEL_ENV !== 'development' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), decodeURIComponent(p.slice(i + 1).trim())];
    })
  );
}

// Returns the logged-in username, or null if the request has no valid session.
function getSession(req) {
  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  const [encoded, sig] = raw.split('.');
  if (!encoded || !sig) return null;
  let expected;
  try {
    expected = sign(encoded);
  } catch {
    return null;
  }
  // Constant-time compare to avoid timing side-channels.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload.login;
}

function requireSession(req, res) {
  const login = getSession(req);
  if (!login) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return login;
}

module.exports = { createSessionCookie, clearSessionCookie, getSession, requireSession, COOKIE_NAME };
