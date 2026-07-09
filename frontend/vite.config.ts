import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: parseInt(process.env.PORT || '5173', 10),
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, stable dependencies into their own long-cached chunks so
        // the app shell stays small and vendor code isn't re-downloaded on every
        // deploy. Charts and DnD only load on the routes that use them.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', 'zustand', 'axios'],
          'motion-vendor': ['framer-motion'],
          'chart-vendor': ['recharts'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
});
