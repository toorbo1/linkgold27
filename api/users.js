module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST - создать/получить пользователя
  if (req.method === 'POST') {
    try {
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

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
};