const express = require('express');
const path = require('path');

const app = express();
// Railway использует порт 8080 как указано в настройках
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting Telegram Community App...');
console.log('📊 Environment PORT:', process.env.PORT);
console.log('🔧 Using PORT:', PORT);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Данные в памяти
let posts = [
  {
    id: 1,
    title: 'Добро пожаловать в наше сообщество!',
    content: 'Мы рады приветствовать вас в нашем Telegram-сообществе. Здесь вы найдете интересные новости и сможете общаться с единомышленниками.',
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

const ADMIN_ID = 8036875641;

// Health check - ОБЯЗАТЕЛЬНО для Railway
app.get('/health', (req, res) => {
  console.log('✅ Health check received');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Telegram Community Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    posts_count: posts.length,
    admin_id: ADMIN_ID
  });
});

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
    id: Date.now(),
    title,
    content,
    author_id,
    created_at: new Date().toISOString()
  };

  posts.unshift(newPost);
  res.json({ message: 'Post created successfully', post: newPost });
});

app.delete('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const initialLength = posts.length;
  posts = posts.filter(post => post.id !== postId);
  
  if (posts.length < initialLength) {
    res.json({ message: 'Post deleted successfully' });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/users', (req, res) => {
  const { telegram_id, first_name, last_name, username, photo_url } = req.body;
  
  if (!telegram_id) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  const user = {
    id: telegram_id,
    telegram_id,
    first_name: first_name || 'User',
    last_name: last_name || '',
    username: username || '',
    photo_url: photo_url || '',
    referral_code: `ref_${telegram_id}`,
    created_at: new Date().toISOString()
  };

  res.json(user);
});

app.get('/api/users/:telegram_id/referrals', (req, res) => {
  // Демо-статистика
  const stats = {
    referral_count: Math.floor(Math.random() * 15),
    bonus: Math.floor(Math.random() * 150)
  };

  res.json(stats);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server - ВАЖНО: 0.0.0.0 для Docker
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 Telegram Community Server successfully started!');
  console.log(`📍 Server running on: 0.0.0.0:${PORT}`);
  console.log(`🌐 External URL: https://linkgold27-production.up.railway.app`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Process env PORT: ${process.env.PORT}`);
  console.log(`👤 Admin ID: ${ADMIN_ID}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});