import http from 'http';

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 3001;
const PROXY_PORT = 5175;

const server = http.createServer((req, res) => {
  console.log('Proxying:', req.method, req.url);
  
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    console.log('Response:', proxyRes.statusCode);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`Proxy server listening on port ${PROXY_PORT}`);
});
