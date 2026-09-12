// tools/test_modularization_fase_7k_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5194;
const CDP_PORT = 9244;

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
    console.log('--- TESTE E2E FASE 7.0 K: COMPONENTIZAÇÃO DE TEMPLATES HTML ---');

    // 1. Verificação estática de index.html
    const htmlPath = path.resolve(__dirname, '../client/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const lineCount = htmlContent.split('\n').length;
    console.log('1. [Linhas de client/index.html]:', lineCount);
    if (lineCount > 420) {
      throw new Error(`client/index.html ainda possui mais de 420 linhas (${lineCount})! Esperado <= 410.`);
    }

    if (!htmlContent.includes('id="oiko-modals-mount"')) {
      throw new Error('client/index.html não possui o container #oiko-modals-mount!');
    }

    const styleTagsCount = (htmlContent.match(/<style/gi) || []).length;
    const inlineScriptCount = (htmlContent.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || []).length;
    if (styleTagsCount !== 0 || inlineScriptCount !== 0) {
      throw new Error(`Tags de estilo ou script inline encontradas! style=${styleTagsCount}, script=${inlineScriptCount}`);
    }
    console.log('✓ client/index.html é uma casca limpa de apenas', lineCount, 'linhas.');

    // 2. Verificação dos 4 templates modulares
    const templates = [
      'finance_modals.html',
      'operations_modals.html',
      'wizards_modals.html',
      'system_overlays.html'
    ];
    for (const tpl of templates) {
      const p = path.resolve(__dirname, '../client/ui/templates', tpl);
      if (!fs.existsSync(p)) throw new Error(`Template ausente: ${tpl}`);
      const sz = fs.statSync(p).size;
      if (sz < 500) throw new Error(`Template ${tpl} muito pequeno (${sz} bytes)!`);
    }
    console.log('✓ Todos os 4 arquivos de template modulares em client/ui/templates/ verificados.');

    await waitForVite();

    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const edgeBin = edgePaths.find(p => fs.existsSync(p));
    if (!edgeBin) throw new Error('Navegador não encontrado');

    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7k');
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
    if (!ready) throw new Error('Timeout aguardando inicialização da engine');

    // 3. Verifica se todos os modais foram montados dentro de #oiko-modals-mount
    const mountCheck = await evaluate(`(() => {
      const mount = document.getElementById('oiko-modals-mount');
      if (!mount) return { exists: false };

      const checkIds = [
        'bank-modal',
        'dre-modal',
        'facility-dre-modal',
        'price-simulator-modal',
        'insolvency-modal',
        'bankruptcy-modal',
        'diary-modal',
        'warehouse-modal',
        'rd-center-modal',
        'tech-tree-modal',
        'rd-new-project-modal',
        'executive-board-modal',
        'marketing-modal',
        'encyclopedia-modal',
        'factory-recipe-modal',
        'store-modal',
        'mine-modal',
        'farm-modal',
        'factory-modal',
        'supplier-modal',
        'main-menu-screen',
        'new-game-modal',
        'save-load-modal',
        'pause-menu-modal',
        'settings-modal',
        'dev-dashboard-modal',
        'bug-report-modal'
      ];

      const missing = [];
      for (const id of checkIds) {
        if (!document.getElementById(id)) missing.push(id);
      }

      return {
        exists: true,
        childCount: mount.childElementCount,
        missing
      };
    })()`);

    console.log('2. [Montagem de Modais no DOM]:', mountCheck);
    if (!mountCheck.exists || mountCheck.missing.length > 0) {
      throw new Error(`Modais ausentes no DOM após montagem: ${JSON.stringify(mountCheck.missing)}`);
    }

    // 4. Testa abertura e fechamento interativo de múltiplos modais
    const interactiveTest = await evaluate(`(() => {
      // 1. Banco
      window.openBankModal();
      const bankOpen = !document.getElementById('bank-modal')?.classList.contains('hidden');
      window.closeBankModal();
      const bankClosed = document.getElementById('bank-modal')?.classList.contains('hidden');

      // 2. Diretoria Executiva
      window.openExecutiveBoardModal();
      const advOpen = !document.getElementById('executive-board-modal')?.classList.contains('hidden');
      window.closeExecutiveBoardModal();
      const advClosed = document.getElementById('executive-board-modal')?.classList.contains('hidden');

      // 3. Dev Dashboard
      window.openDevDashboard();
      const devOpen = !document.getElementById('dev-dashboard-modal')?.classList.contains('hidden');
      window.closeDevDashboard();
      const devClosed = document.getElementById('dev-dashboard-modal')?.classList.contains('hidden');

      return {
        bankOk: bankOpen && bankClosed,
        advOk: advOpen && advClosed,
        devOk: devOpen && devClosed
      };
    })()`);

    console.log('3. [Interação com Modais]:', interactiveTest);
    if (!interactiveTest.bankOk || !interactiveTest.advOk || !interactiveTest.devOk) {
      throw new Error(`Falha em testes de interação de modais: ${JSON.stringify(interactiveTest)}`);
    }

    // 4. Verificação de Renderização do Canvas e Minimapa
    const canvasTest = await evaluate(`(() => {
      const canvas = document.getElementById('iso-canvas');
      const ctx = canvas ? canvas.getContext('2d') : null;
      let canvasPixel = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        const p = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
        canvasPixel = Array.from(p);
      }
      const mmCanvas = document.getElementById('minimap-canvas');
      const mmCtx = mmCanvas ? mmCanvas.getContext('2d') : null;
      let mmPixel = null;
      if (mmCtx && mmCanvas.width > 0 && mmCanvas.height > 0) {
        const p = mmCtx.getImageData(Math.floor(mmCanvas.width / 2), Math.floor(mmCanvas.height / 2), 1, 1).data;
        mmPixel = Array.from(p);
      }
      return {
        hasCanvas: !!canvas,
        canvasPixel,
        hasMmCanvas: !!mmCanvas,
        mmPixel,
        fpsText: document.getElementById('telemetry-fps')?.textContent
      };
    })()`);

    console.log('4. [Renderização Canvas & Telemetria]:', canvasTest);
    if (!canvasTest.hasCanvas || !canvasTest.canvasPixel || canvasTest.canvasPixel[3] === 0) {
      throw new Error(`Falha na renderização do canvas principal: ${JSON.stringify(canvasTest)}`);
    }
    if (!canvasTest.hasMmCanvas || !canvasTest.mmPixel || canvasTest.mmPixel[3] === 0) {
      throw new Error(`Falha na renderização do minimapa: ${JSON.stringify(canvasTest)}`);
    }

    console.log('5. [Console Errors]:', consoleErrors);
    if (consoleErrors.length > 0) {
      throw new Error('Erros no console detectados: ' + JSON.stringify(consoleErrors));
    }

    console.log('====================================================');
    console.log('🎉 TODOS OS TESTES E2E DA FASE 7.0 K PASSARAM COM SUCESSO!');
    console.log('====================================================');

    ws.close();
  } catch (err) {
    console.error('❌ ERRO NO TESTE:', err.message);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    try {
      const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7k');
      if (fs.existsSync(tempProfile)) fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
    process.exit(exitCode);
  }
}

run();
