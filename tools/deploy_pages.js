/**
 * tools/deploy_pages.js
 * Publica a pasta dist/ diretamente na branch gh-pages do GitHub sem necessitar de permissões especiais de token.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('================================================================');
console.log('       OIKONOMIA — DEPLOY AUTOMÁTICO NO GITHUB PAGES           ');
console.log('================================================================\n');

console.log('1. Compilando pacote de produção (Vite)...');
execSync('npm run build', { stdio: 'inherit' });

console.log('\n2. Empacotando arquivos do dist/ para a branch gh-pages...');
const tempIndex = path.join(os.tmpdir(), `oiko_git_index_${Date.now()}`);
const env = { ...process.env, GIT_INDEX_FILE: tempIndex };

try {
  execSync('git --work-tree=dist add -A', { env, stdio: 'inherit' });
  const treeId = execSync('git write-tree', { env }).toString().trim();
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const commitId = execSync(`git commit-tree ${treeId} -m "deploy: update GitHub Pages build (${timestamp})"`, { env }).toString().trim();
  
  console.log('\n3. Enviando para o GitHub (branch gh-pages)...');
  execSync(`git push origin ${commitId}:refs/heads/gh-pages --force --no-verify`, { stdio: 'inherit' });
  
  console.log('\n================================================================');
  console.log('✅ SUCESSO: OIKONOMIA publicado na branch gh-pages!');
  console.log(`   Commit: ${commitId.slice(0, 7)}`);
  console.log('   Link: https://jotasiete7.github.io/OIKONOMIA-game/');
  console.log('================================================================\n');
} finally {
  if (fs.existsSync(tempIndex)) {
    try { fs.unlinkSync(tempIndex); } catch (_) {}
  }
}
