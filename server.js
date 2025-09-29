const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Инициализация базы данных
const db = new sqlite3.Database('database.sqlite');

// Инициализация таблиц
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER,
    referred_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Тестовые данные
  const adminId = 8036875641;
  
  db.run(`INSERT OR IGNORE INTO users (telegram_id, first_name, last_name, username, referral_code) 
          VALUES (?, ?, ?, ?, ?)`, 
          [adminId, 'Admin', 'User', 'admin', 'admin_ref']);

  db.run(`INSERT OR IGNORE INTO posts (title, content, author_id) VALUES 
          ('Добро пожаловать!', 'Рады видеть вас в нашем сообществе.', ?)`, 
          [adminId]);
});

// API Routes
app.get('/api/posts', (req, res) => {
  db.all(`SELECT * FROM posts ORDER BY created_at DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/posts', (req, res) => {
  const { title, content, author_id } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(`INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)`,
         [title, content, author_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: 'Post created' });
  });
});

app.post('/api/users', (req, res) => {
  const { telegram_id, first_name, last_name, username, photo_url } = req.body;
  
  if (!telegram_id) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  const referral_code = `ref_${telegram_id}_${Date.now()}`;

  db.run(`INSERT OR REPLACE INTO users 
          (telegram_id, first_name, last_name, username, photo_url, referral_code) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [telegram_id, first_name, last_name, username, photo_url, referral_code], 
          function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      id: this.lastID, 
      telegram_id,
      referral_code,
      message: 'User registered' 
    });
  });
});

app.get('/api/users/:telegram_id/referrals', (req, res) => {
  const telegramId = req.params.telegram_id;
  
  db.get(`SELECT COUNT(*) as referral_count FROM referrals r 
          JOIN users u ON r.referrer_id = u.id 
          WHERE u.telegram_id = ?`, [telegramId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const bonus = (row?.referral_count || 0) * 10;

    res.json({
      referral_count: row?.referral_count || 0,
      bonus: bonus
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`👤 Admin ID: 8036875641`);
});