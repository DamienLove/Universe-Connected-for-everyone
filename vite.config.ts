import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: command === 'build' ? '/universe-connected:-the-game/' : '/',
        server: {
            port: 3000,
            host: '0.0.0.0',
            watch: {
                ignored: ['**/vite.config.ts'],
            },
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});