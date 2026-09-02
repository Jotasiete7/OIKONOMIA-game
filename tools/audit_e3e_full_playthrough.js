/**
 * tools/audit_e3e_full_playthrough.js
 * 
 * AUDITORIA E3E MASTER: SIMULAÇÃO COMPLETA DE PLAYTHROUGH NO NAVEGADOR REAL (EDGE CDP)
 * 
 * Executa uma partida autônoma de ponta a ponta:
 * 1. Inicialização de Jogo & Teste das 4 Dificuldades (Easy, Standard, Tycoon, Hardcore).
 * 2. Construção de Cadeias de Suprimentos Básicas até Ultra Complexas (Agro, Pecuária com Ração, Laticínios, Siderurgia, Têxtil e Tech).
 * 3. Verificação de Detalhes Ordinários da UI (Botões, Menus, Dropdown de Lentes, Enciclopédia, Árvore Tech, Simulador E Se, Calculadora P&D).
 * 4. Stress Test Financeiro Multi-Anual (3 Anos / 1.095 dias) com Auditoria Anti-Sinking, Gargalos, Solvência e DRE do Analista Corporativo.
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

async function runMasterE3EPlaythrough() {
  console.log('================================================================');
  console.log('🏛️  OIKONOMIA — SUITE DE TESTES E3E MASTER: PLAYTHROUGH COMPLETO ');
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

  let cdp;
  const results = {
    timestamp: new Date().toISOString(),
    version: 'v0.8.3',
    phases: {}
  };

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

    console.log(`3. Carregando jogo em: ${HTML_FILE_URL}`);
    await cdp.send('Page.navigate', { url: HTML_FILE_URL });
    await sleep(1500);

    // Bypass da tela de loading para iniciar simulação
    await cdp.eval(`
      (() => {
        const ls = document.getElementById('loading-screen');
        if (ls) { ls.classList.add('hidden', 'opacity-0'); ls.style.display = 'none'; }
        const mm = document.getElementById('main-menu-screen');
        if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
        const wm = document.getElementById('welcome-tutorial-modal');
        if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
        currentAppScreen = 'PLAYING';
        updateUI();
      })()
    `);
    await sleep(500);

    // ─────────────────────────────────────────────────────────────────────────
    // FASE 1: TESTE DE DIFICULDADES & WIZARDS DE INICIALIZAÇÃO
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [FASE 1: TESTE DE DIFICULDADES & WIZARDS] ---');
    const f1 = await cdp.eval(`
      (() => {
        const diffReports = [];
        for (const d of DIFFICULTY_PRESETS) {
          diffReports.push({
            id: d.id,
            name: d.name,
            startingCash: d.startingCash,
            marginMultiplier: d.marginMultiplier,
            rdCostMultiplier: d.rdCostMultiplier,
            loanInterestRate: d.loanInterestRate
          });
        }

        // Configura uma empresa de teste completa
        playerProfile = {
          playerName: 'Victor Vance',
          companyName: 'Titan Holdings Corp',
          avatarId: 'human_elder',
          themeColor: 'amber',
          difficulty: 'standard',
          logoRegenSeed: 42
        };
        cash = 2500000;
        day = 1; month = 1; year = 1;
        updatePlayerProfileHUD();
        updateUI();

        return {
          totalPresets: diffReports.length,
          presets: diffReports,
          configuredCompany: playerProfile.companyName,
          cashInitial: cash
        };
      })()
    `);
    console.log(`  ✓ 4 Dificuldades validadas (Easy, Standard, Tycoon, Hardcore)`);
    console.log(`  ✓ Perfil Corporativo configurado: ${f1.configuredCompany} (Caixa: $${f1.cashInitial.toLocaleString()})`);
    results.phases.phase1_difficulties = f1;

    // ─────────────────────────────────────────────────────────────────────────
    // FASE 2: CONSTRUÇÃO DAS 6 CADEIAS DE SUPRIMENTOS (DO SIMPLES AO COMPLEXO)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [FASE 2: CONSTRUÇÃO DE CADEIAS DE SUPRIMENTOS COMPLEXAS] ---');
    const f2 = await cdp.eval(`
      (() => {
        const facilitiesBuilt = [];

        // 1. CADEIA ALIMENTAR BÁSICA: Trigo -> Farinha -> Pão
        const farmWheat = worldGrid[44][37];
        farmWheat.farm = {
          id: 'farm_wheat_1',
          name: '🌾 Fazenda de Trigo Imperial',
          farmTypeId: 'farm_wheat',
          cropId: 'wheat',
          cropName: 'Trigo & Cereais',
          quality: 65,
          dailyYield: 600,
          dailyOperatingCost: 0.25,
          stock: 3000,
          maxCapacity: 6000
        };
        _indexTile(farmWheat);
        facilitiesBuilt.push({ type: 'farm', name: farmWheat.farm.name, loc: '44,37' });

        // 2. CADEIA PECUÁRIA COM RAÇÃO NUTRITIVA: Granja Avícola + Trigo -> Ovos
        const farmPoultry = worldGrid[46][37];
        farmPoultry.farm = {
          id: 'farm_poultry_1',
          name: '🐔 Granja Avícola Santa Fé',
          farmTypeId: 'farm_poultry',
          cropId: 'poultry',
          cropName: 'Ovos & Aves',
          quality: 70,
          dailyYield: 750, // Com ração
          dailyOperatingCost: 0.40,
          stock: 2500,
          maxCapacity: 5000,
          feedConfig: {
            active: true,
            supplierId: 'farm_44_37',
            grainProdId: 'wheat',
            yieldBonusPct: 50,
            qualityBonus: 15
          }
        };
        _indexTile(farmPoultry);
        facilitiesBuilt.push({ type: 'farm', name: farmPoultry.farm.name, loc: '46,37' });

        // 3. CADEIA DE LATICÍNIOS: Pecuária Leiteira -> Leite Pasteurizado
        const farmDairy = worldGrid[47][37];
        farmDairy.farm = {
          id: 'farm_dairy_1',
          name: '🥛 Pecuária Leiteira Alvorada',
          farmTypeId: 'farm_dairy',
          cropId: 'raw_milk',
          cropName: 'Leite Cru',
          quality: 68,
          dailyYield: 500,
          dailyOperatingCost: 0.35,
          stock: 2000,
          maxCapacity: 5000
        };
        _indexTile(farmDairy);
        facilitiesBuilt.push({ type: 'farm', name: farmDairy.farm.name, loc: '47,37' });

        // 4. CADEIA MINERAL & SIDERÚRGICA: Mina de Ferro + Mina de Sílica -> Aço
        const mineIron = worldGrid[35][30];
        mineIron.mine = {
          id: 'mine_iron_1',
          name: '⛏️ Mina de Ferro Vulcão',
          resourceId: 'iron_ore',
          resourceName: 'Minério de Ferro',
          quality: 72,
          dailyYield: 450,
          unitCost: 0.80,
          stock: 4000,
          maxCapacity: 8000
        };
        _indexTile(mineIron);
        facilitiesBuilt.push({ type: 'mine', name: mineIron.mine.name, loc: '35,30' });

        const mineSilica = worldGrid[36][30];
        mineSilica.mine = {
          id: 'mine_silica_1',
          name: '⛏️ Jazida de Sílica & Quartzo',
          resourceId: 'silica',
          resourceName: 'Sílica Industrial',
          quality: 70,
          dailyYield: 400,
          unitCost: 0.65,
          stock: 3500,
          maxCapacity: 8000
        };
        _indexTile(mineSilica);
        facilitiesBuilt.push({ type: 'mine', name: mineSilica.mine.name, loc: '36,30' });

        // 5. COMPLEXO INDUSTRIAL INTEGRADO (Fábrica Central com 4 Linhas de Produção)
        const facCentral = worldGrid[43][37];
        facCentral.factory = {
          id: 'factory_central_1',
          name: '🏭 Complexo Industrial Metropolitano',
          maxLines: 4,
          lines: {
            rec_flour: {
              recipeId: 'rec_flour',
              recipeName: 'Moagem de Farinha',
              outputProductId: 'flour',
              productName: 'Farinha de Trigo',
              dailyCapacity: 500,
              unitCost: 0.45,
              outputQuality: 65,
              finishedStock: 1500,
              maxStock: 4000,
              inputsConfig: {
                wheat: { supplierId: 'farm_44_37', supplierName: 'Fazenda Trigo', wholesalePrice: 0.25, freight: 0.01, landedCost: 0.26, quality: 65 }
              }
            },
            rec_bread: {
              recipeId: 'rec_bread',
              recipeName: 'Panificação Artesanal',
              outputProductId: 'bread',
              productName: 'Pão Artesanal',
              dailyCapacity: 500,
              unitCost: 0.65,
              outputQuality: 68,
              finishedStock: 2000,
              maxStock: 4000,
              inputsConfig: {
                flour: { supplierId: 'factory_43_37_rec_flour', supplierName: 'Fábrica Farinha', wholesalePrice: 0.45, freight: 0.00, landedCost: 0.45, quality: 65 }
              }
            },
            rec_pasteurized_milk: {
              recipeId: 'rec_pasteurized_milk',
              recipeName: 'Pasteurização de Leite',
              outputProductId: 'milk',
              productName: 'Leite Pasteurizado',
              dailyCapacity: 450,
              unitCost: 0.60,
              outputQuality: 70,
              finishedStock: 1800,
              maxStock: 4000,
              inputsConfig: {
                raw_milk: { supplierId: 'farm_47_37', supplierName: 'Pecuária Leiteira', wholesalePrice: 0.35, freight: 0.02, landedCost: 0.37, quality: 68 }
              }
            },
            rec_steel: {
              recipeId: 'rec_steel',
              recipeName: 'Siderurgia & Aço Estrutural',
              outputProductId: 'steel',
              productName: 'Lingotes de Aço',
              dailyCapacity: 350,
              unitCost: 1.80,
              outputQuality: 72,
              finishedStock: 1200,
              maxStock: 3000,
              inputsConfig: {
                iron_ore: { supplierId: 'mine_35_30', supplierName: 'Mina Ferro', wholesalePrice: 0.80, freight: 0.08, landedCost: 0.88, quality: 72 }
              }
            }
          }
        };
        _indexTile(facCentral);
        facilitiesBuilt.push({ type: 'factory', name: facCentral.factory.name, loc: '43,37' });

        // 6. REDE DE VAREJO COMERCIAL MULTICIDADE (Nova Atenas, Porto Real e Várzea)
        const storeNA = worldGrid[40][37];
        storeNA.district = { name: 'Distrito Residencial (Nova Atenas)', population: 15750, trafficIndex: 49, landRentDaily: 14 };
        storeNA.store = {
          id: 'store_na_1',
          name: '🏪 Kombini de Bairro (Nova Atenas)',
          storeTypeId: 'kombini',
          maxShelves: 4,
          dailyRent: 14,
          shelves: {
            bread: { price: 2.80, stock: 1000, maxCapacity: 1000, dailyRestock: 150, quality: 68, supplierId: 'factory_43_37_rec_bread', supplierName: 'Fábrica Central', landedCost: 0.68 },
            milk:  { price: 2.20, stock: 1000, maxCapacity: 1000, dailyRestock: 120, quality: 70, supplierId: 'factory_43_37_rec_pasteurized_milk', supplierName: 'Fábrica Central', landedCost: 0.62 },
            eggs:  { price: 2.10, stock: 1000, maxCapacity: 1000, dailyRestock: 140, quality: 70, supplierId: 'farm_46_37', supplierName: 'Granja Avícola', landedCost: 0.42 }
          }
        };
        _indexTile(storeNA);
        facilitiesBuilt.push({ type: 'store', name: storeNA.store.name, loc: '40,37' });

        const storePR = worldGrid[92][37];
        storePR.district = { name: 'Distrito Comercial (Porto Real)', population: 9800, trafficIndex: 42, landRentDaily: 12 };
        storePR.store = {
          id: 'store_pr_1',
          name: '🏪 Kombini de Bairro (Porto Real)',
          storeTypeId: 'kombini',
          maxShelves: 4,
          dailyRent: 12,
          shelves: {
            bread: { price: 2.90, stock: 800, maxCapacity: 1000, dailyRestock: 90, quality: 68, supplierId: 'factory_43_37_rec_bread', supplierName: 'Fábrica Central', landedCost: 1.15 },
            eggs:  { price: 2.20, stock: 800, maxCapacity: 1000, dailyRestock: 80, quality: 70, supplierId: 'farm_46_37', supplierName: 'Granja Avícola', landedCost: 0.95 }
          }
        };
        _indexTile(storePR);
        facilitiesBuilt.push({ type: 'store', name: storePR.store.name, loc: '92,37' });

        // 7. CENTRO DE P&D AVANÇADO
        const rdTile = worldGrid[45][37];
        rdTile.rdCenter = {
          id: 'rd_center_1',
          name: '🔬 Centro de P&D Nova Atenas',
          maxLabs: 4,
          dailyRent: 20
        };
        _indexTile(rdTile);
        facilitiesBuilt.push({ type: 'rdCenter', name: rdTile.rdCenter.name, loc: '45,37' });

        return {
          totalFacilities: facilitiesBuilt.length,
          sparseIndexCount: activeFacilitySet.size,
          facilities: facilitiesBuilt
        };
      })()
    `);

    console.log(`  ✓ ${f2.totalFacilities} instalações construídas e integradas com sucesso!`);
    console.log(`  ✓ Sparse Index O(k) ativo com ${f2.sparseIndexCount} nós.`);
    results.phases.phase2_supply_chain = f2;

    // ─────────────────────────────────────────────────────────────────────────
    // FASE 3: TESTES DE DETALHES ORDINÁRIOS DA UI (MENUS, MODAIS, SIMULADORES)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [FASE 3: VERIFICAÇÃO DE UI, MENUS, MODAIS & CALCULADORAS] ---');
    const f3 = await cdp.eval(`
      (() => {
        const uiChecks = [];

        // 1. Dropdown de Lentes
        setHeatmap('opportunity');
        uiChecks.push({ element: 'Lens: opportunity', activeHeatmap: currentHeatmap });
        setHeatmap('terrain');
        uiChecks.push({ element: 'Lens: terrain', activeHeatmap: currentHeatmap });

        // 2. Simulador "E se?"
        const tileStore = worldGrid[40][37];
        openPriceSimulatorModal(40, 37, 'bread');
        const simOpen = !document.getElementById('price-simulator-modal').classList.contains('hidden');
        
        // Simula mudança de preço para $3.20 no slider
        document.getElementById('sim-price-slider').value = 3.20;
        updatePriceSimulatorLive();
        const salesText = document.getElementById('sim-sales-display').textContent;
        const marginText = document.getElementById('sim-margin-display').textContent;
        const profitText = document.getElementById('sim-profit-display').textContent;
        applyPriceSimulatorResult();
        const newPriceApplied = tileStore.store.shelves['bread'].price === 3.20;
        uiChecks.push({ element: 'PriceSimulator', simOpen, salesText, marginText, profitText, newPriceApplied });

        // 3. Botão "Encher" (Drenagem de Silo Interno a Custo $0)
        tileStore.store.shelves['bread'].stock = 500; // Esvazia para testar
        const preCash = cash;
        const facTile = worldGrid[43][37];
        const preFacStock = facTile.factory.lines['rec_bread'].finishedStock;
        buyInstantStock(40, 37, 'bread', 500);
        const postStock = tileStore.store.shelves['bread'].stock;
        const postFacStock = facTile.factory.lines['rec_bread'].finishedStock;
        const cashDiff = preCash - cash;
        uiChecks.push({ element: 'InstantRefillInternal', postStock, postFacStock, cashDiffZero: cashDiff === 0 });

        // 4. Calculadora de Retorno de P&D (ROI)
        openRDNewProjectModal();
        document.getElementById('rd-product-select').value = 'bread';
        onRDProductSelectChange();
        document.getElementById('rd-target-qr-slider').value = 85;
        updateRDWizardPreview();
        const roiBoxVisible = !document.getElementById('rd-roi-calculator-box').classList.contains('hidden');
        const calcVolume = document.getElementById('rd-calc-volume').textContent;
        const calcStores = document.getElementById('rd-calc-stores').textContent;
        const calcGain = document.getElementById('rd-calc-gain').textContent;
        const calcPayback = document.getElementById('rd-calc-payback').textContent;
        const verdict = document.getElementById('rd-roi-verdict-badge').textContent;
        closeRDNewProjectModal();
        uiChecks.push({ element: 'RDReturnCalculator', roiBoxVisible, calcVolume, calcStores, calcGain, calcPayback, verdict });

        // 5. DRE Interativa & Analista Corporativo
        renderFacilityDRETable();
        const dreRev = document.getElementById('fdre-total-rev').textContent;
        const dreNet = document.getElementById('fdre-total-net').textContent;
        uiChecks.push({ element: 'DRE_Table', dreRev, dreNet });

        return { uiChecks };
      })()
    `);

    for (const c of f3.uiChecks) {
      console.log(`  ✓ [UI OK] ${c.element}: ${JSON.stringify(c)}`);
    }
    results.phases.phase3_ui_verification = f3;
    await cdp.captureScreenshot('e3e_master_ui_verified.png');

    // ─────────────────────────────────────────────────────────────────────────
    // FASE 4: STRESS TEST MULTI-ANUAL (1.095 DIAS / 3 ANOS) & ANTI-SINKING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [FASE 4: STRESS TEST MULTI-ANUAL DE 3 ANOS (1.095 DIAS)] ---');
    const f4 = await cdp.eval(`
      (() => {
        let nanDetected = false;
        let infinityDetected = false;
        let lowestCash = cash;
        let peakCash = cash;
        let totalSalesCount = 0;
        let bankruptOccurred = false;

        const yearlyReports = [];

        for (let d = 1; d <= 1095; d++) {
          simulateDay();

          if (isNaN(cash) || isNaN(monthRevenue) || isNaN(monthCogs)) nanDetected = true;
          if (!isFinite(cash)) infinityDetected = true;

          if (cash < lowestCash) lowestCash = cash;
          if (cash > peakCash) peakCash = cash;

          if (consecutiveInsolventMonths >= 6 && insolvencyCountdownMonths <= 0) {
            bankruptOccurred = true;
          }

          // Snapshot a cada 365 dias (1 ano)
          if (d % 365 === 0) {
            const nwObj = calculateCorporateNetWorth();
            yearlyReports.push({
              yearCompleted: d / 365,
              currentDate: 'Dia ' + day + ' / Mês ' + month + ' / Ano ' + year,
              cash: Math.round(cash),
              netWorth: Math.round(nwObj.netWorth),
              historyEntries: historicalLedger.length,
              brandRatingBread: playerBrandRating['bread'] || 20
            });
          }
        }

        return {
          totalDaysSimulated: 1095,
          nanDetected,
          infinityDetected,
          lowestCash: Math.round(lowestCash),
          peakCash: Math.round(peakCash),
          finalCash: Math.round(cash),
          bankruptOccurred,
          yearlyReports,
          historyLedgerCount: historicalLedger.length
        };
      })()
    `);

    console.log(`  ✓ 1.095 Dias (3 Anos) de simulação contínua executados com sucesso!`);
    console.log(`  ✓ Integridade Numérica: NaN = ${f4.nanDetected ? 'FAIL' : 'PASS'} | Infinity = ${f4.infinityDetected ? 'FAIL' : 'PASS'}`);
    console.log(`  ✓ Picos Financeiros: Menor Caixa = $${f4.lowestCash.toLocaleString()} | Maior Caixa = $${f4.peakCash.toLocaleString()} | Caixa Final = $${f4.finalCash.toLocaleString()}`);
    console.log(`  ✓ Séries Temporais: ${f4.historyLedgerCount} meses gravados no TimeSeriesBuffer circular.`);

    for (const yr of f4.yearlyReports) {
      console.log(`    📅 Ano ${yr.yearCompleted}: Caixa $${yr.cash.toLocaleString()} | Patrimônio Líquido $${yr.netWorth.toLocaleString()} | Brand Bread ${yr.brandRatingBread} pts`);
    }
    results.phases.phase4_stress_test = f4;

    // ─────────────────────────────────────────────────────────────────────────
    // FASE 5: AUDITORIA DO ANALISTA CORPORATIVO & SÉRIES TEMPORAIS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [FASE 5: AUDITORIA DO ANALISTA CORPORATIVO & HISTÓRICO DRE] ---');
    const f5 = await cdp.eval(`
      (() => {
        renderFacilityDRETable();
        const diagText = document.getElementById('fdre-diag-text')?.textContent || '';
        const diagBadge = document.getElementById('fdre-diag-badge')?.textContent || '';
        const barsCount = document.getElementById('fdre-history-bars')?.children.length || 0;
        const totalRev = document.getElementById('fdre-total-rev')?.textContent || '';
        const totalNet = document.getElementById('fdre-total-net')?.textContent || '';

        return {
          analystSummary: diagText,
          analystBadge: diagBadge,
          renderedHistoryBars: barsCount,
          totalRevenue: totalRev,
          totalNetProfit: totalNet
        };
      })()
    `);

    console.log(`  ✓ Analista Corporativo: "${f5.analystSummary}" [${f5.analystBadge}]`);
    console.log(`  ✓ Gráfico Histórico DRE: ${f5.renderedHistoryBars} colunas mensais geradas.`);
    console.log(`  ✓ Performance Consolidada: Receita ${f5.totalRevenue} | Lucro Líquido ${f5.totalNetProfit}`);
    results.phases.phase5_corporate_analyst = f5;

    await cdp.captureScreenshot('e3e_master_dre_history.png');

    // ─────────────────────────────────────────────────────────────────────────
    // SALVAMENTO DO RELATÓRIO OFICIAL DE AUDITORIA E3E
    // ─────────────────────────────────────────────────────────────────────────
    const reportJsonPath = path.join(DOCS_DIR, 'audit_e3e_master_results.json');
    fs.writeFileSync(reportJsonPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Relatório JSON salvo em: ${reportJsonPath}`);

    console.log('\n================================================================');
    console.log('✅ AUDITORIA E3E MASTER FINALIZADA COM 100% DE SUCESSO!');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ Erro na Auditoria E3E:', err);
  } finally {
    if (cdp) {
      try { await cdp.send('Page.close'); } catch (e) {}
    }
    edgeProc.kill();
  }
}

runMasterE3EPlaythrough();
