import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Security: Raw body logging disabled to prevent sensitive data leaks
// app.use((req: Request, res: Response, next: NextFunction) => {
//   let data = '';
//   req.on('data', chunk => {
//     data += chunk;
//   });
//   req.on('end', () => {
//     console.log('[RAW BODY]', req.method, req.url, data.substring(0, 1000));
//   });
//   next();
// });

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('JSON middleware configured');

// Configure CORS - restrict in production
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

console.log('CORS middleware configured');

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.worldota.net', 'https://api.openai.com', 'https://openrouter.ai'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
console.log('Helmet security headers configured');

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
console.log('Rate limiting configured');

// Middleware для логирования запросов (без чувствительных данных)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Don't log request body or headers that may contain secrets
  console.log(`${req.method} ${req.url}`, {
    query: req.query,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type']
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