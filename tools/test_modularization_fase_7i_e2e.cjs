// tools/test_modularization_fase_7i_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5190;
const CDP_PORT = 9240;

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
    // 1. Verificação estática de index.html
    const htmlPath = path.resolve(__dirname, '../client/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const lineCount = htmlContent.split('\n').length;
    console.log('1. [Linhas de client/index.html]:', lineCount);
    if (lineCount > 2400) {
      throw new Error(`client/index.html ainda possui mais de 2400 linhas (${lineCount})`);
    }

    const inlineScriptMatches = htmlContent.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let inlineScriptContent = '';
    for (const s of inlineScriptMatches) {
      inlineScriptContent += s;
    }
    if (inlineScriptContent.includes('function bootEngine') || inlineScriptContent.includes('function openBankModal')) {
      throw new Error('client/index.html ainda contém funções legadas inline!');
    }
    console.log('✓ client/index.html é 100% livre de scripts monolíticos inline.');

    await waitForVite();

    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const edgeBin = edgePaths.find(p => fs.existsSync(p));
    if (!edgeBin) throw new Error('Navegador não encontrado');

    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7i');
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
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(300);
      const isReady = await evaluate('Boolean(window.__OIKO_MODULES_READY__ && window.worldGrid && window.worldGrid.length > 0)');
      if (isReady) {
        ready = true;
        break;
      }
    }
    if (!ready) throw new Error('Timeout aguardando __OIKO_MODULES_READY__ e worldGrid');

    // 2. Verifica funções do Bootstrap expostas em window
    const bootstrapFns = await evaluate(`({
      hasBootEngine: typeof window.bootEngine === 'function',
      hasInitMasterData: typeof window.initMasterData === 'function',
      hasInitInteractionState: typeof window.initInteractionState === 'function',
      hasBindGlobalPanelMethods: typeof window.bindGlobalPanelMethods === 'function'
    })`);
    console.log('2. [Bootstrap Functions]:', bootstrapFns);
    if (!bootstrapFns.hasBootEngine || !bootstrapFns.hasInitMasterData) {
      throw new Error('Funções de bootstrap ausentes em window!');
    }

    // 3. Verifica inicialização do Grid e Catálogos
    const engineState = await evaluate(`({
      gridRows: window.worldGrid ? window.worldGrid.length : 0,
      gridCols: window.worldGrid && window.worldGrid[0] ? window.worldGrid[0].length : 0,
      gridSize: window.GRID_SIZE,
      catalogProductsCount: window.PRODUCT_CATALOG ? Object.keys(window.PRODUCT_CATALOG).length : 0,
      brandRatingSample: window.playerBrandRating ? window.playerBrandRating['bread'] : null,
      cameraZoom: window.camera ? window.camera.zoom : null,
      currentAppScreen: window.currentAppScreen
    })`);
    console.log('3. [Engine State após Boot]:', engineState);
    if (engineState.gridRows !== 128 || engineState.gridCols !== 128) {
      throw new Error(`Grid 2D não possui dimensões 128x128! Recebido: ${engineState.gridRows}x${engineState.gridCols}`);
    }
    if (engineState.catalogProductsCount === 0) {
      throw new Error('Catálogo de produtos vazio!');
    }

    // 4. Testa invocação de delegators globais (onclick-safe)
    const delegatorsResult = await evaluate(`(() => {
      const hadOpenBank = typeof window.openBankModal === 'function';
      const hadOpenAdvisor = typeof window.openExecutiveBoardModal === 'function';
      const hadOpenDRE = typeof window.toggleDREModal === 'function';
      const hadOpenStore = typeof window.openStoreWizard === 'function';
      const hadOpenTechTree = typeof window.openTechTreeModal === 'function';
      const hadOpenEncyclopedia = typeof window.openEncyclopediaModal === 'function';
      const hadOpenMarketing = typeof window.openMarketingCentralModal === 'function';

      window.openBankModal();
      const bankModalVisible = !document.getElementById('bank-modal')?.classList.contains('hidden');
      window.closeBankModal();
      const bankModalClosed = document.getElementById('bank-modal')?.classList.contains('hidden');

      return {
        hadOpenBank,
        hadOpenAdvisor,
        hadOpenDRE,
        hadOpenStore,
        hadOpenTechTree,
        hadOpenEncyclopedia,
        hadOpenMarketing,
        bankModalInteraction: bankModalVisible && bankModalClosed
      };
    })()`);
    console.log('4. [Delegators & Modal Testing]:', delegatorsResult);
    if (!delegatorsResult.bankModalInteraction) {
      throw new Error('Interação com modal bancário falhou!');
    }

    console.log('5. [Console Errors]:', consoleErrors);
    if (consoleErrors.length > 0) {
      throw new Error('Erros no console detectados: ' + JSON.stringify(consoleErrors));
    }

    console.log('====================================================');
    console.log('🎉 TODOS OS TESTES E2E DA FASE 7.0 I PASSARAM COM SUCESSO!');
    console.log('====================================================');

    ws.close();
  } catch (err) {
    console.error('❌ ERRO NO TESTE:', err.message);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    try {
      const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7i');
      if (fs.existsSync(tempProfile)) fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
    process.exit(exitCode);
  }
}

run();
