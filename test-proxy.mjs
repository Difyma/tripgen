import { createServer } from 'vite';

const server = await createServer({
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

await server.listen();
console.log('Vite server started');
