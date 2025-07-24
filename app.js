const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ==== Ensure 'uploads/' folder exists ====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ==== Configure Multer ====
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ==== Middleware ====
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 } // 24 hours
}));

// ==== Set View Engine ====
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// ==== Routes ====

// Home Page (Upload Interface)
app.get('/', (req, res) => {
    res.render('index');
});

// Handle File Upload
app.post('/upload', upload.array('uploaded_files', 20), (req, res) => {
    res.send('<h2>Files uploaded successfully! <a href="/">Go back</a></h2>');
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login
app.post('/login', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.send('<h2>Incorrect Password! <a href="/login">Try Again</a></h2>');
    }
});

// Admin Panel
app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');

    fs.readdir('uploads', (err, files) => {
        if (err) return res.send('Error reading files.');
        const images = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        res.render('admin', { files: images });
    });
});

// Handle File Deletion
app.post('/delete', (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send('Forbidden');

    const filename = req.body.filename;
    const filepath = path.join(__dirname, 'uploads', filename);

    fs.unlink(filepath, err => {
        if (err) return res.status(500).send('File not found or cannot be deleted.');
        res.redirect('/admin');
    });
});

// ==== Start Server ====
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
