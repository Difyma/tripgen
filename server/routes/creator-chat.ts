/**
 * Creator Chat API Routes
 * 
 * Реальная реализация с использованием Supabase
 */

import { Router, Request, Response } from 'express';
import { supabase, getUserFromToken } from '../lib/supabase.js';

const router = Router();

// Middleware to authenticate requests
const authenticate = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const user = await getUserFromToken(token);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  (req as any).user = user;
  next();
};

// GET /api/creator-chat/unread-count
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!supabase) {
      return res.json({ count: 0 });
    }

    // Get total unread count for user (as creator or client)
    const { data, error } = await supabase
      .from('creator_chat_messages')
      .select('id', { count: 'exact' })
      .or(`and(recipient_id.eq.${user.id},is_read.eq.false)`)
      .is('read_at', null);

    if (error) {
      console.error('Error getting unread count:', error);
      return res.json({ count: 0 });
    }

    res.json({ count: data?.length || 0 });
  } catch (err) {
    console.error('Error in unread-count:', err);
    res.json({ count: 0 });
  }
});

// GET /api/creator-chat/chats
router.get('/chats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!supabase) {
      return res.json({ chats: [], pagination: { total: 0, page: 1, perPage: 20, totalPages: 0 } });
    }

    // Get chats where user is creator or client
    const { data: chats, error } = await supabase
      .from('creator_chats')
      .select(`
        *,
        creator:profiles!creator_id(id, full_name, email),
        client:profiles!client_id(id, full_name, email)
      `)
      .or(`creator_id.eq.${user.id},client_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error getting chats:', error);
      return res.status(500).json({ error: 'Failed to get chats' });
    }

    // Format chats
    const formattedChats = (chats || []).map(chat => {
      const isCreator = chat.creator_id === user.id;
      const otherParty = isCreator ? chat.client : chat.creator;
      
      return {
        chat_id: chat.id,
        creator_id: chat.creator_id,
        client_id: chat.client_id,
        status: chat.status,
        last_message_at: chat.last_message_at,
        created_at: chat.created_at,
        creator_name: chat.creator?.full_name,
        creator_email: chat.creator?.email,
        client_name: chat.client?.full_name,
        client_email: chat.client?.email,
        unread_count: chat.unread_count || 0
      };
    });

    res.json({ 
      chats: formattedChats,
      pagination: {
        total: formattedChats.length,
        page: 1,
        perPage: 20,
        totalPages: Math.ceil(formattedChats.length / 20)
      }
    });
  } catch (err) {
    console.error('Error in chats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/creator-chat/chats - Create or get existing chat
router.post('/chats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { creator_id } = req.body;

    if (!creator_id) {
      return res.status(400).json({ error: 'creator_id is required' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Check if chat already exists
    const { data: existingChat } = await supabase
      .from('creator_chats')
      .select('*')
      .eq('creator_id', creator_id)
      .eq('client_id', user.id)
      .single();

    if (existingChat) {
      return res.json({ chat_id: existingChat.id });
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from('creator_chats')
      .insert({
        creator_id,
        client_id: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({ error: 'Failed to create chat' });
    }

    res.json({ chat_id: newChat.id });
  } catch (err) {
    console.error('Error in create chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/creator-chat/chats/:id/messages
router.get('/chats/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!supabase) {
      return res.json({ messages: [], pagination: { total: 0, page: 1, perPage: limit, totalPages: 0 } });
    }

    // Verify user has access to this chat
    const { data: chat } = await supabase
      .from('creator_chats')
      .select('*')
      .eq('id', id)
      .or(`creator_id.eq.${user.id},client_id.eq.${user.id}`)
      .single();

    if (!chat) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('creator_chat_messages')
      .select(`
        *,
        sender:profiles(sender_id, full_name, email)
      `)
      .eq('chat_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting messages:', error);
      return res.status(500).json({ error: 'Failed to get messages' });
    }

    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      chat_id: msg.chat_id,
      sender_id: msg.sender_id,
      sender_type: msg.sender_type,
      content: msg.content,
      is_read: msg.is_read,
      read_at: msg.read_at,
      created_at: msg.created_at,
      sender: msg.sender
    }));

    res.json({ 
      messages: formattedMessages,
      pagination: {
        total: formattedMessages.length,
        page: Math.floor(offset / limit) + 1,
        perPage: limit,
        totalPages: Math.ceil(formattedMessages.length / limit)
      }
    });
  } catch (err) {
    console.error('Error in messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/creator-chat/chats/:id/messages
router.post('/chats/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Verify user has access to this chat
    const { data: chat } = await supabase
      .from('creator_chats')
      .select('*')
      .eq('id', id)
      .or(`creator_id.eq.${user.id},client_id.eq.${user.id}`)
      .single();

    if (!chat) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isCreator = chat.creator_id === user.id;
    const recipientId = isCreator ? chat.client_id : chat.creator_id;

    // Create message
    const { data: message, error } = await supabase
      .from('creator_chat_messages')
      .insert({
        chat_id: id,
        sender_id: user.id,
        recipient_id: recipientId,
        sender_type: isCreator ? 'creator' : 'client',
        content: content.trim(),
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update chat's last_message_at
    await supabase
      .from('creator_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ message });
  } catch (err) {
    console.error('Error in send message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/creator-chat/chats/:id/read
router.post('/chats/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!supabase) {
      return res.json({ success: true });
    }

    // Mark all messages as read where user is recipient
    await supabase
      .from('creator_chat_messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('chat_id', id)
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    res.json({ success: true });
  } catch (err) {
    console.error('Error in mark as read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
