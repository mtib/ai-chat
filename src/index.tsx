import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

// PWA installation prompt handling
let deferredPrompt: any;
const pwaInstallPrompt = document.getElementById('pwa-install-prompt');
const pwaInstallButton = document.getElementById('pwa-install-button');
const pwaDismissButton = document.getElementById('pwa-dismiss-button');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e;

    // Only show the prompt if user is on mobile
    if (window.innerWidth <= 768) {
        // Show the install prompt
        if (pwaInstallPrompt) pwaInstallPrompt.style.display = 'block';
    }
});

// Handle install button click
if (pwaInstallButton) {
    pwaInstallButton.addEventListener('click', async () => {
        // Hide the install prompt
        if (pwaInstallPrompt) pwaInstallPrompt.style.display = 'none';

        // Show the install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            // We no longer need the prompt
            deferredPrompt = null;
        }
    });
}

// Handle dismiss button click
if (pwaDismissButton) {
    pwaDismissButton.addEventListener('click', () => {
        // Hide the install prompt
        if (pwaInstallPrompt) pwaInstallPrompt.style.display = 'none';
        // Set a flag in localStorage to avoid showing the prompt again soon
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });
}

// Don't show prompt if user recently dismissed it (within last 7 days)
const lastDismissed = localStorage.getItem('pwa-install-dismissed');
if (lastDismissed) {
    const dismissedTime = parseInt(lastDismissed);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedTime < sevenDaysInMs) {
        if (pwaInstallPrompt) pwaInstallPrompt.style.display = 'none';
    }
}

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
