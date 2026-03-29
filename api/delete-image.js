const { del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Only delete Blob URLs (not static images in /images/)
  if (url.includes('blob.vercel-storage.com')) {
    try {
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (e) {
      console.error('Delete error:', e.message);
    }
  }

  return res.json({ success: true });
};
