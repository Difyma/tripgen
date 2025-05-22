import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import gptRouter from './gptProxy.js';
import flightsRouter from './routes/flights.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from root directory
dotenv.config({ path: path.join(rootDir, '.env') });

// Log environment status
console.log('Environment loaded from:', path.join(rootDir, '.env'));
console.log('Environment variables status:', {
  YANDEX_API_KEY: !!process.env.YANDEX_API_KEY,
  YANDEX_FOLDER_ID: !!process.env.YANDEX_FOLDER_ID
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

// Test endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api', gptRouter);
app.use('/api/flights', flightsRouter);
console.log('Routes configured');

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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