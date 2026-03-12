#!/usr/bin/env node
/**
 * Development server starter
 * Uses Vite programmatically to avoid proxy configuration issues
 */

import { createServer } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kill existing processes
console.log('🧹 Cleaning up...');
try {
  execSync('pkill -f "node server/dist/index.js" 2>/dev/null || true');
  execSync('pkill -f "vite" 2>/dev/null || true');
  await new Promise(r => setTimeout(r, 2000));
} catch (e) {}

// Start backend
console.log('🔧 Starting backend...');
const backend = spawn('node', ['server/dist/index.js'], {
  stdio: 'inherit',
  detached: false,
});

await new Promise(r => setTimeout(r, 3000));

// Start Vite with IPv6 target
console.log('⚡ Starting Vite...');
const server = await createServer({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://[::1]:3001',  // IPv6 для Node.js сервера
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

await server.listen();

console.log('\n🚀 Servers ready!');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend: http://localhost:3001');
console.log('\nPress Ctrl+C to stop\n');

process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  backend.kill();
  server.close();
  process.exit(0);
});
