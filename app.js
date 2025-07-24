const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Static
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

// Session config (24 hour timeout)
app.use(session({
  secret: 'your_secret_key',  // change to a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }  // 24 hours
}));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Middleware: Auth check
function requireLogin(req, res, next) {
  if (req.session && req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/upload', upload.array('uploaded_files', 20), (req, res) => {
  res.send('<h3>✅ Files uploaded! <a href="/">Upload More</a></h3>');
});

// Admin Login Routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = 'rahulcsc'; // change to strong password

  if (password === ADMIN_PASSWORD) {
    req.session.adminLoggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('<h3>❌ Wrong password. <a href="/login">Try again</a></h3>');
  }
});

// Protected admin route
app.get('/admin', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// List files
app.get('/files', requireLogin, (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).json({ error: "Unable to fetch files." });
    res.json(files);
  });
});

// Delete file
app.delete('/delete/:filename', requireLogin, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  if (!filename || filename.includes('..')) {
    return res.status(400).json({ success: false, error: "Invalid filename" });
  }

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
