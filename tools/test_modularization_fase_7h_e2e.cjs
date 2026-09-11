// tools/test_modularization_fase_7g_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5188;
const CDP_PORT = 9238;

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

    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7h');
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

    // Teste 1: GameState e Proxies Reativos Bidirecionais
    const gameStateTest = await evaluate(`
      (() => {
        if (!window.GameState) return { ok: false, error: 'window.GameState ausente' };
        
        const initialCash = window.cash;
        const initialDay = window.day;
        const initialScreen = window.currentAppScreen;
        
        window.cash = initialCash + 12345;
        const gsUpdatedCash = window.GameState.cash === (initialCash + 12345);
        
        window.GameState.cash = initialCash;
        const winRestoredCash = window.cash === initialCash;

        return {
          ok: gsUpdatedCash && winRestoredCash && (typeof initialDay === 'number'),
          initialCash,
          initialDay,
          initialScreen,
          gsUpdatedCash,
          winRestoredCash
        };
      })()
    `);
    console.log('1. [GameState & Proxies Reativos]:', gameStateTest);
    if (!gameStateTest.ok) throw new Error('Falha no teste de GameState & Proxies: ' + JSON.stringify(gameStateTest));

    // Teste 2: Sub-coleções do GameState vinculadas em window
    const subCollectionsTest = await evaluate(`
      (() => {
        const checks = {
          hasPlayerBrandRating: !!window.playerBrandRating && typeof window.playerBrandRating === 'object',
          hasHistoricalLedger: Array.isArray(window.historicalLedger),
          hasActiveMarketingContracts: window.activeMarketingContracts instanceof Set || typeof window.activeMarketingContracts?.has === 'function',
          hasRdLabs: !!window.rdLabs && typeof window.rdLabs === 'object',
          hasUnlockedProducts: window.unlockedProducts instanceof Set || typeof window.unlockedProducts?.has === 'function',
          hasUnlockedCities: !!window.unlockedCities && typeof window.unlockedCities === 'object',
          hasAcquiredLicenses: window.acquiredLicenses instanceof Set || typeof window.acquiredLicenses?.has === 'function',
          hasGameSettings: !!window.gameSettings && typeof window.gameSettings === 'object'
        };
        const allOk = Object.values(checks).every(v => v === true);
        return {
          ok: allOk,
          checks,
          unlockedBread: window.unlockedProducts?.has ? window.unlockedProducts.has('bread') : false,
          unlockedNovaAtenas: !!window.unlockedCities?.nova_atenas
        };
      })()
    `);
    console.log('2. [GameState Sub-coleções]:', subCollectionsTest);
    if (!subCollectionsTest.ok) throw new Error('Falha no teste de Sub-coleções do GameState: ' + JSON.stringify(subCollectionsTest));

    // Teste 3: Utilitários & Distância Manhattan (window.getManhattanDist)
    const distTest = await evaluate(`
      (() => {
        if (typeof window.getManhattanDist !== 'function') return { ok: false, error: 'window.getManhattanDist ausente' };
        const p1 = { x: 10, y: 20 };
        const p2 = { x: 15, y: 32 };
        const dist = window.getManhattanDist(p1, p2);
        return {
          ok: dist === 17,
          dist
        };
      })()
    `);
    console.log('3. [CoreMath / getManhattanDist]:', distTest);
    if (!distTest.ok) throw new Error('Falha no teste de getManhattanDist: ' + JSON.stringify(distTest));

    // Teste 4: WorldGridEngine e Grid Geológico
    const gridTest = await evaluate(`
      (() => {
        const checks = {
          hasGridSize: window.GRID_SIZE === 128,
          hasWorldGrid: Array.isArray(window.worldGrid) && window.worldGrid.length > 0,
          hasActiveFacilitySet: window.activeFacilitySet instanceof Map || typeof window.activeFacilitySet?.get === 'function',
          hasCheckCityUnlocks: typeof window.checkCityUnlocks === 'function',
          hasIsIronTile: typeof window.isIronTile === 'function',
          hasIsOilTile: typeof window.isOilTile === 'function',
          hasGetCityForTile: typeof window.getCityForTile === 'function',
          hasTileKey: typeof window._tileKey === 'function'
        };
        const citySample = window.getCityForTile ? window.getCityForTile(50, 50) : null;
        return {
          ok: Object.values(checks).every(Boolean) && !!citySample,
          checks,
          citySample
        };
      })()
    `);
    console.log('4. [WorldGridEngine & Grid]:', gridTest);
    if (!gridTest.ok) throw new Error('Falha no teste de WorldGridEngine: ' + JSON.stringify(gridTest));

    // Teste 5: CanvasRenderer & Câmera
    const canvasTest = await evaluate(`
      (() => {
        const checks = {
          hasCamera: !!window.camera && typeof window.camera.zoom === 'number',
          hasResizeCanvas: typeof window.resizeCanvas === 'function',
          hasRenderMap: typeof window.renderMap === 'function',
          hasResetCamera: typeof window.resetCamera === 'function',
          hasJumpToCity: typeof window.jumpToCity === 'function',
          hasGridToScreen: typeof window.gridToScreen === 'function',
          hasScreenToGrid: typeof window.screenToGrid === 'function'
        };
        return {
          ok: Object.values(checks).every(Boolean),
          checks,
          cameraZoom: window.camera?.zoom
        };
      })()
    `);
    console.log('5. [CanvasRenderer & Câmera]:', canvasTest);
    if (!canvasTest.ok) throw new Error('Falha no teste de CanvasRenderer & Câmera: ' + JSON.stringify(canvasTest));

    // Teste 6: Painéis Especializados
    const panelsTest = await evaluate(`
      (() => {
        const checks = {
          hasAdvisorPanel: !!window.AdvisorPanel,
          hasDREPanel: !!window.DREPanel,
          hasBankingPanel: !!window.BankingPanel,
          hasFacilityPanel: !!window.FacilityPanel,
          hasStoreWizard: !!window.StoreWizard,
          hasConstructionWizards: !!window.ConstructionWizards,
          hasMarketingPanel: !!window.MarketingPanel,
          hasRDPanel: !!window.RDPanel,
          hasTechTreePanel: !!window.TechTreePanel,
          hasEncyclopediaPanel: !!window.EncyclopediaPanel
        };
        return {
          ok: Object.values(checks).every(Boolean),
          checks
        };
      })()
    `);
    console.log('6. [Painéis Modais]:', panelsTest);
    if (!panelsTest.ok) throw new Error('Falha no teste dos Painéis: ' + JSON.stringify(panelsTest));

    // Teste 7: Verificação de Erros Críticos de Console
    console.log('Console Errors detectados no navegador:', consoleErrors);
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('DevTools') && !e.includes('404'));
    if (criticalErrors.length > 0) {
      throw new Error('Erros críticos detectados no console: ' + criticalErrors.join(' | '));
    }

    console.log('====================================================');
    console.log('🎉 TODOS OS TESTES E2E DA FASE 7.0 H PASSARAM COM SUCESSO!');
    console.log('====================================================');

    ws.close();
  } catch (err) {
    console.error('❌ ERRO NO TESTE E2E FASE 7.0 H:', err);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    process.exit(exitCode);
  }
}

run();
