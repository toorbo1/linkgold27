const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Инициализация базы данных
const db = new sqlite3.Database(':memory:');

// Инициализация таблиц
db.serialize(() => {
  // Таблица пользователей
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

  // Таблица постов
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица рефералов
  db.run(`CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER,
    referred_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users (id),
    FOREIGN KEY (referred_id) REFERENCES users (id)
  )`);

  // Добавляем тестовые данные
  const adminId = 8036875641;
  
  // Тестовый администратор
  db.run(`INSERT OR IGNORE INTO users (telegram_id, first_name, last_name, username, referral_code) 
          VALUES (?, ?, ?, ?, ?)`, 
          [adminId, 'Admin', 'User', 'admin', 'admin_ref']);

  // Тестовые посты
  db.run(`INSERT OR IGNORE INTO posts (title, content, author_id) VALUES 
          ('Добро пожаловать в наше сообщество!', 'Мы рады приветствовать вас в нашем Telegram-сообществе. Здесь вы найдете много интересной информации и сможете общаться с единомышленниками.', ?)`, 
          [adminId]);
  
  db.run(`INSERT OR IGNORE INTO posts (title, content, author_id) VALUES 
          ('Обновление системы рефералов', 'Мы улучшили нашу реферальную систему. Теперь за каждого приглашенного друга вы получаете дополнительные бонусы.', ?)`, 
          [adminId]);
});

// Роуты для API

// Получить все посты
app.get('/api/posts', (req, res) => {
  db.all(`SELECT p.*, u.first_name, u.last_name 
          FROM posts p 
          LEFT JOIN users u ON p.author_id = u.telegram_id 
          ORDER BY p.created_at DESC`, 
          (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Создать новый пост
app.post('/api/posts', (req, res) => {
  const { title, content, author_id } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(`INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)`,
         [title, content, author_id], 
         function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: 'Post created successfully' });
  });
});

// Регистрация/логин пользователя
app.post('/api/users', (req, res) => {
  const { telegram_id, first_name, last_name, username, photo_url, referral_code } = req.body;
  
  if (!telegram_id) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  // Генерируем реферальный код если не предоставлен
  const userReferralCode = referral_code || `ref_${telegram_id}_${Date.now()}`;

  db.run(`INSERT OR REPLACE INTO users 
          (telegram_id, first_name, last_name, username, photo_url, referral_code) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [telegram_id, first_name, last_name, username, photo_url, userReferralCode], 
          function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      id: this.lastID, 
      telegram_id,
      referral_code: userReferralCode,
      message: 'User registered successfully' 
    });
  });
});

// Получить пользователя по Telegram ID
app.get('/api/users/:telegram_id', (req, res) => {
  const telegramId = req.params.telegram_id;
  
  db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(row);
  });
});

// Получить реферальную статистику
app.get('/api/users/:telegram_id/referrals', (req, res) => {
  const telegramId = req.params.telegram_id;
  
  db.get(`SELECT COUNT(*) as referral_count FROM referrals r 
          JOIN users u ON r.referrer_id = u.id 
          WHERE u.telegram_id = ?`, [telegramId], (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Рассчитываем бонусы (простая логика: 10 очков за каждого реферала)
    const bonus = countRow.referral_count * 10;

    res.json({
      referral_count: countRow.referral_count,
      bonus: bonus
    });
  });
});

// Добавить реферала
app.post('/api/referrals', (req, res) => {
  const { referrer_telegram_id, referred_telegram_id } = req.body;
  
  if (!referrer_telegram_id || !referred_telegram_id) {
    return res.status(400).json({ error: 'Referrer and referred IDs are required' });
  }

  // Находим ID пользователей в нашей базе
  db.get(`SELECT id FROM users WHERE telegram_id = ?`, [referrer_telegram_id], (err, referrer) => {
    if (err || !referrer) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    db.get(`SELECT id FROM users WHERE telegram_id = ?`, [referred_telegram_id], (err, referred) => {
      if (err || !referred) {
        return res.status(404).json({ error: 'Referred user not found' });
      }

      db.run(`INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)`,
             [referrer.id, referred.id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ id: this.lastID, message: 'Referral added successfully' });
      });
    });
  });
});

// Обслуживание статических файлов
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Admin ID: 8036875641`);
});