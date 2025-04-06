import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// Get Git hash for build versioning
function getGitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        console.warn('Unable to get git hash. Using timestamp instead.');
        return Date.now().toString();
    }
}

// Set build version from env or git hash
const buildVersion = process.env.VITE_BUILD_VERSION || getGitHash();

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/',
    define: {
        'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildVersion),
    },
    build: {
        rollupOptions: {
            input: {
                main: './index.html',
                'service-worker': './public/service-worker.js',
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    return chunkInfo.name === 'service-worker' ? '[name].js' : 'assets/js/[name]-[hash].js';
                },
            },
        },
    },
});
