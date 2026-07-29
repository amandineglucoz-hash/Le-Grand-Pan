const crypto = require('crypto');
const { createSessionCookie } = require('./_auth');

// Users live in an env var, not in the repo — set ADMIN_USERS in Vercel as:
// [{"login":"amandine","password":"..."},{"login":"collegue","password":"..."}]
function getUsers() {
  const raw = process.env.ADMIN_USERS;
  if (!raw) throw new Error('ADMIN_USERS is not set');
  return JSON.parse(raw);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { login, password } = req.body || {};
  if (!login || !password) {
    res.status(400).json({ error: 'Missing login or password' });
    return;
  }

  let users;
  try {
    users = getUsers();
  } catch (e) {
    res.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  const user = users.find((u) => safeEqual(u.login, login));
  if (!user || !safeEqual(user.password, password)) {
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    return;
  }

  res.setHeader('Set-Cookie', createSessionCookie(login));
  res.status(200).json({ ok: true, login });
};
