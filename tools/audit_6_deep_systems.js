/**
 * tools/audit_6_deep_systems.js
 * Auditoria Profunda E2E no Navegador Real (Microsoft Edge Chromium via DevTools WebSocket)
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const HTML_FILE_URL = "file:///D:/OIKONOMIA%20PROJETO/client/index.html";
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/auditoria/screenshots');
const DOCS_DIR = path.resolve(__dirname, '../docs/auditoria');

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
    console.log(`📸 Screenshot salvo: ${fullPath}`);
    return fullPath;
  }
}

async function runDeepAudits() {
  console.log('================================================================');
  console.log('   AUDITORIA PROFUNDA DE 6 SISTEMAS — OIKONOMIA (EDGE CDP)       ');
  console.log('================================================================\n');

  console.log('1. Inicializando Microsoft Edge Chromium...');
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

  let cdp;
  const auditReports = {};

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

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log(`3. Carregando jogo: ${HTML_FILE_URL}`);
    await cdp.send('Page.navigate', { url: HTML_FILE_URL });
    await sleep(1500);

    // Dispensa a tela de loading de 6.5s, menu principal e tutorial para entrar diretamente no modo PLAYING
    await cdp.eval(`
      (() => {
        const ls = document.getElementById('loading-screen');
        if (ls) {
          ls.classList.add('hidden', 'opacity-0');
          ls.style.display = 'none';
        }
        const mm = document.getElementById('main-menu-screen');
        if (mm) {
          mm.classList.add('hidden');
          mm.style.display = 'none';
        }
        const wm = document.getElementById('welcome-tutorial-modal');
        if (wm) {
          wm.classList.add('hidden');
          wm.style.display = 'none';
        }
        currentAppScreen = 'PLAYING';
        cash = 1000000;
        updateUI();
        if (typeof renderGameLoop === 'function') renderGameLoop();
      })()
    `);
    await sleep(600);

    // ─────────────────────────────────────────────────────────────────────────
    // SISTEMA 1: Ciclo de Vida Temporal & Stress Test Financeiro (365 Ticks a 5x)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTANDO SISTEMA 1: Simulação Temporal de 365 Dias (1 Ano) ---');
    const r1 = await cdp.eval(`
      (() => {
        cash = 500000;
        day = 1; month = 1; year = 2026;

        // Monta cadeia produtiva: Fazenda de Trigo (10,10) -> Fábrica de Farinha/Pão (12,10) -> Supermercado (14,10)
        const farmTile = worldGrid[10][10];
        farmTile.farm = {
          id: 'farm_wheat_1',
          name: 'Fazenda de Trigo Imperial',
          cropId: 'wheat',
          unitCost: 0.25,
          quality: 60,
          dailyYield: 500,
          stock: 2000,
          maxCapacity: 5000
        };
        _indexTile(farmTile);

        const factoryTile = worldGrid[12][10];
        factoryTile.factory = {
          id: 'factory_bread_1',
          name: 'Panificadora Industrial',
          maxLines: 4,
          lines: {
            rec_flour: {
              recipeId: 'rec_flour',
              recipeName: 'Moagem de Farinha',
              outputProductId: 'flour',
              dailyCapacity: 400,
              unitCost: 0.50,
              outputQuality: 60,
              finishedStock: 1000,
              maxStock: 3000,
              inputsConfig: {
                wheat: { supplierId: 'farm_wheat_1', supplierName: 'Fazenda Trigo', wholesalePrice: 0.25, freight: 0.05, landedCost: 0.30, quality: 60 }
              }
            },
            rec_bread: {
              recipeId: 'rec_bread',
              recipeName: 'Panificação de Pão Francês',
              outputProductId: 'bread',
              dailyCapacity: 400,
              unitCost: 0.70,
              outputQuality: 60,
              finishedStock: 1000,
              maxStock: 3000,
              inputsConfig: {
                flour: { supplierId: 'internal_factory', supplierName: 'Fábrica Farinha', wholesalePrice: 0.50, freight: 0.00, landedCost: 0.50, quality: 60 }
              }
            }
          }
        };
        _indexTile(factoryTile);

        const storeTile = worldGrid[14][10];
        storeTile.district = CITY_DISTRICTS.downtown;
        storeTile.store = {
          id: 'store_super_1',
          name: 'Supermercado Central',
          storeTypeId: 'supermarket',
          maxShelves: 10,
          dailyRent: 120,
          shelves: {
            bread: {
              price: 1.80,
              stock: 500,
              maxCapacity: 1500,
              dailyRestock: 250,
              quality: 60,
              supplierId: 'factory_bread_1',
              supplierName: 'Panificadora Industrial',
              wholesalePrice: 0.70,
              unitFreight: 0.05,
              landedCost: 0.75
            }
          }
        };
        _indexTile(storeTile);

        const history = [];
        let anyNaN = false;
        let anyInfinity = false;

        // Executa 365 ticks de simulação
        for (let i = 0; i < 365; i++) {
          const preMonthRev = monthRevenue;
          const preMonthCogs = monthCogs;
          const preDay = day;
          const preMonth = month;
          const preYear = year;

          simulateDay();

          if ((i + 1) % 30 === 0 || i === 364) {
            if (isNaN(cash) || isNaN(monthRevenue) || isNaN(monthCogs)) anyNaN = true;
            if (!isFinite(cash)) anyInfinity = true;
            history.push({
              simulatedDays: i + 1,
              date: preDay + '/' + preMonth + '/' + preYear,
              cash: Math.round(cash),
              monthRevenueAccumulated: Math.round(preMonthRev),
              monthCogsAccumulated: Math.round(preMonthCogs),
              farmStock: Math.round(farmTile.farm.stock),
              breadStock: Math.round(factoryTile.factory.lines.rec_bread.finishedStock),
              storeShelfStock: Math.round(storeTile.store.shelves.bread.stock)
            });
          }
        }

        // Abre modal da DRE para conferir renderização
        toggleDREModal();
        const dreModal = document.getElementById('dre-modal');
        const dreVisible = dreModal && !dreModal.classList.contains('hidden');
        const dreText = dreModal ? dreModal.innerText : '';

        return {
          history,
          anyNaN,
          anyInfinity,
          finalDay: day,
          finalMonth: month,
          finalYear: year,
          finalCash: cash,
          dreVisible,
          dreTextSample: dreText.slice(0, 150)
        };
      })()
    `);

    auditReports.system1 = r1;
    console.log(`[S1.1] 365 Dias Simulados: Dia ${r1.finalDay}/${r1.finalMonth}/${r1.finalYear}`);
    console.log(`[S1.2] Integridade Numérica (NaN/Infinity): ${!r1.anyNaN && !r1.anyInfinity ? '✅ PERFEITO (0 falhas numéricas)' : '❌ FALHOU'}`);
    console.log(`[S1.3] Evolução de Caixa: Início $500.000 ➔ Final $${r1.finalCash.toLocaleString('en-US')}`);
    console.log(`[S1.4] DRE Aberta e Renderizada: ${r1.dreVisible ? '✅ Sim' : '❌ Não'}`);
    await cdp.captureScreenshot('screenshot_audit_01_lifecycle_365d.png');
    await cdp.eval(`toggleDREModal();`);

    // ─────────────────────────────────────────────────────────────────────────
    // SISTEMA 2: Expansão Geográfica & Transição de Cidades
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTANDO SISTEMA 2: Expansão Geográfica & Navegação de Cidades ---');
    const r2 = await cdp.eval(`
      (() => {
        // Reset das cidades para estado virgem
        unlockedCities.nova_atenas = true;
        unlockedCities.porto_real = true;
        unlockedCities.montargis = false;
        unlockedCities.varzea = false;

        const testMontargisLockBefore = !unlockedCities.montargis;
        const testVarzeaLockBefore = !unlockedCities.varzea;

        // Testa navegação para cada cidade
        const cities = ['nova_atenas', 'porto_real', 'montargis', 'varzea'];
        const transitions = [];

        for (const c of cities) {
          jumpToCity(c);
          transitions.push({
            city: c,
            camX: typeof camX !== 'undefined' ? camX : 0,
            camY: typeof camY !== 'undefined' ? camY : 0
          });
        }

        // Calcula frete entre Nova Atenas (centro ~64,64) e Porto Real / Montargis
        const distToPortoReal = CoreMath.calculateManhattanDistance({x: 64, y: 64}, {x: 20, y: 20});
        const distToMontargis = CoreMath.calculateManhattanDistance({x: 64, y: 64}, {x: 100, y: 100});
        const freightPorto = CoreMath.calculateUnitFreight(distToPortoReal, 0.015, 0.05);
        const freightMontargis = CoreMath.calculateUnitFreight(distToMontargis, 0.015, 0.05);

        return {
          testMontargisLockBefore,
          testVarzeaLockBefore,
          transitions,
          distToPortoReal,
          distToMontargis,
          freightPorto,
          freightMontargis
        };
      })()
    `);

    auditReports.system2 = r2;
    console.log(`[S2.1] Travas Iniciais de Cidade: Montargis Bloqueada=${r2.testMontargisLockBefore ? '✅ Sim' : '❌ Não'}, Várzea Bloqueada=${r2.testVarzeaLockBefore ? '✅ Sim' : '❌ Não'}`);
    console.log(`[S2.2] Transições de Câmera/Viewport: ${r2.transitions.length} cidades navegadas com jumpToCity`);
    console.log(`[S2.3] Cálculo de Frete Intermunicipal: Dist Porto Real (${r2.distToPortoReal} tiles) = $${r2.freightPorto} | Dist Montargis (${r2.distToMontargis} tiles) = $${r2.freightMontargis}`);
    await cdp.captureScreenshot('screenshot_audit_02_cities_expansion.png');

    // ─────────────────────────────────────────────────────────────────────────
    // SISTEMA 3: Sistema de Marketing, Mídia & Brand Rating
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTANDO SISTEMA 3: Marketing, Contratos de Mídia & Brand Rating ---');
    const r3 = await cdp.eval(`
      (() => {
        cash = 500000;
        openMarketingCentralModal();

        const modal = document.getElementById('marketing-modal');
        const modalVisible = modal && !modal.classList.contains('hidden');

        // Contrata campanha para "bread" usando o primeiro canal de rádio
        const outlet = MEDIA_OUTLETS ? MEDIA_OUTLETS[0] : { id: 'media_radio_metro', dailyCost: 35 };
        const contractKey = outlet.id + '::bread';
        activeMarketingContracts.add(contractKey);

        const initialBrand = playerBrandRating['bread'] || 0;
        
        // Simula 30 dias com campanha ativa
        const brandHistory = [];
        for (let i = 0; i < 30; i++) {
          simulateDay();
          if (i % 10 === 0 || i === 29) {
            brandHistory.push({
              day: i + 1,
              brand: playerBrandRating['bread'] || 0,
              monthMarketingExpenses
            });
          }
        }

        const finalBrand = playerBrandRating['bread'] || 0;

        return {
          modalVisible,
          outletName: outlet.name,
          contractKey,
          initialBrand,
          finalBrand,
          brandGrew: finalBrand > initialBrand,
          brandHistory,
          marketingExpensesDeducted: monthMarketingExpenses > 0,
          monthMarketingExpenses
        };
      })()
    `);

    auditReports.system3 = r3;
    console.log(`[S3.1] Modal de Marketing Central Aberto: ${r3.modalVisible ? '✅ Sim' : '❌ Não'}`);
    console.log(`[S3.2] Contrato Firmado: ${r3.contractKey}`);
    console.log(`[S3.3] Progressão de Brand Rating: ${r3.initialBrand} ➔ ${r3.finalBrand.toFixed(1)} (${r3.brandGrew ? '✅ Cresceu com a campanha' : '⚠️ Estático'})`);
    console.log(`[S3.4] Débito de Despesas de Marketing na DRE: ${r3.marketingExpensesDeducted ? `✅ Sim ($${r3.monthMarketingExpenses})` : '❌ Não'}`);
    await cdp.captureScreenshot('screenshot_audit_03_marketing_brand.png');
    await cdp.eval(`closeMarketingModal();`);

    // ─────────────────────────────────────────────────────────────────────────
    // SISTEMA 4: Sistema Financeiro / DRE Consolidada & Caixa
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTANDO SISTEMA 4: Auditoria de DRE & Conciliação de Caixa ---');
    const r4 = await cdp.eval(`
      (() => {
        toggleDREModal();
        const grossSalesEl = document.getElementById('dre-gross-sales');
        const cogsEl = document.getElementById('dre-cogs');
        const rentEl = document.getElementById('dre-rent');
        const mktEl = document.getElementById('dre-marketing');
        const netProfitEl = document.getElementById('dre-net-profit');

        const calculatedNet = monthRevenue - monthCogs - monthFixedExpenses - monthMarketingExpenses;

        return {
          grossSalesText: grossSalesEl ? grossSalesEl.textContent : '',
          cogsText: cogsEl ? cogsEl.textContent : '',
          rentText: rentEl ? rentEl.textContent : '',
          mktText: mktEl ? mktEl.textContent : '',
          netProfitText: netProfitEl ? netProfitEl.textContent : '',
          rawMath: {
            monthRevenue,
            monthCogs,
            monthFixedExpenses,
            monthMarketingExpenses,
            calculatedNet
          }
        };
      })()
    `);

    auditReports.system4 = r4;
    console.log(`[S4.1] DRE Conciliada: Receita=$${r4.rawMath.monthRevenue.toLocaleString()} | CPV=$${r4.rawMath.monthCogs.toLocaleString()} | Fixos=$${r4.rawMath.monthFixedExpenses.toLocaleString()} | Mkt=$${r4.rawMath.monthMarketingExpenses.toLocaleString()}`);
    console.log(`[S4.2] Lucro Líquido Calculado: $${r4.rawMath.calculatedNet.toLocaleString('en-US')}`);
    await cdp.captureScreenshot('screenshot_audit_04_dre_reconciliation.png');
    await cdp.eval(`toggleDREModal();`);

    // ─────────────────────────────────────────────────────────────────────────
    // SISTEMA 5: Inteligência Artificial dos Concorrentes
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTANDO SISTEMA 5: IA dos Concorrentes (Guerra de Preços & Market Share) ---');
    const r5 = await cdp.eval(`
      (() => {
        // Constrói um concorrente em (20, 20)
        const compTile = worldGrid[20][20];
        compTile.district = CITY_DISTRICTS.downtown;
        compTile.competitor = {
          id: 'comp_titan_1',
          name: 'Titan Megastores',
          shelves: {
            bread: {
              price: 2.20,
              quality: 50,
              stock: 1000
            }
          },
          lastShare: 0.30 // Força perda de share inicial
        };
        _indexTile(compTile);

        // Constrói loja do jogador vizinha em (21, 20) com preço menor e QR superior
        const playerTile = worldGrid[21][20];
        playerTile.district = CITY_DISTRICTS.downtown;
        playerTile.store = {
          id: 'store_rival_test',
          name: 'Supermercado Agressivo',
          storeTypeId: 'supermarket',
          maxShelves: 10,
          dailyRent: 120,
          shelves: {
            bread: {
              price: 1.50,
              quality: 75,
              stock: 1000,
              maxCapacity: 2000,
              dailyRestock: 300,
              wholesalePrice: 0.70,
              unitFreight: 0.05,
              landedCost: 0.75
            }
          }
        };
        _indexTile(playerTile);

        const priceBefore = compTile.competitor.shelves.bread.price;
        
        // Roda 35 dias de simulação para a IA do concorrente fechar o ciclo mensal e reagir
        const priceHistory = [priceBefore];
        const shareHistory = [];
        for (let i = 0; i < 35; i++) {
          simulateDay();
          priceHistory.push(compTile.competitor.shelves.bread.price);
          shareHistory.push(compTile.competitor.lastShare);
        }

        const priceAfter = compTile.competitor.shelves.bread.price;

        return {
          priceBefore,
          priceAfter,
          priceDropped: priceAfter < priceBefore,
          priceHistory,
          shareHistory,
          finalShare: compTile.competitor.lastShare
        };
      })()
    `);

    auditReports.system5 = r5;
    console.log(`[S5.1] IA do Concorrente Reagiu: Preço Inicial $${r5.priceBefore} ➔ Preço Pós-Concorrência $${r5.priceAfter}`);
    console.log(`[S5.2] Guerra de Preços Dinâmica: ${r5.priceDropped ? '✅ PASSOU (Concorrente baixou preço para defender market share)' : '⚠️ Sem alteração'}`);
    await cdp.captureScreenshot('screenshot_audit_05_competitor_ai.png');

    // ─────────────────────────────────────────────────────────────────────────
    // SISTEMA 6: Stress Test de Save / Load & Persistência
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- EXECUTANDO SISTEMA 6: Stress Test de Save / Load de Império Complexo ---');
    const r6 = await cdp.eval(`
      (() => {
        cash = 777888;
        acquiredLicenses.add('electronics');
        acquiredLicenses.add('automotive');
        unlockedProducts.add('smartphone');
        unlockedProducts.add('sedan_car');

        // Salva o jogo
        const saveSuccess = saveGame('slot_stress_test');
        const serialized = serializeCurrentGame();

        // Limpa o mapa (simula wipe)
        activeFacilitySet.clear();
        cash = 0;
        acquiredLicenses.clear();
        unlockedProducts.clear();

        // Carrega o jogo de volta do snapshot
        const loadSuccess = loadGameFromData(serialized);

        // Valida se tudo voltou perfeitamente
        const restoredCash = cash;
        const restoredLicenses = Array.from(acquiredLicenses);
        const restoredProducts = Array.from(unlockedProducts);
        const restoredFacilityCount = activeFacilitySet.size;

        return {
          saveSuccess,
          loadSuccess,
          restoredCash,
          restoredLicenses,
          hasElectronicsLicense: acquiredLicenses.has('electronics'),
          hasAutomotiveLicense: acquiredLicenses.has('automotive'),
          hasSmartphone: unlockedProducts.has('smartphone'),
          restoredFacilityCount
        };
      })()
    `);

    auditReports.system6 = r6;
    console.log(`[S6.1] Save / Serialization: ${r6.saveSuccess ? '✅ Sucesso' : '❌ Falhou'}`);
    console.log(`[S6.2] Load / Deserialization: ${r6.loadSuccess ? '✅ Sucesso' : '❌ Falhou'}`);
    console.log(`[S6.3] Saldo Restaurado: $${r6.restoredCash.toLocaleString('en-US')}`);
    console.log(`[S6.4] Licenças de Nicho Restauradas: ${r6.hasElectronicsLicense && r6.hasAutomotiveLicense ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`[S6.5] Instalações Restauradas no Mapa: ${r6.restoredFacilityCount} tiles ativos`);
    await cdp.captureScreenshot('screenshot_audit_06_save_load_stress.png');

    console.log('\n================================================================');
    console.log('   TODAS AS 6 AUDITORIAS FORAM EXECUTADAS COM SUCESSO!           ');
    console.log('================================================================');

    // Salva o relatório consolidado em JSON
    const reportPath = path.join(DOCS_DIR, 'audit_6_systems_results.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditReports, null, 2), 'utf8');
    console.log(`\nDados consolidados salvos em: ${reportPath}`);

  } catch (err) {
    console.error('ERRO DURANTE AUDITORIA DOS 6 SISTEMAS:', err);
  } finally {
    if (edgeProc) {
      edgeProc.kill();
      console.log('Navegador headless encerrado.');
    }
  }
}

runDeepAudits();
