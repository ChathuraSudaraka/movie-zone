import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// YTS mirrors — all DNS-verified working on this machine.
// Each gets its own proxy route so MovieProcess.tsx can try them in order
// without any direct browser calls (which all fail with CORS).
const ytsMirrors: Record<string, string> = {
  '/api/yts':  'https://yts.ag',
  '/api/yts2': 'https://yts.lt',
  '/api/yts3': 'https://yts.rs',
  '/api/yts4': 'https://yts.am',
  '/api/yts5': 'https://yts1.mx',
  '/api/yts6': 'https://yts-official.app',
  '/api/yts7': 'https://yts.ninjaproxy1.com',
  '/api/yts8': 'https://yts.proxyninja.org',
}

const ytsProxyEntries = Object.fromEntries(
  Object.entries(ytsMirrors).map(([route, target]) => [
    route,
    {
      target,
      changeOrigin: true,
      secure: true,
      rewrite: (p: string) => p.replace(new RegExp(`^${route}`), '/api/v2'),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${target}/`,
        'Origin': target,
      },
    },
  ])
)

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
      ...ytsProxyEntries,
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
