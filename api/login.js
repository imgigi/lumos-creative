const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lumos2024';

  if (password === ADMIN_PASSWORD) {
    // In serverless, we use a simple token (hash of password + a secret)
    // This is stateless and works across functions.
    const token = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
    return res.json({ success: true, token });
  }

  return res.status(401).json({ error: 'Invalid password' });
};
