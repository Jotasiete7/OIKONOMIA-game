// vite.config.mjs
import { defineConfig } from 'vite';
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
      const files = ['sprite_manager.js', 'audio.js'];
      for (const file of files) {
        const src = path.resolve('client', file);
        const dest = path.resolve('dist', file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
      const assetsSrc = path.resolve('client', 'assets');
      const assetsDest = path.resolve('dist', 'assets');
      if (fs.existsSync(assetsSrc)) {
        fs.cpSync(assetsSrc, assetsDest, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  root: 'client',        // onde está o index.html
  base: './',            // caminhos relativos para funcionar sem servidor web
  plugins: [copyStaticAssetsPlugin(), makeClassicScriptPlugin()],
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
    open: true,          // abre o navegador automaticamente ao rodar npm run dev
  },
});
