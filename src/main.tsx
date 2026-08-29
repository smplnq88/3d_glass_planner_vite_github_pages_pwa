import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Progressive Web App (PWA) Service Worker with dynamic base path support (GitHub Pages subpaths compatible)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || './'}sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('3D Planner ServiceWorker registered with scope:', registration.scope);
        
        // Proactively poll/check for SW updates on load to capture code updates instantly
        registration.update();

        // Trigger updates event when service worker finds modifications
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('✨ New upgraded version is available. Prompting user update...');
                  window.dispatchEvent(new CustomEvent('pwa-update-available'));
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('3D Planner ServiceWorker registration failed:', error);
      });
  });
}
