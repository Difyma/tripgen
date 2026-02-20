import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import gptRouter from './gptProxy.js';
import flightsRouter from './routes/flights.js';
import creatorRouter from './routes/creatorApplication.js';

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

console.log('Routes configured:', {
  gpt: '/api',
  flights: '/api/flights',
  creators: '/api/creators'
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
  console.log('- POST /api/yandex-gpt -> GPT endpoint');
  console.log('- POST /api/flights/search -> Flight search endpoint');
  console.log('- POST /api/creators/creator-application -> Creator application endpoint');
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