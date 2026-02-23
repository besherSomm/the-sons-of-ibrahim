#!/usr/bin/env node
console.log('1. Starting server...');

try {
  console.log('2. Loading modules...');
  const express = require('express');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const cors = require('cors');
  console.log('3. Modules loaded, loading .env...');
  require('dotenv').config();
  console.log('4. Loading database...');
  const db = require('./db');
  console.log('5. Database loaded');

  const UPLOAD_DIR = path.join(__dirname, 'uploads');
  const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY || '';
  const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || String(100 * 1024 * 1024), 10);

  console.log('6. Creating app...');
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  console.log('7. Creating test endpoint...');
  app.get('/test', (req, res) => {
    res.json({ status: 'ok' });
  });

  console.log('8. Setting up static files...');
  app.use('/uploads', express.static(UPLOAD_DIR));
  app.use(express.static(__dirname));

  console.log('9. Starting listener...');
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`10. Backend listening on http://localhost:${PORT}`);
  });

} catch (err) {
  console.error('ERROR:', err);
  process.exit(1);
}
