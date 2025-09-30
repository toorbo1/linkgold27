// Простое хранилище в памяти (в продакшене используйте базу данных)
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

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - получить все посты
  if (req.method === 'GET') {
    return res.json(posts);
  }

  // POST - создать новый пост
  if (req.method === 'POST') {
    try {
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
      return res.json(newPost);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE - удалить пост
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Post ID is required' });
      }

      const postId = parseInt(id);
      const initialLength = posts.length;
      posts = posts.filter(post => post.id !== postId);
      
      if (posts.length === initialLength) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
};