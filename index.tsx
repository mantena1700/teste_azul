import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { LocalDatabase } from './services/LocalDatabase';

// Initialize local database (seed if empty)
LocalDatabase.initialize();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);