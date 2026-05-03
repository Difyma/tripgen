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

// Build backend before start to avoid stale/missing dist
console.log('🏗️ Building backend...');
execSync('npm run -s server:build', { stdio: 'inherit' });

// Start backend
console.log('🔧 Starting backend...');
const backend = spawn('node', ['server/dist/index.js'], {
  stdio: 'inherit',
  detached: false,
});

backend.on('exit', (code, signal) => {
  console.error(`❌ Backend exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
  process.exit(1);
});

await new Promise(r => setTimeout(r, 3000));

// Start Vite with IPv6 target
console.log('⚡ Starting Vite...');
let server;
try {
  server = await createServer({
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
        '/socket.io': {
          target: 'http://[::1]:3001',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  });

  await server.listen();
} catch (error) {
  console.error('❌ Failed to start Vite dev server:', error instanceof Error ? error.message : error);
  backend.kill();
  process.exit(1);
}

console.log('\n🚀 Servers ready!');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend: http://localhost:3001');
console.log('\nPress Ctrl+C to stop\n');

process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  backend.kill();
  server?.close();
  process.exit(0);
});
