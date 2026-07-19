import path from 'path';
import { defineConfig as defineViteConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineViteConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      optimizeDeps: { force: true },
      define: {
        'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        rollupOptions: {
            external: ['/error-logger.js'],
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) return 'vendor-react';
                        if (id.includes('lucide')) return 'vendor-icons';
                        if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
                        return 'vendor';
                    }
                }
            }
        },
        sourcemap: false,
        chunkSizeWarningLimit: 1000
      }
    };
});
