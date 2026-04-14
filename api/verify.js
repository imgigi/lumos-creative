const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['x-admin-token'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lumos2024';
  const expectedToken = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

  if (token === expectedToken) {
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
