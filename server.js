const express = require('express');
const path = require('path');

const app = express();
// Railway автоматически устанавливает PORT через переменные окружения
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting server...');
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
    content: 'Мы рады приветствовать вас в нашем Telegram-сообществе.',
    author_id: 8036875641,
    created_at: new Date().toISOString()
  }
];

const ADMIN_ID = 8036875641;

// Health check - ОБЯЗАТЕЛЬНО
app.get('/health', (req, res) => {
  console.log('✅ Health check passed');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const { title, content, author_id } = req.body;
  
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    author_id,
    created_at: new Date().toISOString()
  };

  posts.unshift(newPost);
  res.json({ message: 'Post created', post: newPost });
});

app.delete('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  posts = posts.filter(post => post.id !== postId);
  res.json({ message: 'Post deleted' });
});

app.post('/api/users', (req, res) => {
  const { telegram_id, first_name, last_name, username } = req.body;
  
  const user = {
    id: telegram_id,
    telegram_id,
    first_name,
    last_name,
    username,
    referral_code: `ref_${telegram_id}`
  };

  res.json(user);
});

app.get('/api/users/:id/referrals', (req, res) => {
  res.json({
    referral_count: Math.floor(Math.random() * 10),
    bonus: Math.floor(Math.random() * 100)
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ВАЖНО: Railway использует облачной балансировщик нагрузки
// Приложение должно слушать на 0.0.0.0 и порт из process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 Server successfully started!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Process env PORT: ${process.env.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});