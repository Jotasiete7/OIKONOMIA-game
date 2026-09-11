// tools/test_modularization_fase_7j_e2e.cjs
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = 5192;
const CDP_PORT = 9242;

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
    console.log('--- TESTE E2E FASE 7.0 J: EXTRAÇÃO TOTAL DOS ESTILOS CSS ---');

    // 1. Verificação estática de index.html
    const htmlPath = path.resolve(__dirname, '../client/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const lineCount = htmlContent.split('\n').length;
    console.log('1. [Linhas de client/index.html]:', lineCount);

    const styleTagsCount = (htmlContent.match(/<style/gi) || []).length;
    console.log('1.1. [Tags <style> em client/index.html]:', styleTagsCount);
    if (styleTagsCount !== 0) {
      throw new Error(`client/index.html ainda possui ${styleTagsCount} tags <style> embutidas! Esperado: 0.`);
    }

    const inlineScriptCount = (htmlContent.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || []).length;
    console.log('1.2. [Scripts inline em client/index.html]:', inlineScriptCount);
    if (inlineScriptCount !== 0) {
      throw new Error(`client/index.html ainda possui scripts inline! Esperado: 0.`);
    }

    // 2. Verificação dos arquivos modulares CSS
    const uiCssPath = path.resolve(__dirname, '../client/styles/ui.css');
    const bankingCssPath = path.resolve(__dirname, '../client/styles/banking.css');
    const styleCssPath = path.resolve(__dirname, '../client/style.css');

    if (!fs.existsSync(uiCssPath)) throw new Error('Arquivo client/styles/ui.css não encontrado!');
    if (!fs.existsSync(bankingCssPath)) throw new Error('Arquivo client/styles/banking.css não encontrado!');

    const styleCssContent = fs.readFileSync(styleCssPath, 'utf8');
    if (!styleCssContent.includes('styles/ui.css') || !styleCssContent.includes('styles/banking.css')) {
      throw new Error('client/style.css não importa os arquivos modais CSS!');
    }
    console.log('✓ Arquivos modulares client/styles/ui.css e client/styles/banking.css verificados com sucesso.');

    await waitForVite();

    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const edgeBin = edgePaths.find(p => fs.existsSync(p));
    if (!edgeBin) throw new Error('Navegador não encontrado');

    const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7j');
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

    // 3. Verifica se os estilos computados estão ativos no DOM
    const computedStyles = await evaluate(`(() => {
      // Cria elemento de teste com .hidden
      const testDiv = document.createElement('div');
      testDiv.className = 'hidden';
      document.body.appendChild(testDiv);
      const hiddenDisplay = window.getComputedStyle(testDiv).display;
      testDiv.remove();

      // Verifica loading screen
      const loadingScreen = document.getElementById('loading-screen');
      const loadingPosition = loadingScreen ? window.getComputedStyle(loadingScreen).position : null;
      const loadingZIndex = loadingScreen ? window.getComputedStyle(loadingScreen).zIndex : null;

      // Verifica slider do banco
      const bankSlider = document.getElementById('bank-loan-slider');
      const sliderComputed = bankSlider ? window.getComputedStyle(bankSlider) : null;
      const sliderHeight = sliderComputed ? sliderComputed.height : null;

      // Verifica ticker track
      const tickerTrack = document.getElementById('ticker-track') || document.querySelector('.ticker-scroll-track');
      const tickerComputed = tickerTrack ? window.getComputedStyle(tickerTrack) : null;
      const tickerAnimation = tickerComputed ? tickerComputed.animationName : null;

      // Verifica drag handle
      const dragTest = document.createElement('div');
      dragTest.className = 'drag-handle';
      document.body.appendChild(dragTest);
      const dragCursor = window.getComputedStyle(dragTest).cursor;
      dragTest.remove();

      return {
        hiddenDisplay,
        loadingPosition,
        loadingZIndex,
        sliderHeight,
        tickerAnimation,
        dragCursor
      };
    })()`);

    console.log('2. [Computed Styles no Navegador]:', computedStyles);

    if (computedStyles.hiddenDisplay !== 'none') {
      throw new Error(`.hidden não está aplicando display: none! Recebido: ${computedStyles.hiddenDisplay}`);
    }
    if (computedStyles.loadingPosition !== 'fixed' || computedStyles.loadingZIndex !== '99999') {
      throw new Error(`Estilos de #loading-screen incorretos! Recebido: pos=${computedStyles.loadingPosition}, zIndex=${computedStyles.loadingZIndex}`);
    }
    if (computedStyles.dragCursor !== 'grab') {
      throw new Error(`.drag-handle não está com cursor: grab! Recebido: ${computedStyles.dragCursor}`);
    }

    console.log('3. [Console Errors]:', consoleErrors);
    if (consoleErrors.length > 0) {
      throw new Error('Erros no console detectados: ' + JSON.stringify(consoleErrors));
    }

    console.log('====================================================');
    console.log('🎉 TODOS OS TESTES E2E DA FASE 7.0 J PASSARAM COM SUCESSO!');
    console.log('====================================================');

    ws.close();
  } catch (err) {
    console.error('❌ ERRO NO TESTE:', err.message);
    exitCode = 1;
  } finally {
    if (edgeProc) edgeProc.kill();
    viteProcess.kill();
    try {
      const tempProfile = path.resolve(__dirname, '../.edge_temp_profile_7j');
      if (fs.existsSync(tempProfile)) fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
    process.exit(exitCode);
  }
}

run();
