import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/ai-chat/',
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
