const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config(); // Load .env file
const db = require('./db');

// Configuration
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || '';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || String(100 * 1024 * 1024), 10); // default 100MB
const ALLOWED_EXT = ['.apk', '.zip', '.aab', '.jar'];
const ALLOWED_BOOK_EXT = ['.pdf', '.epub'];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  }
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isAllowedFile(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return ALLOWED_EXT.includes(ext);
}

app.post('/upload', upload.single('appFile'), (req, res) => {
  // If an API key is configured, require it via header or form field
  if (UPLOAD_API_KEY) {
    const provided = (req.get('x-api-key') || req.body.apiKey || '').trim();
    if (!provided || provided !== UPLOAD_API_KEY) {
      // remove uploaded file if present
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }
  }

  try {
    const { name = '', email = '', appName = '', description = '' } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    if (!isAllowedFile(file.originalname)) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ success: false, message: 'File type not allowed' });
    }

    // Basic sanitization/trimming
    const safeName = String(name).slice(0, 100);
    const safeEmail = String(email).slice(0, 200);
    const safeAppName = String(appName).slice(0, 150);
    const safeDescription = String(description).slice(0, 1000);

    db.run(
      `INSERT INTO applications (name, email, appName, description, filename, originalName, mimetype, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeName, safeEmail, safeAppName, safeDescription, file.filename, file.originalname, file.mimetype, file.size],
      function (err) {
        if (err) {
          console.error('DB insert error', err);
          return res.status(500).json({ success: false, message: 'DB error' });
        }

        res.json({ success: true, id: this.lastID, message: 'Upload stored' });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/applications', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const search = String(req.query.search || '').trim().slice(0, 100);
  const offset = (page - 1) * limit;

  let where = '';
  const params = [];
  if (search) {
    where = ' WHERE appName LIKE ? OR description LIKE ? OR name LIKE ? OR email LIKE ?';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  db.get(`SELECT COUNT(*) as total FROM applications${where}`, params, (err, countRow) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });

    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    db.all(
      `SELECT id, name, email, appName, description, filename, originalName, mimetype, size, created_at FROM applications${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ 
          success: true, 
          applications: rows,
          pagination: { page, limit, total, totalPages }
        });
      }
    );
  });
});

app.delete('/applications/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, message: 'Invalid ID' });

  db.get('SELECT filename FROM applications WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ success: false, message: 'Not found' });

    db.run('DELETE FROM applications WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });

      // Also delete the file from disk
      if (row.filename) {
        fs.unlink(path.join(UPLOAD_DIR, row.filename), (unlinkErr) => {
          if (unlinkErr) console.error('File delete error:', unlinkErr);
        });
      }

      res.json({ success: true, message: 'Deleted' });
    });
  });
});

// Books endpoints
function isAllowedBookFile(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return ALLOWED_BOOK_EXT.includes(ext);
}

app.post('/books', upload.single('bookFile'), (req, res) => {
  try {
    const { author = '', email = '', bookTitle = '', description = '', bookLink = '' } = req.body;
    const file = req.file;
    const isExternal = bookLink && bookLink.trim() ? 1 : 0;

    // Must provide either a file or a link
    if (!file && !bookLink) {
      return res.status(400).json({ success: false, message: 'Please upload a file or provide a book link' });
    }

    // If file is provided, validate it
    if (file) {
      if (!isAllowedBookFile(file.originalname)) {
        fs.unlink(file.path, () => {});
        return res.status(400).json({ success: false, message: 'File type not allowed (PDF or EPUB only)' });
      }
    }

    // Validate external link format if provided
    if (bookLink) {
      try {
        new URL(bookLink);
      } catch {
        if (file) fs.unlink(file.path, () => {});
        return res.status(400).json({ success: false, message: 'Invalid book link URL' });
      }
    }

    const safeAuthor = String(author).slice(0, 100);
    const safeEmail = String(email).slice(0, 200);
    const safeBookTitle = String(bookTitle).slice(0, 150);
    const safeDescription = String(description).slice(0, 1000);
    const safeBookLink = String(bookLink).slice(0, 500);

    db.run(
      `INSERT INTO books (author, email, bookTitle, description, filename, originalName, mimetype, size, bookLink, isExternal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [safeAuthor, safeEmail, safeBookTitle, safeDescription, file ? file.filename : null, file ? file.originalname : null, file ? file.mimetype : null, file ? file.size : 0, safeBookLink, isExternal],
      function (err) {
        if (err) {
          console.error('DB insert error', err);
          if (file) fs.unlink(file.path, () => {});
          return res.status(500).json({ success: false, message: 'DB error' });
        }

        res.json({ success: true, id: this.lastID, message: isExternal ? 'Book link added' : 'Book uploaded' });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/books', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const search = String(req.query.search || '').trim().slice(0, 100);
  const offset = (page - 1) * limit;

  let where = '';
  const params = [];
  if (search) {
    where = ' WHERE bookTitle LIKE ? OR description LIKE ? OR author LIKE ? OR email LIKE ?';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  db.get(`SELECT COUNT(*) as total FROM books${where}`, params, (err, countRow) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });

    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    db.all(
      `SELECT id, author, email, bookTitle, description, filename, originalName, mimetype, size, bookLink, isExternal, created_at FROM books${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ 
          success: true, 
          books: rows,
          pagination: { page, limit, total, totalPages }
        });
      }
    );
  });
});

app.delete('/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false, message: 'Invalid ID' });

  db.get('SELECT filename FROM books WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ success: false, message: 'Not found' });

    db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });

      if (row.filename) {
        fs.unlink(path.join(UPLOAD_DIR, row.filename), (unlinkErr) => {
          if (unlinkErr) console.error('File delete error:', unlinkErr);
        });
      }

      res.json({ success: true, message: 'Deleted' });
    });
  });
});

app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
