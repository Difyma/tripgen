/**
 * Creator Chat API Routes
 * 
 * Временные mock endpoints для creator-chat функциональности.
 * TODO: Заменить на полноценную реализацию с базой данных
 */

const express = require('express');
const router = express.Router();

// GET /api/creator-chat/unread-count
router.get('/unread-count', (req, res) => {
  res.json({ count: 0 });
});

// GET /api/creator-chat/chats
router.get('/chats', (req, res) => {
  res.json({ 
    chats: [],
    pagination: {
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0
    }
  });
});

// GET /api/creator-chat/chats/:id/messages
router.get('/chats/:id/messages', (req, res) => {
  res.json({ 
    messages: [],
    pagination: {
      total: 0,
      page: 1,
      perPage: 50,
      totalPages: 0
    }
  });
});

// POST /api/creator-chat/chats/:id/messages
router.post('/chats/:id/messages', (req, res) => {
  const { id } = req.params;
  const { text, attachments } = req.body;
  
  res.json({
    message: {
      id: Date.now().toString(),
      chatId: id,
      text: text || '',
      attachments: attachments || [],
      senderId: 'creator',
      senderType: 'creator',
      createdAt: new Date().toISOString(),
      isRead: true
    }
  });
});

module.exports = router;
