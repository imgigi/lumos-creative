const { put, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_KEY = 'lumos-data.json';

function checkAuth(req) {
  const token = req.headers['x-admin-token'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lumos2024';
  const expectedToken = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
  return token === expectedToken;
}

module.exports = async function handler(req, res) {
  // CORS for admin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (req.method === 'GET') {
    // Try reading from Vercel Blob
    try {
      const { blobs } = await list({ prefix: DATA_KEY, token });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url);
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('Blob read error:', e.message);
    }

    // Fallback: seed from bundled file, then store it in Blob
    const seedPath = path.join(process.cwd(), 'data-seed.json');
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    try {
      await put(DATA_KEY, JSON.stringify(seed), {
        access: 'public', addRandomSuffix: false, token,
      });
    } catch (e) {
      console.error('Blob seed write error:', e.message);
    }
    return res.json(seed);
  }

  if (req.method === 'POST') {
    if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await put(DATA_KEY, JSON.stringify(req.body), {
        access: 'public', addRandomSuffix: false, token,
      });
      return res.json({ success: true });
    } catch (e) {
      console.error('Blob write error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
