import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  target: 'http://127.0.0.1:3001',
  changeOrigin: true,
});

const server = http.createServer((req, res) => {
  console.log('Proxying:', req.method, req.url);
  proxy.web(req, res, {}, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

server.listen(5175, () => {
  console.log('Proxy server listening on port 5175');
});
