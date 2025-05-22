// React import is needed for JSX transformation
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('Starting application...');

// Ensure the root element exists
const rootElement = document.getElementById('root');
console.log('Root element found:', !!rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

try {
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering application...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Error rendering application:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Error Starting Application</h1>
      <pre style="color: red; margin: 20px;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
}
