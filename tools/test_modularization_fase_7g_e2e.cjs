// tools/test_modularization_fase_7g_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5186;
const CDP_PORT = 9236;

const viteProcess = spawn('npx.cmd', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
  cwd: path.resolve(__dirname, '..'),
  shell: true,
  stdio: 'pipe'
});

let viteOut = '';
viteProcess.stdout.on('data', (d) => viteOut += d.toString());
viteProcess.stderr.on('data', (d) => viteOut += d.toString());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForVite() {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:' + VITE_PORT + '/', (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
      });
      console.log('✓ Servidor Vite ativo na porta', VITE_PORT);
      return;
    } catch (e) {
      await sleep(300);
    }
  }
  throw new Error('Timeout aguardando Vite iniciar');
}

async function run() {
  let edgeProc = null;
  let exitCode = 0;

  try {
    await waitForVite();

    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const edgeBin = edgePaths.find(p => fs.existsSync(p));
    if (!edgeBin) throw new Error('Navegador não encontrado');

    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7g');
    if (!fs.existsSync(tempProfile)) fs.mkdirSync(tempProfile, { recursive: true });

    edgeProc = spawn(edgeBin, [
      '--remote-debugging-port=' + CDP_PORT,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--user-data-dir=' + tempProfile,
      'http://localhost:' + VITE_PORT + '/'
    ]);

    await sleep(2500);

    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:' + CDP_PORT + '/json', res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes(String(VITE_PORT)) || !t.url.startsWith('about:'))) || targets.find(t => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Página do jogo não encontrada no CDP: ' + JSON.stringify(targets));
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function sendCdp(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else if (res.result && res.result.exceptionDetails) {
              const ex = res.result.exceptionDetails;
              const desc = ex.exception ? ex.exception.description : (ex.text || JSON.stringify(ex));
              reject(new Error('CDP JS Exception: ' + desc));
            } else {
              resolve(res.result);
            }
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const consoleErrors = [];
    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        consoleErrors.push(text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        console.error('Exception Details:', JSON.stringify(d, null, 2));
        consoleErrors.push(d.text + ' ' + (d.exception?.description || '') + ` at ${d.url}:${d.lineNumber}:${d.columnNumber}`);
      }
    });

    await sendCdp('Runtime.enable');
    await sendCdp('Page.enable');
    await sendCdp('Page.navigate', { url: 'http://localhost:' + VITE_PORT + '/' });

    async function evaluate(expression) {
      const res = await sendCdp('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res?.result?.value;
    }

    console.log('✓ Sessão CDP conectada. Aguardando inicialização completa do Oikonomia...');
    await sleep(3500);

    // Teste 1: Validação do Game Logger (addLog & addGameLog)
    const logTest = await evaluate(`
      (() => {
        if (typeof window.addLog !== 'function') return { ok: false, error: 'window.addLog ausente' };
        if (typeof window.addGameLog !== 'function') return { ok: false, error: 'window.addGameLog ausente' };
        if (typeof window.HUDSystem?.addLog !== 'function') return { ok: false, error: 'HUDSystem.addLog ausente' };

        const testMsg = 'TEST_LOG_' + Date.now();
        window.addLog(testMsg, 'text-emerald-400 font-bold', { category: 'TEST_E2E' });

        const container = document.getElementById('game-log-floating') || document.getElementById('game-logs');
        const found = container && container.textContent.includes(testMsg);
        return {
          ok: !!found,
          hasContainer: !!container,
          foundMessage: found
        };
      })()
    `);
    console.log('1. [Game Logger] addLog & addGameLog:', logTest);
    if (!logTest.ok) throw new Error('Falha no teste do Game Logger: ' + JSON.stringify(logTest));

    // Teste 2: Controle de Velocidade (setSpeed)
    const speedTest = await evaluate(`
      (() => {
        if (typeof window.setSpeed !== 'function') return { ok: false, error: 'window.setSpeed ausente' };
        if (typeof window.HUDSystem?.setSpeed !== 'function') return { ok: false, error: 'HUDSystem.setSpeed ausente' };

        window.setSpeed(3);
        const speed3 = window.gameSpeed === 3;
        const btn3 = document.getElementById('btn-3x');
        const btn3Active = btn3 && btn3.classList.contains('active');

        window.setSpeed(0);
        const speed0 = window.gameSpeed === 0;
        const btnP = document.getElementById('btn-p');
        const btnPActive = btnP && btnP.classList.contains('active');

        return {
          ok: speed3 && btn3Active && speed0 && btnPActive,
          speed3, btn3Active, speed0, btnPActive
        };
      })()
    `);
    console.log('2. [HUDSystem] setSpeed & Botões:', speedTest);
    if (!speedTest.ok) throw new Error('Falha no teste de setSpeed: ' + JSON.stringify(speedTest));

    // Teste 3: Lentes e Heatmap (setHeatmap)
    const heatmapTest = await evaluate(`
      (() => {
        if (typeof window.setHeatmap !== 'function') return { ok: false, error: 'window.setHeatmap ausente' };
        if (typeof window.NavigationSystem?.setHeatmap !== 'function') return { ok: false, error: 'NavigationSystem.setHeatmap ausente' };

        window.setHeatmap('traffic');
        const hmTraffic = window.currentHeatmap === 'traffic';
        const labelEl = document.getElementById('current-lens-label');
        const trafficLabel = labelEl && labelEl.textContent.includes('Tráfego');

        window.setHeatmap('terrain');
        const hmTerrain = window.currentHeatmap === 'terrain';

        return {
          ok: hmTraffic && trafficLabel && hmTerrain,
          hmTraffic, trafficLabel, hmTerrain
        };
      })()
    `);
    console.log('3. [NavigationSystem] setHeatmap & Lentes:', heatmapTest);
    if (!heatmapTest.ok) throw new Error('Falha no teste de setHeatmap: ' + JSON.stringify(heatmapTest));

    // Teste 4: Dropdowns de Navegação
    const dropdownTest = await evaluate(`
      (() => {
        const fns = [
          'toggleCitiesDropdown', 'closeCitiesDropdown',
          'toggleLensesDropdown', 'closeLensesDropdown',
          'toggleMoreOptionsMenu', 'closeMoreOptionsMenu'
        ];
        const allFns = fns.every(f => typeof window[f] === 'function' && typeof window.NavigationSystem[f] === 'function');
        
        window.toggleCitiesDropdown();
        const cMenu = document.getElementById('cities-dropdown-menu');
        const isOpen = cMenu && !cMenu.classList.contains('hidden');
        window.closeCitiesDropdown();
        const isClosed = cMenu && cMenu.classList.contains('hidden');

        return {
          ok: allFns && isOpen && isClosed,
          allFns, isOpen, isClosed
        };
      })()
    `);
    console.log('4. [NavigationSystem] Dropdowns de Interface:', dropdownTest);
    if (!dropdownTest.ok) throw new Error('Falha no teste de Dropdowns: ' + JSON.stringify(dropdownTest));

    // Teste 5: Modo Teatro (toggleTheaterMode)
    const theaterTest = await evaluate(`
      (() => {
        if (typeof window.toggleTheaterMode !== 'function') return { ok: false, error: 'window.toggleTheaterMode ausente' };
        if (typeof window.KeyboardSystem?.toggleTheaterMode !== 'function') return { ok: false, error: 'KeyboardSystem.toggleTheaterMode ausente' };

        window.toggleTheaterMode();
        const isTheaterOn = window.KeyboardSystem.isTheaterMode;
        window.toggleTheaterMode();
        const isTheaterOff = !window.KeyboardSystem.isTheaterMode;

        return {
          ok: isTheaterOn && isTheaterOff,
          isTheaterOn, isTheaterOff
        };
      })()
    `);
    console.log('5. [KeyboardSystem] toggleTheaterMode:', theaterTest);
    if (!theaterTest.ok) throw new Error('Falha no teste de modo teatro: ' + JSON.stringify(theaterTest));

    // Teste 6: Funções Econômicas e Simulação
    const econTest = await evaluate(`
      (() => {
        const pr = window.calcPriceRating(50, 45);
        const prodR = window.calcProductRating({ basePrice: 50 }, 50, 70, 50);
        const elast = window.calcElasticity(0.8, 50, 60, 50);
        const simDayFn = typeof window.simulateDay === 'function';
        const closeMonthFn = typeof window.closeMonthEnd === 'function';

        return {
          ok: typeof pr === 'number' && typeof prodR === 'number' && typeof elast === 'number' && simDayFn && closeMonthFn,
          pr, prodR, elast, simDayFn, closeMonthFn
        };
      })()
    `);
    console.log('6. [Simulation & CoreMath] Funções Matemáticas & Simulação:', econTest);
    if (!econTest.ok) throw new Error('Falha no teste de Simulação & CoreMath: ' + JSON.stringify(econTest));

    // Teste 7: Verificação de Erros Críticos de Console
    console.log('Console Errors detectados no navegador:', consoleErrors);
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('DevTools') && !e.includes('404'));
    if (criticalErrors.length > 0) {
      throw new Error('Erros críticos detectados no console: ' + criticalErrors.join(' | '));
    }

    console.log('====================================================');
    console.log('🎉 TODOS OS TESTES E2E DA FASE 7.0 G PASSARAM COM SUCESSO!');
    console.log('====================================================');

    ws.close();
  } catch (err) {
    console.error('❌ ERRO NO TESTE E2E FASE 7.0 G:', err);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    process.exit(exitCode);
  }
}

run();
