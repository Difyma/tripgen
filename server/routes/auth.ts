import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Отправляем OTP через Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error('[Auth] Supabase OTP error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'OTP sent' });
  } catch (err: any) {
    console.error('[Auth] Error in send-otp:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code required' });
    }

    // Проверяем код через Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error('[Auth] Verify OTP error:', error);
      return res.status(400).json({ error: 'Invalid code' });
    }

    res.json({ 
      success: true, 
      session: data.session,
      user: data.user 
    });
  } catch (err: any) {
    console.error('[Auth] Error in verify-otp:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

export default router;
