import http from 'http';
import net from 'net';

// Test if we can connect to port 3001 via IPv6
const testConnection = (host) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      console.log(`Successfully connected to ${host}:3001`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.log(`Connection error to ${host}:3001:`, err.message);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log(`Connection timeout to ${host}:3001`);
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(3001, host);
  });
};

console.log('Testing IPv4...');
await testConnection('127.0.0.1');

console.log('\nTesting IPv6...');
await testConnection('::1');

console.log('\nTesting localhost...');
await testConnection('localhost');
