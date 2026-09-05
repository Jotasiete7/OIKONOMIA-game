// vite.config.mjs
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function makeClassicScriptPlugin() {
  return {
    name: 'make-classic-script',
    transformIndexHtml(html) {
      return html.replace(/<script type="module"[^>]*src="(\.\/assets\/[^"]+)"[^>]*><\/script>/g, '<script src="$1"></script>');
    }
  };
}

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const assetsSrc = path.resolve('client', 'assets');
      const assetsDest = path.resolve('dist', 'assets');
      if (fs.existsSync(assetsSrc)) {
        fs.cpSync(assetsSrc, assetsDest, { recursive: true });
      }
      // Copia banking_system.js (IIFE) para a raiz do dist
      const bankingSrc  = path.resolve('client', 'banking_system.js');
      const bankingDest = path.resolve('dist', 'banking_system.js');
      if (fs.existsSync(bankingSrc)) {
        fs.copyFileSync(bankingSrc, bankingDest);
      }
    }
  };
}

export default defineConfig({
  root: 'client',        // onde está o index.html
  base: './',            // caminhos relativos para funcionar sem servidor web
  plugins: [tailwindcss(), copyStaticAssetsPlugin(), makeClassicScriptPlugin()],
  build: {
    outDir: '../dist',   // saída fora da pasta client
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'OikonomiaBundle',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,    // Impede o Vite de mudar para 5174/5175 e fragmentar o localStorage
    open: true,          // abre o navegador automaticamente ao rodar npm run dev
  },
});
