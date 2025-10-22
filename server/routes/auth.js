const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('../config/smtp');
const dotenv = require('dotenv');

dotenv.config();

// Инициализация Supabase клиента
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not defined in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Генерация случайного кода подтверждения
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Хранилище для временных кодов подтверждения
const verificationCodes = new Map();

// Маршрут для отправки кода подтверждения
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Генерируем код подтверждения
    const code = generateVerificationCode();
    
    // Сохраняем код в памяти
    verificationCodes.set(email, {
      code,
      timestamp: Date.now()
    });

    // Отправляем письмо с кодом
    const subject = 'Код подтверждения для входа';
    const text = `Ваш код подтверждения: ${code}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Код подтверждения</h2>
        <p>Ваш код подтверждения для входа:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>Код действителен в течение 5 минут.</p>
      </div>
    `;

    await sendEmail(email, subject, text, html);
    
    res.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Маршрут для проверки кода и создания/обновления пользователя
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Проверяем код
    const storedData = verificationCodes.get(email);
    if (!storedData || storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Проверяем время жизни кода (5 минут)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Создаем или обновляем пользователя в Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert([
        { 
          email,
          last_login: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Error creating/updating user:', userError);
      return res.status(500).json({ error: 'Failed to create/update user' });
    }

    // Удаляем использованный код
    verificationCodes.delete(email);

    res.json({ 
      message: 'User authenticated successfully',
      user
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

module.exports = router; 