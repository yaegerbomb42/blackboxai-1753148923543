import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/client',
  publicDir: '../../assets',
  build: {
    outDir: '../../build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/client/index.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['rltjc8-3002.csb.app']
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/src/shared',
      '@utils': '/src/utils'
    }
  }
})
