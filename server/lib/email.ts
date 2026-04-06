import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.ru';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true, // SSL
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP credentials not configured');
    }

    const info = await transporter.sendMail({
      from: `"TRIPGEN" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('[Email] Message sent:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOTPEmail(to: string, code: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Вход в TRIPGEN</h2>
      <p>Для входа в ваш аккаунт используйте следующий код:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
      </div>
      <p style="color: #666; font-size: 14px;">Код действителен в течение 10 минут.</p>
      <p style="color: #666; font-size: 14px;">Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">С уважением, команда TRIPGEN</p>
    </div>
  `;

  return sendEmail(to, 'Код подтверждения для входа в TRIPGEN', html);
}
