import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'landing-page',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url?.startsWith('/?')) {
            const landingPath = path.resolve(__dirname, 'landing/index.html');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(landingPath, 'utf-8'));
            return;
          }
          const privacyDir = path.resolve(__dirname, '../privacy-policy');
          if (req.url === '/privacy-policy') {
            res.writeHead(301, { Location: '/privacy-policy/' });
            res.end();
            return;
          }
          if (req.url === '/privacy-policy/') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(path.join(privacyDir, 'index.html'), 'utf-8'));
            return;
          }
          if (req.url === '/privacy-policy/en.html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(path.join(privacyDir, 'en.html'), 'utf-8'));
            return;
          }
          if (req.url === '/privacy-policy/ru.html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(path.join(privacyDir, 'ru.html'), 'utf-8'));
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ui': ['lucide-react', 'sonner'],
          'vendor-utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
