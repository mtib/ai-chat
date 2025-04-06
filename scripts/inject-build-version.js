#!/usr/bin/env node

/**
 * This script injects the build version from environment variables into the service worker
 * It's intended to be run as part of the build process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Git hash for build versioning (same function as in vite.config.ts)
function getGitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        console.warn('Unable to get git hash. Using timestamp instead.');
        return Date.now().toString();
    }
}

// Get build version from environment or git hash
const buildVersion = process.env.VITE_BUILD_VERSION || getGitHash();
console.log(`Using build version: ${buildVersion}`);

// Path to the service worker destination file in the dist folder
const serviceWorkerPath = path.join(__dirname, '../dist/service-worker.js');

// Check if service worker exists
if (!fs.existsSync(serviceWorkerPath)) {
    console.error('Service worker file not found:', serviceWorkerPath);
    process.exit(1);
}

// Read the service worker file
let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');

// Inject the build version
serviceWorkerContent = serviceWorkerContent.replace(
    'Date.now().toString()',
    `"${buildVersion}"`
);

// Write the modified service worker back
fs.writeFileSync(serviceWorkerPath, serviceWorkerContent);

console.log('Successfully injected build version into service worker');
