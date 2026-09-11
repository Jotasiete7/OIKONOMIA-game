/**
 * Teste E2E Headless Browser: Dev Dashboard (F3), Bug Reporter (F8) & Simulador 'E se?'
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const fs = require('fs');
const browserExe = EDGE_PATHS.find(p => fs.existsSync(p));
if (!browserExe) {
  console.error('Nenhum navegador Chromium encontrado para teste.');
  process.exit(1);
}

const PORT = 9333;
const tmpDir = path.join(require('os').tmpdir(), 'edge_test_fase7d_' + Date.now());
const browserProc = spawn(browserExe, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + tmpDir,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'about:blank'
]);

function getDevToolsUrl() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const pages = JSON.parse(data);
            const page = pages.find(t => t.type === 'page') || pages[0];
            if (page && page.webSocketDebuggerUrl) {
              clearInterval(interval);
              resolve(page.webSocketDebuggerUrl);
            }
          } catch (_) {}
        });
      }).on('error', () => {});

      if (attempts > 30) {
        clearInterval(interval);
        reject(new Error('Timeout aguardando DevTools'));
      }
    }, 200);
  });
}

async function run() {
  try {
    const wsUrl = await getDevToolsUrl();
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const res = JSON.parse(event.data);
      if (res.id && callbacks.has(res.id)) {
        const cb = callbacks.get(res.id);
        callbacks.delete(res.id);
        if (res.error) cb.reject(new Error(res.error.message));
        else cb.resolve(res.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    await send('Page.enable');
    await send('Runtime.enable');

    const fileUrl = 'file:///' + path.resolve(__dirname, '../dist/index.html').replace(/\\/g, '/');
    console.log(`Navegando para: ${fileUrl}`);
    await send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n--- TESTE 1: Dev Dashboard (F3) ---');
    const f3Result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof toggleDevDashboard === 'function') {
            toggleDevDashboard();
            const modal = document.getElementById('dev-dashboard-modal');
            const isVisible = modal && !modal.classList.contains('hidden');
            const hasTilesText = document.getElementById('dev-stat-sparse-tiles')?.textContent || '';
            toggleDevDashboard(); // fecha
            return { isVisible, hasTilesText };
          }
          return { error: 'toggleDevDashboard não encontrada' };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado F3:', f3Result.result?.value);
    if (!f3Result.result?.value?.isVisible) throw new Error('F3 Dev Dashboard não abriu corretamente.');

    console.log('\n--- TESTE 2: Bug Report Modal (F8) ---');
    const f8Result = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          if (typeof toggleBugReportModal === 'function') {
            await toggleBugReportModal();
            const modal = document.getElementById('bug-report-modal');
            const isVisible = modal && !modal.classList.contains('hidden');
            const summary = document.getElementById('bug-report-tech-summary')?.innerHTML || '';
            closeBugReportModal();
            return { isVisible, hasSummary: summary.length > 20 };
          }
          return { error: 'toggleBugReportModal não encontrada' };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Resultado F8:', f8Result.result?.value);
    if (!f8Result.result?.value?.isVisible) throw new Error('F8 Bug Report não abriu corretamente.');

    console.log('\n--- TESTE 3: Simulador "E se?" Modal ---');
    const simResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof openPriceSimulatorModal === 'function') {
            // Cria um tile fictício se necessário para testar
            const grid = window.worldGrid;
            if (grid && grid[25] && grid[25][25]) {
              grid[25][25].store = {
                name: 'Loja Teste',
                shelves: {
                  bread: { price: 4.5, landedCost: 2.0, quality: 60 }
                }
              };
              openPriceSimulatorModal(25, 25, 'bread');
              const modal = document.getElementById('price-simulator-modal');
              const isVisible = modal && !modal.classList.contains('hidden');
              const slider = document.getElementById('sim-price-slider');
              let updatedPrice = 0;
              if (slider) {
                slider.value = 5.0;
                updatePriceSimulatorLive();
                updatedPrice = parseFloat(document.getElementById('sim-price-display')?.textContent.replace('$',''));
              }
              closePriceSimulatorModal();
              return { isVisible, updatedPrice };
            }
            return { error: 'Grid não disponível' };
          }
          return { error: 'openPriceSimulatorModal não encontrada' };
        })()
      `,
      returnByValue: true
    });
    console.log('Resultado Simulador:', simResult.result?.value);
    if (!simResult.result?.value?.isVisible) throw new Error('Simulador de preço não abriu corretamente.');

    console.log('\n✅ TODOS OS 3 TESTES DA FASE 7.0 D PASSARAM COM SUCESSO!');
    ws.close();
  } finally {
    browserProc.kill();
  }
}

run().catch(err => {
  console.error('Erro no teste:', err);
  browserProc.kill();
  process.exit(1);
});
