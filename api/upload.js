const { put } = require('@vercel/blob');
const crypto = require('crypto');

function checkAuth(req) {
  const token = req.headers['x-admin-token'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lumos2024';
  const expectedToken = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
  return token === expectedToken;
}

// Disable body parsing so we can stream the raw file to Blob
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Use PUT' });
  }

  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const filename = req.query.filename;
  if (!filename) {
    return res.status(400).json({ error: 'Missing ?filename=' });
  }

  try {
    const blob = await put(filename, req, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return res.json({ url: blob.url });
  } catch (e) {
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};

module.exports.config = {
  api: { bodyParser: false },
};
