const express = require('express');
const router = express.Router();
const { sendEmail } = require('../config/smtp');

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📨 Получен запрос на отправку кода на:', email);
    
    if (!email) {
      console.log('❌ Ошибка: email не указан');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Генерируем 6-значный код
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Сгенерирован код:', otp);
    
    // Отправляем письмо
    await sendEmail(
      email,
      'Код подтверждения TripGen',
      `Ваш код подтверждения: ${otp}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Код подтверждения TripGen</h2>
          <p style="color: #666;">Ваш код подтверждения:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Код действителен в течение 5 минут.</p>
        </div>
      `
    );

    console.log('✅ Код успешно отправлен на', email);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Ошибка при отправке кода:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Маршрут для отправки тестового письма
router.post('/send-test', async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'To, subject and text are required' });
    }

    await sendEmail(to, subject, text);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

module.exports = router; 