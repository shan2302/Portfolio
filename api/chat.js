const { handleChat } = require('../server');

module.exports = async function chat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to send a chat message.' });
  }
  return handleChat(req, res);
};
