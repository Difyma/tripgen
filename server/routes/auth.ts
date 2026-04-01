import { Router, Request, Response } from 'express';
import { sendOTPEmail } from '../lib/email.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Генерация 6-значного кода
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Генерируем код
    const code = generateOTP();
    
    // Сохраняем код в Supabase (через auth) с nonce
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { 
          otp_code: code,
          otp_created_at: new Date().toISOString()
        }
      }
    });

    if (signInError && !signInError.message.includes('rate limit')) {
      console.error('[Auth] Supabase OTP error:', signInError);
    }

    // Отправляем email через наш SMTP
    const result = await sendOTPEmail(email, code);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send email' });
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
