import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import gptRouter from './gptProxy.js';
import flightsRouter from './routes/flights.js';
import creatorRouter from './routes/creatorApplication.js';
import creatorChatRouter from './routes/creatorChat.js';
import hotelsRouter from '../routes/hotels-full.js';

const rootDir = path.resolve(__dirname, '../../');

// Load environment variables from root directory
dotenv.config({ path: path.join(rootDir, '.env') });

// Log environment status
console.log('Environment loaded from:', path.join(rootDir, '.env'));
console.log('Environment variables status:', {
  YANDEX_API_KEY: !!process.env.YANDEX_API_KEY,
  YANDEX_FOLDER_ID: !!process.env.YANDEX_FOLDER_ID,
  TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID
});

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

console.log('Initializing server...');

// Log raw body before JSON parsing
app.use((req: Request, res: Response, next: NextFunction) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    console.log('[RAW BODY]', req.method, req.url, data.substring(0, 1000));
  });
  next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('JSON middleware configured');

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

console.log('CORS middleware configured');

// Middleware для логирования запросов
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Test endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api', gptRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/creators', creatorRouter);
app.use('/api/creator-chat', creatorChatRouter);
app.use('/api/hotels', hotelsRouter);

console.log('Routes configured:', {
  gpt: '/api',
  flights: '/api/flights',
  creators: '/api/creators',
  creatorChat: '/api/creator-chat',
  hotels: '/api/hotels'
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  console.error('Stack:', err.stack);
  // Ensure we always return JSON
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /         -> Server status');
  console.log('- POST /api/yandex-gpt -> GPT endpoint');
  console.log('- POST /api/flights/search -> Flight search endpoint');
  console.log('- POST /api/creators/creator-application -> Creator application endpoint');
  console.log('- POST /api/hotels/search -> Hotel search endpoint');
  console.log('- POST /api/hotels/hotelpage -> Hotel details endpoint');
  console.log('- POST /api/hotels/content -> Hotel static content endpoint');
  console.log('- GET  /api/hotels/suggest -> Hotel/region autocomplete');
});

server.on('error', (error: Error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection:', error);
}); 