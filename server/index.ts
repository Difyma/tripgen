import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import gptRouter from './src/gptProxy.js';
import flightsRouter from './routes/flights.js';
import creatorRouter from './routes/creatorApplication.js';
import hotelsRouter from './routes/hotels-full.js';
import creatorChatRouter from './routes/creator-chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from root directory
dotenv.config({ path: path.join(rootDir, '.env') });

// Log environment status
console.log('Environment loaded from:', path.join(rootDir, '.env'));
console.log('Environment variables status:', {
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
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
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api', gptRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/creators', creatorRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/creator-chat', creatorChatRouter);

console.log('Routes configured:', {
  gpt: '/api',
  flights: '/api/flights',
  creators: '/api/creators',
  hotels: '/api/hotels',
  creatorChat: '/api/creator-chat'
});

// Error handling middleware - MUST be last
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Catch-all for 404 errors - return JSON instead of HTML
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Start server - listen on all interfaces (IPv4 and IPv6)
const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /         -> Server status');
  console.log('- POST /api/openai -> OpenAI GPT endpoint');
  console.log('- POST /api/flights/search -> Flight search endpoint');
  console.log('- POST /api/creators/creator-application -> Creator application endpoint');
  console.log('- POST /api/hotels/search -> Hotel search endpoint');
  console.log('- POST /api/hotels/hotelpage -> Hotel details endpoint');
  console.log('- POST /api/hotels/content -> Hotel static content endpoint');
  console.log('- GET  /api/hotels/suggest -> Hotel/region autocomplete');
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