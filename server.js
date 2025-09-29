const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Данные в памяти
let posts = [];
let users = [];
const ADMIN_ID = 8036875641;

// Health check (ОБЯЗАТЕЛЬНО для Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    posts: posts.length,
    users: users.length
  });
});

// API Routes
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  try {
    const { title, content, author_id } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const newPost = {
      id: Date.now(),
      title,
      content,
      author_id,
      created_at: new Date().toISOString()
    };

    posts.unshift(newPost);
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    posts = posts.filter(post => post.id !== postId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { telegram_id, first_name, last_name, username } = req.body;
    
    let user = users.find(u => u.telegram_id === telegram_id);
    if (!user) {
      user = {
        id: telegram_id,
        telegram_id,
        first_name,
        last_name,
        username,
        created_at: new Date().toISOString()
      };
      users.push(user);
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 Main: http://localhost:${PORT}`);
});