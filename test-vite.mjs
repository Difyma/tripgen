import { createServer } from 'vite';

const server = await createServer({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

await server.listen();
console.log('Vite server started on http://localhost:5173');
console.log('Proxy configured for /api to http://localhost:3001');
