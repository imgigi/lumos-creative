const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(DATA_FILE)) {
  console.error('data.json not found.');
  process.exit(1);
}

// ---------- SSE: push changes to all connected frontends ----------
let sseClients = [];
let dataVersion = Date.now();

function broadcast() {
  dataVersion = Date.now();
  sseClients.forEach(res => res.write(`data: ${dataVersion}\n\n`));
}

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${dataVersion}\n\n`);
  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// ---------- Middleware ----------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Generic upload (profile photo etc.) ----------
const genericStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(IMAGES_DIR, 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E6) + path.extname(file.originalname));
  }
});
const uploadGeneric = multer({ storage: genericStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// ---------- Project-specific upload (images go straight into the project folder) ----------
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.params.folder;
    const dir = path.join(IMAGES_DIR, 'projects', folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E6) + path.extname(file.originalname));
  }
});
const uploadProject = multer({ storage: projectStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// ========== API ==========

// Data CRUD
app.get('/api/data', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
});

app.post('/api/data', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
  broadcast();                       // notify all frontends
  res.json({ success: true });
});

// Generic upload (profile photo)
app.post('/api/upload', uploadGeneric.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/images/uploads/' + req.file.filename });
});

// Upload images INTO a specific project folder — the key "foolproof" endpoint
app.post('/api/upload/project/:folder', uploadProject.array('images', 50), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files' });
  const folder = req.params.folder;
  const urls = req.files.map(f => `/images/projects/${folder}/${f.filename}`);
  res.json({ urls });
});

// List images in a project folder
app.get('/api/images/:folder', (req, res) => {
  const dir = path.join(IMAGES_DIR, 'projects', req.params.folder);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .sort();
  res.json(files.map(f => `/images/projects/${req.params.folder}/${f}`));
});

// Delete a single image
app.delete('/api/images', (req, res) => {
  const urlPath = req.body.url;            // e.g. "/images/projects/olympic/1.jpg"
  if (!urlPath) return res.status(400).json({ error: 'Missing url' });
  const filePath = path.join(__dirname, '..', 'public', urlPath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

// ========== Pages ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LUMOS CREATIVE  →  http://localhost:${PORT}`);
  console.log(`Admin panel     →  http://localhost:${PORT}/admin`);
});
