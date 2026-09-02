/**
 * tools/audit_e3e_10years_zero_to_hero.js
 * 
 * AUDITORIA E3E MASTER: SIMULAÇÃO ZERO TO HERO DE 10 ANOS (CICLO DECENAL COMPLETO)
 * 
 * Executa uma campanha autônoma de ponta a ponta:
 * 1. Ano 1-2: Fase 1 (Retomada & Fundação) — Standard $100k, Trigo, Moinho, Padaria, Mini-Mercado e Jornal (22 pts IBOPE).
 * 2. Ano 3-5: Fase 2 (Superaquecimento / Boom) — Expansão Porto Real/Montargis, Cola, TV (78 pts IBOPE), Centro de P&D.
 * 3. Ano 6-7: Fase 3 (Saturação & Desaceleração) — Proteção de Margem, Otimização e Acúmulo de Caixa.
 * 4. Ano 8-10: Fase 4 (Recessão & Value Investing) — Compra de Patentes com 35% de desconto e Insumos a preço baixo.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const HTML_FILE_URL = "file:///D:/OIKONOMIA%20PROJETO/client/index.html";
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/auditoria/screenshots');
const DOCS_DIR = path.resolve(__dirname, '../docs/auditoria');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

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

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fullPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    console.log(`  📸 Screenshot salvo: ${filename}`);
    return fullPath;
  }
}

async function run10YearsZeroToHero() {
  console.log('================================================================');
  console.log('🏛️  OIKONOMIA — E3E 10 ANOS ZERO TO HERO: CAMPANHA COMPLETA     ');
  console.log('================================================================\n');

  console.log('1. Inicializando Microsoft Edge Chromium Headless...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  await sleep(2500);

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`2. DevTools conectado: ${pageTarget.webSocketDebuggerUrl}`);

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log(`3. Carregando OIKONOMIA em ${HTML_FILE_URL}...`);
    await cdp.send('Page.navigate', { url: HTML_FILE_URL });
    await sleep(2000);

    // Inicialização da Partida
    console.log('4. Inicializando Campanha Zero to Hero (Standard: $100.000)...');
    const init = await cdp.eval(`
      (() => {
        const ls = document.getElementById('loading-screen');
        if (ls) { ls.classList.add('hidden'); ls.style.display = 'none'; }
        const mm = document.getElementById('main-menu-screen');
        if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
        const wm = document.getElementById('welcome-tutorial-modal');
        if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
        currentAppScreen = 'PLAYING';

        playerProfile = {
          playerName: 'Arthur Vance',
          companyName: 'Vance Agro-Industrial Holding',
          avatarId: 'human_young',
          themeColor: 'emerald',
          difficulty: 'standard',
          logoRegenSeed: 777
        };
        cash = 100000;
        day = 1; month = 1; year = 1;
        updatePlayerProfileHUD();
        updateUI();

        return {
          company: playerProfile.companyName,
          startingCash: cash,
          macroLoaded: typeof MacroCycleSystem !== 'undefined',
          tickerLoaded: typeof CorporateTicker !== 'undefined'
        };
      })()
    `);
    console.log(`  ✓ Empresa Fundada: ${init.company} (Caixa: $${init.startingCash.toLocaleString()})`);
    await cdp.captureScreenshot('e3e_node_10years_01_founding.png');

    // Execução dos 10 Anos
    console.log('\n--- [EXECUTANDO OS 10 ANOS DO CICLO DECENAL] ---');
    const simResult = await cdp.eval(`
      (() => {
        // 1. Fase 1: Anos 1 e 2
        const farmWheat = worldGrid[44][37];
        farmWheat.farm = {
          id: 'farm_wheat_1', name: '🌾 Fazenda de Trigo Santa Maria',
          farmTypeId: 'farm_wheat', cropId: 'wheat', cropName: 'Trigo & Cereais',
          quality: 65, dailyYield: 400, dailyOperatingCost: 0.25, stock: 1500, maxCapacity: 5000
        };
        _indexTile(farmWheat);

        const mill = worldGrid[38][88];
        mill.factory = {
          id: 'factory_mill_1', name: '⚙️ Moinho Central Montargis',
          lines: {
            'line_flour': {
              recipeId: 'flour_wheat', dailyCapacity: 250, finishedStock: 800, maxStock: 3000,
              inputsConfig: { 'wheat': { supplierId: 'farm_44_37', landedCost: 0.40 } }
            }
          }
        };
        _indexTile(mill);

        const bakery = worldGrid[39][88];
        bakery.factory = {
          id: 'factory_bakery_1', name: '🍞 Panificadora Vance',
          lines: {
            'line_bread': {
              recipeId: 'bread_simple', dailyCapacity: 200, finishedStock: 600, maxStock: 2500,
              inputsConfig: { 'flour': { supplierId: 'factory_38_88_line_flour', landedCost: 0.85 } }
            }
          }
        };
        _indexTile(bakery);

        const store = worldGrid[38][38];
        store.store = {
          id: 'store_atenas_1', name: '🏪 Mini-Mercado Nova Atenas', storeTypeId: 'supermarket',
          shelves: {
            'bread': { price: 2.80, stock: 450, maxCapacity: 1500, dailyRestock: 120, quality: 68, supplierId: 'factory_39_88_line_bread', landedCost: 1.10 }
          }
        };
        _indexTile(store);

        activeMarketingContracts.set('newspaper', { outletId: 'newspaper', monthlyCost: 1500, scope: 'corporate', targetProductId: null });
        cash -= 35000;

        for (let d = 0; d < 720; d++) simulateDay(); // Anos 1 e 2

        // 2. Fase 2: Anos 3 a 5 (Boom & TV)
        unlockedCities['porto_real'] = true;
        unlockedCities['montargis'] = true;
        activeMarketingContracts.delete('newspaper');
        activeMarketingContracts.set('tv', { outletId: 'tv', monthlyCost: 15000, scope: 'corporate', targetProductId: null });

        for (let d = 0; d < 1080; d++) simulateDay(); // Anos 3 a 5

        // 3. Fase 3: Anos 6 e 7 (Saturação)
        activeMarketingContracts.delete('tv');
        activeMarketingContracts.set('radio', { outletId: 'radio', monthlyCost: 5000, scope: 'corporate', targetProductId: null });

        for (let d = 0; d < 720; d++) simulateDay(); // Anos 6 e 7

        // 4. Fase 4: Anos 8 a 10 (Recessão & Value Investing)
        const discount = MacroCycleSystem.getTechDiscountMultiplier(year);
        rdResearchTree['chocolate'] = { currentQR: 88, progressMoney: 0 };
        cash -= Math.round(45000 * (1 - discount));

        for (let d = 0; d < 1080; d++) simulateDay(); // Anos 8 a 10

        const totalNet10Years = historicalLedger.reduce((acc, cur) => acc + cur.netProfit, 0);
        const totalRev10Years = historicalLedger.reduce((acc, cur) => acc + cur.revenue, 0);

        return {
          finalYear: year,
          finalMonth: month,
          finalCash: cash,
          totalRevenue10Years: totalRev10Years,
          totalNetProfit10Years: totalNet10Years,
          avgMargin: totalRev10Years > 0 ? ((totalNet10Years / totalRev10Years) * 100).toFixed(1) : 0,
          totalFacilities: activeFacilitySet.size,
          macroPhase: MacroCycleSystem.getHUDLabel(year)
        };
      })()
    `);

    console.log(`\n🏆 RESULTADO FINAL (10 ANOS):`);
    console.log(`  • Ano Final: Ano ${simResult.finalYear} / Mês ${simResult.finalMonth}`);
    console.log(`  • Caixa Final: $${simResult.finalCash.toLocaleString()}`);
    console.log(`  • Faturamento Total: $${simResult.totalRevenue10Years.toLocaleString()}`);
    console.log(`  • Lucro Líquido Acumulado: $${simResult.totalNetProfit10Years.toLocaleString()}`);
    console.log(`  • Margem Líquida Média: ${simResult.avgMargin}%`);
    console.log(`  • Status Macroeconômico: ${simResult.macroPhase.text}`);

    await cdp.captureScreenshot('e3e_node_10years_02_conclusao.png');

  } catch (err) {
    console.error('❌ Erro na Auditoria E3E:', err);
  } finally {
    edgeProc.kill();
  }
}

if (require.main === module) {
  run10YearsZeroToHero();
}
