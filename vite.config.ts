import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/tmdb': {
        target: 'https://api.themoviedb.org/3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
      },
      '/api/torrentio': {
        target: 'https://torrentio.strem.fun',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/torrentio/, ''),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api/yts': {
        target: 'https://yts.mx/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yts/, ''),
      },
      '/api/eztv': {
        target: 'https://eztv.re/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eztv/, ''),
      },
      '/api/imdb': {
        target: 'https://v2.sg.media-imdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/imdb/, ''),
      },
      '/torrentio': {
        target: 'https://torrentio.strem.fun',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/torrentio/, ''),
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  base: '/',
  optimizeDeps: {
    exclude: ['firebase', '@firebase/auth']
  }
})
