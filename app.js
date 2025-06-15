const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serves static files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Route: Upload form
app.get('/upload', (req, res) => {
  res.render('upload');  // ✅ This renders views/upload.ejs
});


// Route: Handle upload POST
app.post('/uploaded', upload.single('photo'), (req, res) => {
  const name = req.body.name;
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const photo = req.file.filename;
  const newEntry = {
    name,
    url: `/uploads/${photo}`
  };

  const dataFile = path.join(uploadDir, 'data.json');
  let imageData = [];

  if (fs.existsSync(dataFile)) {
    const json = fs.readFileSync(dataFile);
    imageData = JSON.parse(json);
  }

  imageData.push(newEntry);
  fs.writeFileSync(dataFile, JSON.stringify(imageData, null, 2));

  res.render('success', { name, photo });
});

// API: Serve uploaded images as JSON
app.get('/api/images', (req, res) => {
  const dataFile = path.join(uploadDir, 'data.json');
  if (fs.existsSync(dataFile)) {
    const json = fs.readFileSync(dataFile);
    res.json(JSON.parse(json));
  } else {
    res.json([]);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
