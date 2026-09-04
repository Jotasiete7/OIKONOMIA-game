// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',        // onde está o index.html
  build: {
    outDir: '../dist',   // saída fora da pasta client
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,          // abre o navegador automaticamente ao rodar npm run dev
  },
});
