import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Supabase client with service role for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware to verify user is authenticated
const requireAuth = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to verify user is a creator
const requireCreator = async (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();
    
    if (error || !creator) {
      return res.status(403).json({ error: 'Not a creator' });
    }
    
    (req as any).creator = creator;
    next();
  } catch (err) {
    console.error('Creator check error:', err);
    return res.status(403).json({ error: 'Creator verification failed' });
  }
};

// Get all chats for current user (creator or client)
router.get('/chats', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  try {
    // Check if user is a creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    let query = supabase
      .from('creator_chats_with_users')
      .select('*');

    if (creator) {
      // User is a creator - show their chats
      query = query.eq('creator_id', creator.id);
    } else {
      // User is a client - show their chats
      query = query.eq('client_id', user.id);
    }

    const { data: chats, error } = await query
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return res.status(500).json({ error: 'Failed to fetch chats' });
    }

    // Get unread counts for each chat
    const chatsWithUnread = await Promise.all(
      (chats || []).map(async (chat: any) => {
        const { count, error: countError } = await supabase
          .from('creator_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.chat_id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          ...chat,
          unread_count: countError ? 0 : (count || 0)
        };
      })
    );

    res.json({ chats: chatsWithUnread });
  } catch (err) {
    console.error('Error in /chats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or get existing chat with a creator
router.post('/chats', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { creator_id } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'creator_id is required' });
  }

  try {
    // Verify creator exists and is approved
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('id', creator_id)
      .eq('status', 'approved')
      .single();

    if (creatorError || !creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Use the database function to get or create chat
    const { data: chatId, error } = await supabase
      .rpc('get_or_create_creator_chat', {
        p_creator_id: creator_id,
        p_client_id: user.id
      });

    if (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({ error: 'Failed to create chat' });
    }

    res.json({ chat_id: chatId, creator });
  } catch (err) {
    console.error('Error in POST /chats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a specific chat
router.get('/chats/:chatId/messages', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { chatId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    // Verify user has access to this chat
    const { data: chat, error: chatError } = await supabase
      .from('creator_client_chats')
      .select('*, creators!inner(user_id)')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    const isCreator = chat.creators?.user_id === user.id;
    const isClient = chat.client_id === user.id;

    if (!isCreator && !isClient) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('creator_chat_messages')
      .select(`
        *,
        sender:sender_id(email, raw_user_meta_data)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(Number(limit))
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Mark messages as read (from other sender)
    await supabase
      .from('creator_chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    res.json({ messages: messages?.reverse() || [] });
  } catch (err) {
    console.error('Error in /chats/:chatId/messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message to chat
router.post('/chats/:chatId/messages', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { chatId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Verify user has access to this chat
    const { data: chat, error: chatError } = await supabase
      .from('creator_client_chats')
      .select('*, creators!inner(user_id, id)')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Determine sender type
    const isCreator = chat.creators?.user_id === user.id;
    const isClient = chat.client_id === user.id;

    if (!isCreator && !isClient) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const senderType = isCreator ? 'creator' : 'client';

    // Insert message
    const { data: message, error } = await supabase
      .from('creator_chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        sender_type: senderType,
        content: content.trim(),
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.json({ message });
  } catch (err) {
    console.error('Error in POST /chats/:chatId/messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/chats/:chatId/read', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { chatId } = req.params;

  try {
    const { error } = await supabase
      .from('creator_chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in POST /chats/:chatId/read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all creators (for clients to start chat)
router.get('/creators', async (req: Request, res: Response) => {
  try {
    const { data: creators, error } = await supabase
      .from('creators')
      .select('id, full_name, email, bio, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creators:', error);
      return res.status(500).json({ error: 'Failed to fetch creators' });
    }

    res.json({ creators: creators || [] });
  } catch (err) {
    console.error('Error in /creators:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count for current user
router.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  try {
    // Check if user is a creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    let query = supabase
      .from('creator_chat_messages')
      .select('chat_id', { count: 'exact' })
      .eq('is_read', false)
      .neq('sender_id', user.id);

    if (creator) {
      // Filter by creator's chats
      const { data: chatIds } = await supabase
        .from('creator_client_chats')
        .select('id')
        .eq('creator_id', creator.id);
      
      if (chatIds && chatIds.length > 0) {
        query = query.in('chat_id', chatIds.map(c => c.id));
      } else {
        return res.json({ count: 0 });
      }
    } else {
      // Filter by client's chats
      const { data: chatIds } = await supabase
        .from('creator_client_chats')
        .select('id')
        .eq('client_id', user.id);
      
      if (chatIds && chatIds.length > 0) {
        query = query.in('chat_id', chatIds.map(c => c.id));
      } else {
        return res.json({ count: 0 });
      }
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting unread:', error);
      return res.status(500).json({ error: 'Failed to count unread messages' });
    }

    res.json({ count: count || 0 });
  } catch (err) {
    console.error('Error in /unread-count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
