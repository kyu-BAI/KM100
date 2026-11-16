import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    },
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx']
  },
  define: {
    global: 'window',
    __DEV__: JSON.stringify(true)
  },
  server: {
    port: 3000,
    host: true
  }
});
