const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Создаем заглушку для отправки писем
const sendEmail = async (to, subject, text, html) => {
  console.log('📧 Email sending simulation:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Text:', text);
  console.log('HTML:', html);
  
  // Имитируем успешную отправку
  return {
    messageId: `mock_${Date.now()}`,
    response: 'Email sent successfully (mock)'
  };
};

module.exports = { sendEmail }; 