import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Improved Service Worker Registration for Production
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Optional: Refresh the page when a new version is available
    if (window.confirm('New version available! Refresh to update?')) {
      window.location.reload();
    }
  },
});