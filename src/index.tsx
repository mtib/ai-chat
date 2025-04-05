import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Get the base URL from the import.meta.env (injected by Vite)
        const baseUrl = import.meta.env.BASE_URL || '/';

        navigator.serviceWorker
            .register(`${baseUrl}service-worker.js`)
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
