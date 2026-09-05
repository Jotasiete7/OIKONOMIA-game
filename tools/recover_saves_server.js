// tools/recover_saves_server.js
// Servidor de recuperação para coletar saves de localhost:5175, 5174, 5173
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const savesDir = path.resolve(__dirname, '..', 'saves');
if (!fs.existsSync(savesDir)) {
  fs.mkdirSync(savesDir, { recursive: true });
}

let harvestedSaves = {};
let visitedPorts = new Set();
const portsToVisit = [5175, 5174, 5173];

function createServerOnPort(port) {
  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/dump') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log(`[Port ${port}] Recebido dump com ${Object.keys(data).length} chaves.`);
          
          Object.keys(data).forEach(k => {
            harvestedSaves[k] = data[k];
            if (k.startsWith('oiko_save_')) {
              try {
                const saveObj = JSON.parse(data[k]);
                const compName = (saveObj.playerProfile?.companyName || 'Empresa').replace(/[^a-zA-Z0-9_-]/g, '_');
                const slotId = k.replace('oiko_save_', '');
                const fileName = `Save_${compName}_${slotId}.oiko`;
                const filePath = path.join(savesDir, fileName);
                fs.writeFileSync(filePath, JSON.stringify(saveObj, null, 2), 'utf8');
                console.log(` -> Arquivo gravado: saves/${fileName}`);
              } catch (err) {
                console.error('Erro ao salvar .oiko:', err);
              }
            }
          });

          // Grava também o bundle consolidado
          fs.writeFileSync(path.join(savesDir, 'all_harvested_saves.json'), JSON.stringify(harvestedSaves, null, 2), 'utf8');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, count: Object.keys(data).length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/get_bundle') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(harvestedSaves));
      return;
    }

    // HTML de captura e injeção
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OIKONOMIA — Recuperador de Saves</title>
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 500px; }
    h2 { color: #38bdf8; margin-bottom: 1rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    .status { margin-top: 1.5rem; font-weight: bold; color: #34d399; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🏛️ Recuperador de Saves OIKONOMIA</h2>
    <p>Escaneando LocalStorage da porta <strong>${port}</strong>...</p>
    <div id="status" class="status">Coletando dados...</div>
  </div>
  <script>
    (async function() {
      const statusEl = document.getElementById('status');
      const dump = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('oiko_') || key.startsWith('oikonomia_'))) {
          dump[key] = localStorage.getItem(key);
        }
      }
      
      const count = Object.keys(dump).length;
      statusEl.textContent = 'Encontradas ' + count + ' entradas na porta ${port}. Enviando ao servidor...';
      
      try {
        await fetch('http://localhost:${port}/api/dump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dump)
        });
      } catch (err) {
        console.warn('Erro ao enviar dump:', err);
      }

      // Se estivermos nas portas secundárias, navegar para a próxima
      const currentPort = ${port};
      if (currentPort === 5175) {
        statusEl.textContent = 'Porta 5175 recuperada! Redirecionando para a porta 5174...';
        setTimeout(() => { window.location.href = 'http://localhost:5174/'; }, 1000);
      } else if (currentPort === 5174) {
        statusEl.textContent = 'Porta 5174 recuperada! Redirecionando para a porta 5173 canônica...';
        setTimeout(() => { window.location.href = 'http://localhost:5173/?sync_all=true'; }, 1000);
      } else if (currentPort === 5173) {
        // Se estivermos na porta 5173, puxar o bundle e injetar tudo no localStorage da porta 5173!
        statusEl.textContent = 'Porta 5173 alcançada! Sincronizando todos os saves resgatados...';
        try {
          const res = await fetch('http://localhost:5173/api/get_bundle');
          const allSaves = await res.json();
          let mergedIndex = [];
          
          try {
            const curIdx = localStorage.getItem('oikonomia_save_slots_v1');
            if (curIdx) mergedIndex = JSON.parse(curIdx);
          } catch(e) {}

          let added = 0;
          Object.keys(allSaves).forEach(k => {
            if (k.startsWith('oiko_save_')) {
              localStorage.setItem(k, allSaves[k]);
              added++;
              try {
                const sObj = JSON.parse(allSaves[k]);
                const slotId = k.replace('oiko_save_', '');
                if (!mergedIndex.some(m => m.id === slotId)) {
                  mergedIndex.unshift({
                    id: slotId,
                    companyName: sObj.playerProfile?.companyName || 'Empresa',
                    playerName: sObj.playerProfile?.playerName || 'Jogador',
                    avatarId: sObj.playerProfile?.avatarId || 'human_ceo',
                    themeColor: sObj.playerProfile?.themeColor || 'emerald',
                    cash: sObj.cash || 100000,
                    gameDate: (String(sObj.day || 1).padStart(2,'0')) + '/' + (String(sObj.month || 1).padStart(2,'0')) + ' · Ano ' + (sObj.year || 1),
                    dateISO: sObj.timestamp || new Date().toISOString(),
                    builtCount: Array.isArray(sObj.builtTiles) ? sObj.builtTiles.length : 0
                  });
                }
              } catch(e) {}
            }
          });

          // Salvar índice unificado
          localStorage.setItem('oikonomia_save_slots_v1', JSON.stringify(mergedIndex));
          statusEl.textContent = '🎉 SUCESSO! ' + added + ' saves sincronizados com sucesso na porta principal!';
          setTimeout(() => {
            alert('Todos os seus saves (incluindo A Guilda 1) foram recuperados e unificados com sucesso!');
            window.close();
          }, 1500);
        } catch(e) {
          statusEl.textContent = 'Erro ao sincronizar bundle final: ' + e.message;
        }
      }
    })();
  </script>
</body>
</html>`);
  });

  server.listen(port, () => {
    console.log(`Servidor de recuperação ouvindo em http://localhost:${port}`);
  });

  return server;
}

const servers = portsToVisit.map(p => createServerOnPort(p));

const operaPath = '"C:\\Users\\Metalgear\\AppData\\Local\\Programs\\Opera GX\\opera.exe"';
console.log('Iniciando Opera GX no endpoint de resgate: http://localhost:5175...');
exec(`${operaPath} http://localhost:5175`);

// Manter vivo por 25 segundos para completar o ciclo
setTimeout(() => {
  console.log('Ciclo de recuperação finalizado. Encerrando servidores.');
  servers.forEach(s => s.close());
  process.exit(0);
}, 25000);
