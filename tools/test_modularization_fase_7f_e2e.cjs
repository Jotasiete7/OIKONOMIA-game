// tools/test_modularization_fase_7f_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5184;
const CDP_PORT = 9234;

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

    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7f');
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

    // Teste 1: Validação do SupplierPicker e getSupplierOffersForProduct
    const supplierTest = await evaluate(`
      (() => {
        if (typeof window.getSupplierOffersForProduct !== 'function') return { ok: false, error: 'getSupplierOffersForProduct não é função' };
        if (typeof window.SupplierPicker?.getSupplierOffersForProduct !== 'function') return { ok: false, error: 'SupplierPicker.getSupplierOffersForProduct ausente' };
        const offers = window.getSupplierOffersForProduct('bread', { x: 38, y: 38 });
        return {
          ok: Array.isArray(offers) && offers.length > 0,
          offerCount: offers.length,
          sampleOffer: offers[0] ? { name: offers[0].name, price: offers[0].price, qr: offers[0].qr } : null
        };
      })()
    `);
    console.log('1. [SupplierPicker] Ofertas de Fornecedores:', supplierTest);
    if (!supplierTest.ok) throw new Error('Falha no teste de SupplierPicker: ' + JSON.stringify(supplierTest));

    // Teste 2: Validação do StoreWizard nichos e licenças
    const nicheTest = await evaluate(`
      (() => {
        if (typeof window.hasNicheLicense !== 'function') return { ok: false, error: 'hasNicheLicense ausente' };
        if (typeof window.getNicheLicenseCost !== 'function') return { ok: false, error: 'getNicheLicenseCost ausente' };
        const kombiniCost = window.getNicheLicenseCost('kombini');
        const hasKombini = window.hasNicheLicense('kombini');
        return {
          ok: typeof kombiniCost === 'number' && typeof hasKombini === 'boolean',
          kombiniCost,
          hasKombini
        };
      })()
    `);
    console.log('2. [StoreWizard] Licenças de Nicho:', nicheTest);
    if (!nicheTest.ok) throw new Error('Falha no teste de StoreWizard: ' + JSON.stringify(nicheTest));

    // Teste 3: Validação das delegações do Canvas Renderer, IsoMath, CameraController e Minimap
    const canvasTest = await evaluate(`
      (() => {
        const checks = {
          renderMap: typeof window.renderMap === 'function',
          renderMinimap: typeof window.renderMinimap === 'function',
          resizeCanvas: typeof window.resizeCanvas === 'function',
          resetCamera: typeof window.resetCamera === 'function',
          jumpToCity: typeof window.jumpToCity === 'function',
          focusOnTile: typeof window.focusOnTile === 'function',
          changeZoom: typeof window.changeZoom === 'function',
          gridToScreen: typeof window.gridToScreen === 'function',
          screenToGrid: typeof window.screenToGrid === 'function',
          drawDiamond: typeof window.drawDiamond === 'function',
          drawBuilding: typeof window.drawBuilding === 'function'
        };
        const allPass = Object.values(checks).every(Boolean);
        const g2s = window.gridToScreen(10, 10);
        return {
          ok: allPass && typeof g2s.sx === 'number',
          checks,
          sampleScreenPos: g2s
        };
      })()
    `);
    console.log('3. [Canvas & Camera] Funções de Renderização & Câmera:', canvasTest);
    if (!canvasTest.ok) throw new Error('Falha no teste de Canvas & Camera: ' + JSON.stringify(canvasTest));

    // Teste 4: Validação do Sistema Bancário e Score de Crédito
    const bankingTest = await evaluate(`
      (() => {
        const checks = {
          calcAverageQRAllResearched: typeof window.calcAverageQRAllResearched === 'function',
          calcAverageBrandRating: typeof window.calcAverageBrandRating === 'function',
          calcBankingCreditScore: typeof window.calcBankingCreditScore === 'function',
          processBankingInstallments: typeof window.processBankingInstallments === 'function'
        };
        const avgQR = window.calcAverageQRAllResearched();
        const avgBrand = window.calcAverageBrandRating();
        const score = window.calcBankingCreditScore();
        return {
          ok: Object.values(checks).every(Boolean) && typeof avgBrand === 'number',
          checks,
          avgQR,
          avgBrand,
          hasScore: score !== null
        };
      })()
    `);
    console.log('4. [BankingPanel] Métricas e Score de Crédito:', bankingTest);
    if (!bankingTest.ok) throw new Error('Falha no teste de BankingPanel: ' + JSON.stringify(bankingTest));

    // Teste 5: Validação do Sistema de Saves e Migrações
    const saveTest = await evaluate(`
      (() => {
        const checks = {
          extractBuiltTiles: typeof window.extractBuiltTiles === 'function',
          applyBuiltTiles: typeof window.applyBuiltTiles === 'function',
          serializeCurrentGame: typeof window.serializeCurrentGame === 'function',
          saveGame: typeof window.saveGame === 'function',
          saveGameInNewSlot: typeof window.saveGameInNewSlot === 'function',
          quickSaveGame: typeof window.quickSaveGame === 'function',
          loadGameFromData: typeof window.loadGameFromData === 'function',
          loadGameById: typeof window.loadGameById === 'function',
          deleteSaveById: typeof window.deleteSaveById === 'function',
          exportSaveFile: typeof window.exportSaveFile === 'function',
          handleImportSaveFile: typeof window.handleImportSaveFile === 'function',
          checkAutoSave: typeof window.checkAutoSave === 'function'
        };
        const allPass = Object.values(checks).every(Boolean);
        const serialized = window.serializeCurrentGame();
        return {
          ok: allPass && serialized && serialized.saveVersion && Array.isArray(serialized.builtTiles),
          checks,
          saveVersion: serialized?.saveVersion,
          builtCount: serialized?.builtTiles?.length
        };
      })()
    `);
    console.log('5. [SaveSystem] Serialização e Operações de Save:', saveTest);
    if (!saveTest.ok) throw new Error('Falha no teste de SaveSystem: ' + JSON.stringify(saveTest));

    // Teste 6: Validação do Boot Loader e Lifecycle
    const lifecycleTest = await evaluate(`
      (() => {
        return {
          ok: typeof window.startBootSequence === 'function' && typeof window.rotateLoadingTip === 'function',
          hasAppLifecycle: !!window.AppLifecycle
        };
      })()
    `);
    console.log('6. [AppLifecycle] Sequência de Boot:', lifecycleTest);
    if (!lifecycleTest.ok) throw new Error('Falha no teste de AppLifecycle: ' + JSON.stringify(lifecycleTest));

    // Teste 7: Verificação de Erros Críticos de Console
    console.log('Console Errors detectados no navegador:', consoleErrors);
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('DevTools') && !e.includes('404'));
    if (criticalErrors.length > 0) {
      throw new Error('Erros críticos detectados no console: ' + criticalErrors.join(' | '));
    }

    console.log('====================================================');
    console.log('🎉 TODOS OS TESTES E2E DA FASE 7.0 F PASSARAM COM SUCESSO!');
    console.log('====================================================');

    ws.close();
  } catch (err) {
    console.error('❌ ERRO NO TESTE E2E FASE 7.0 F:', err);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    process.exit(exitCode);
  }
}

run();
