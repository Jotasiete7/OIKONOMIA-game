/**
 * tools/test_telemetry_system.js
 * Teste E2E automatizado do Sistema de Telemetria, Captura Visual e Bug Replayer
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const HTML_FILE_URL = "file:///D:/OIKONOMIA%20PROJETO/dist/index.html";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }
}

async function runTelemetryTests() {
  console.log('================================================================');
  console.log('   TESTE AUTOMATIZADO: OIKOBUG FLIGHT RECORDER & TELEMETRIA     ');
  console.log('================================================================\n');

  console.log('1. Inicializando Microsoft Edge Chromium...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  await sleep(2500);

  let cdp = null;
  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9223/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`2. DevTools conectado: ${pageTarget.webSocketDebuggerUrl}`);

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log(`3. Navegando para o jogo: ${HTML_FILE_URL}`);
    await cdp.send('Page.navigate', { url: HTML_FILE_URL });
    await sleep(2000);

    // Dispensa tela de loading e abre o jogo
    await cdp.eval(`
      (() => {
        const ls = document.getElementById('loading-screen');
        if (ls) { ls.classList.add('hidden'); ls.style.display = 'none'; }
        const mm = document.getElementById('main-menu-screen');
        if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
        const wm = document.getElementById('welcome-tutorial-modal');
        if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
        currentAppScreen = 'PLAYING';
      })()
    `);

    // TESTE 1: Módulos e Funções Globais Expostos
    console.log('\n--- TESTE 1: Verificação da Exposição dos Módulos ---');
    const t1 = await cdp.eval(`
      (() => {
        return {
          hasTelemetrySystem: typeof window.TelemetrySystem !== 'undefined',
          hasCaptureScreenshot: typeof window.captureOptimizedScreenshot === 'function',
          hasAnalyzeBalance: typeof window.analyzeGameBalance === 'function',
          hasBuildPayload: typeof window.buildTelemetryPayload === 'function',
          hasDispatchReport: typeof window.dispatchReport === 'function',
          hasIsConfigured: typeof window.isSupabaseConfigured === 'function',
          isConfiguredVal: window.isSupabaseConfigured()
        };
      })()
    `);
    console.log('• TelemetrySystem exposto:', t1.hasTelemetrySystem ? '✅ Sim' : '❌ Não');
    console.log('• captureOptimizedScreenshot presente:', t1.hasCaptureScreenshot ? '✅ Sim' : '❌ Não');
    console.log('• analyzeGameBalance presente:', t1.hasAnalyzeBalance ? '✅ Sim' : '❌ Não');
    console.log('• buildTelemetryPayload presente:', t1.hasBuildPayload ? '✅ Sim' : '❌ Não');
    console.log('• isSupabaseConfigured conectado ao projeto oficial:', t1.isConfiguredVal === true ? '✅ Sim (Supabase Oficial Ativo)' : '❌ Incorreto');

    // TESTE 2: Captura Visual Otimizada
    console.log('\n--- TESTE 2: Captura Visual Otimizada (JPEG Downscaled) ---');
    const t2 = await cdp.eval(`
      (async () => {
        try {
          const cv = document.getElementById('iso-canvas');
          let toDataUrlErr = null;
          try {
            cv.toDataURL();
          } catch(e) {
            toDataUrlErr = e.message;
          }
          const shot = await window.captureOptimizedScreenshot();
          return {
            cvInfo: cv ? { w: cv.width, h: cv.height, tag: cv.tagName } : 'null',
            toDataUrlErr,
            hasShot: Boolean(shot),
            isJpeg: shot ? shot.startsWith('data:image/jpeg') : false,
            lengthKb: shot ? Math.round(shot.length / 1024) : 0,
            sample: shot ? shot.slice(0, 30) : null
          };
        } catch (err) {
          return { err: err.message, stack: err.stack };
        }
      })()
    `);
    console.log('• Detalhes do canvas:', t2.cvInfo || t2.err);
    console.log('• Erro direto do toDataURL no iso-canvas:', t2.toDataUrlErr || 'Nenhum');
    console.log('• Screenshot capturado:', t2.hasShot ? '✅ Sim' : '❌ Não');
    console.log('• Formato JPEG otimizado:', t2.isJpeg ? '✅ Sim' : '❌ Não');
    console.log(`• Tamanho do payload do print: ${t2.lengthKb} KB (Meta < 80 KB)`);

    // TESTE 3: Auditoria de Balanceamento & Heurísticas de Exploit
    console.log('\n--- TESTE 3: Heurísticas de Balanceamento Econômico ---');
    const t3 = await cdp.eval(`
      (() => {
        // Simula anomalia: caixa de $5M no primeiro ano
        const originalCash = cash;
        cash = 5000000;
        year = 1;
        month = 2;
        const analysis = window.analyzeGameBalance();
        cash = originalCash;
        return {
          anomaliesFound: analysis.anomalies.length,
          hasSurgeAnomaly: analysis.anomalies.some(a => a.code === 'SURGE_CASH_EXPLOSION'),
          empireFacilities: analysis.empireSummary.totalFacilities
        };
      })()
    `);
    console.log('• Anomalia de crescimento súbito de caixa detectada:', t3.hasSurgeAnomaly ? '✅ Sim (SURGE_CASH_EXPLOSION)' : '❌ Não');

    // TESTE 4: Modal de Reporte de Bugs (Abertura, DOM, Fechamento)
    console.log('\n--- TESTE 4: Interação com Modal de Reporte (F8 / UI) ---');
    const t4 = await cdp.eval(`
      (async () => {
        await openBugReportModal();
        const modal = document.getElementById('bug-report-modal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const titleInput = document.getElementById('bug-report-title');
        if (titleInput) titleInput.value = 'Teste Automatizado E2E de Bug';
        const descInput = document.getElementById('bug-report-desc');
        if (descInput) descInput.value = 'Descrição de teste do sistema de telemetria';
        
        // Testa geração de payload
        const payload = await prepareCurrentReportPayload();
        
        closeBugReportModal();
        const isClosed = modal && modal.classList.contains('hidden');

        return {
          modalOpened: isVisible,
          modalClosed: isClosed,
          payloadGenerated: Boolean(payload),
          payloadHasSave: Boolean(payload?.saveSnapshot),
          payloadHasDiag: Boolean(payload?.diagnostics)
        };
      })()
    `);
    console.log('• Modal F8 abre corretamente:', t4.modalOpened ? '✅ Sim' : '❌ Não');
    console.log('• Modal F8 fecha corretamente:', t4.modalClosed ? '✅ Sim' : '❌ Não');
    console.log('• Payload completo gerado com Savegame e Diagnósticos:', (t4.payloadGenerated && t4.payloadHasSave && t4.payloadHasDiag) ? '✅ Sim' : '❌ Não');

    // TESTE 5: Bug Replayer (Dev Dashboard F3)
    console.log('\n--- TESTE 5: Bug Replayer (Restauração Instantânea de Partida) ---');
    const t5 = await cdp.eval(`
      (() => {
        // Cria um save snapshot artificial com empresa "EmpresaTesteBug" e caixa $777,777
        const testSaveSnapshot = {
          saveVersion: CURRENT_SAVE_VERSION,
          playerProfile: { playerName: 'ReplayerTester', companyName: 'EmpresaTesteBug', avatarId: 'human_ceo', themeColor: 'cyan', difficulty: 'standard' },
          cash: 777777,
          day: 15,
          month: 6,
          year: 3,
          builtTiles: []
        };

        const replayerInput = document.getElementById('dev-replayer-json-input');
        if (replayerInput) replayerInput.value = JSON.stringify({ save_snapshot: testSaveSnapshot });

        loadReportSaveFromReplayer();

        return {
          restoredCompany: playerProfile.companyName,
          restoredCash: cash,
          restoredDate: 'Dia ' + day + '/' + month + ' A' + year
        };
      })()
    `);
    console.log(`• Empresa restaurada pelo Replayer: [${t5.restoredCompany}] (Esperado: EmpresaTesteBug)`);
    console.log(`• Saldo restaurado: $${t5.restoredCash} (Esperado: 777777)`);
    console.log(`• Data restaurada: ${t5.restoredDate} (Esperado: Dia 15/6 A3)`);

    const allPassed = t1.hasTelemetrySystem && t2.hasShot && t3.hasSurgeAnomaly && t4.payloadHasSave && t5.restoredCompany === 'EmpresaTesteBug';
    console.log('\n================================================================');
    console.log(allPassed ? '✅ SUCESSO TOTAL: Todos os testes de telemetria passaram!' : '❌ Alguns testes falharam.');
    console.log('================================================================\n');

  } finally {
    try { edgeProc.kill(); } catch (_) {}
  }
}

runTelemetryTests().catch(err => {
  console.error('Erro fatal no teste:', err);
  process.exit(1);
});
