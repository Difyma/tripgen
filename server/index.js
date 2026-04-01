import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import gptRouter from './gptProxy.js';
import flightsRouter from './routes/flights.ts';
import creatorChatRouter from './routes/creator-chat.js';

// Load environment variables
dotenv.config();
console.log('Environment loaded');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Initializing server...');

// Basic middleware
app.use(express.json());
console.log('JSON middleware configured');

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

console.log('CORS middleware configured');

// Test endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/', gptRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/creator-chat', creatorChatRouter);
console.log('Routes configured');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /         -> Server status');
  console.log('- POST /yandex-gpt -> GPT endpoint');
  console.log('- POST /api/flights/search -> Flight search endpoint');
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
}); 