const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Данные в памяти (для демонстрации)
let posts = [
  {
    id: 1,
    title: 'Добро пожаловать в наше сообщество!',
    content: 'Мы рады приветствовать вас в нашем Telegram-сообществе.',
    author_id: 8036875641,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Как работает реферальная система',
    content: 'Приглашайте друзей и получайте бонусы за каждого приглашенного пользователя!',
    author_id: 8036875641,
    created_at: new Date().toISOString()
  }
];

let users = [];
const ADMIN_ID = 8036875641;

// API Routes
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const { title, content, author_id } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newPost = {
    id: posts.length + 1,
    title,
    content,
    author_id,
    created_at: new Date().toISOString()
  };

  posts.unshift(newPost);
  res.json({ id: newPost.id, message: 'Post created successfully' });
});

app.delete('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const initialLength = posts.length;
  
  posts = posts.filter(post => post.id !== postId);
  
  if (posts.length === initialLength) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  res.json({ message: 'Post deleted successfully' });
});

app.post('/api/users', (req, res) => {
  const { telegram_id, first_name, last_name, username, photo_url } = req.body;
  
  if (!telegram_id) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  // Проверяем, существует ли пользователь
  let user = users.find(u => u.telegram_id === telegram_id);
  
  if (!user) {
    user = {
      id: users.length + 1,
      telegram_id,
      first_name,
      last_name,
      username,
      photo_url,
      referral_code: `ref_${telegram_id}_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    users.push(user);
  }

  res.json({ 
    ...user,
    message: 'User registered successfully' 
  });
});

app.get('/api/users/:telegram_id/referrals', (req, res) => {
  // Простая демо-статистика
  const stats = {
    referral_count: Math.floor(Math.random() * 10),
    bonus: Math.floor(Math.random() * 100)
  };

  res.json(stats);
});

// Health check - ОБЯЗАТЕЛЬНО ДЛЯ RAILWAY
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running successfully',
    posts_count: posts.length,
    users_count: users.length
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server - ВАЖНО: слушаем на 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Open in browser: http://localhost:${PORT}`);
  console.log(`👤 Admin ID: ${ADMIN_ID}`);
});