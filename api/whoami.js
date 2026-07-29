const { getSession } = require('./_auth');

module.exports = async function handler(req, res) {
  const login = getSession(req);
  res.status(200).json({ login: login || null });
};
