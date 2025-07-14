const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fssync = require('fs'); // For existsSync only

const app = express();

// Create upload folder if not exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fssync.existsSync(uploadDir)) fssync.mkdirSync(uploadDir, { recursive: true });

// Create data folder to store JSON info
const dataFile = path.join(__dirname, 'data', 'images.json');
if (!fssync.existsSync(path.dirname(dataFile))) fssync.mkdirSync(path.dirname(dataFile), { recursive: true });
if (!fssync.existsSync(dataFile)) fssync.writeFileSync(dataFile, '[]');

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ROUTES:

// Home Page (static)
app.get(['/index', '/index.html'], (req, res) => {
  res.redirect('/');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload Form Page
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Handle Upload (async/await + error handling)
app.post('/uploaded', upload.single('photo'), async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');
    if (!name) return res.status(400).send('Name is required');

    const newEntry = {
      name,
      url: `/uploads/${file.filename}`
    };

    let images = [];
    try {
      const data = await fs.readFile(dataFile, 'utf-8');
      images = JSON.parse(data);
    } catch (err) {
      images = [];
    }
    images.push(newEntry);
    await fs.writeFile(dataFile, JSON.stringify(images, null, 2));
    res.render('success', { name, photo: file.filename });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// API Endpoint (async/await)
app.get('/api/images', async (req, res) => {
  try {
    let images = [];
    if (fssync.existsSync(dataFile)) {
      const data = await fs.readFile(dataFile, 'utf-8');
      images = JSON.parse(data);
    }
    res.json(images);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Failed to load images' });
  }
});

// DELETE endpoint for image
app.delete('/api/images/:filename', async (req, res) => {
  const filename = req.params.filename;
  if (!filename) return res.status(400).json({ error: 'No filename provided' });
  const filePath = path.join(uploadDir, filename);
  try {
    // Remove file from disk
    if (fssync.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
    // Remove from JSON
    let images = [];
    if (fssync.existsSync(dataFile)) {
      const data = await fs.readFile(dataFile, 'utf-8');
      images = JSON.parse(data);
    }
    const newImages = images.filter(img => !(img.url && img.url.endsWith('/' + filename)));
    await fs.writeFile(dataFile, JSON.stringify(newImages, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// About page
app.get('/about', (req, res) => {
  res.render('about');
});

// Material page
app.get('/material', (req, res) => {
  res.render('material');
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Help page
app.get('/help', (req, res) => {
  res.render('help');
});

// Admin page
app.get('/admin', (req, res) => {
  res.render('admin');
});

// Update image name
app.put('/api/images/:filename', async (req, res) => {
  const filename = req.params.filename;
  const { name } = req.body;
  if (!filename || !name) return res.status(400).json({ error: 'Filename and name required' });
  try {
    let images = [];
    if (fssync.existsSync(dataFile)) {
      const data = await fs.readFile(dataFile, 'utf-8');
      images = JSON.parse(data);
    }
    let updated = false;
    images = images.map(img => {
      if (img.url && img.url.endsWith('/' + filename)) {
        updated = true;
        return { ...img, name };
      }
      return img;
    });
    if (!updated) return res.status(404).json({ error: 'Image not found' });
    await fs.writeFile(dataFile, JSON.stringify(images, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
