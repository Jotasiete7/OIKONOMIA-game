/**
 * tools/audit_e3e_runner.js
 * 
 * SCRIPT EXECUTADO DENTRO DO BROWSER REAL (EDGE HEADLESS)
 * Executa uma simulação E3E completa de 3 anos de jogo com todas as cadeias e sistemas.
 */

(() => {
  const auditResults = {
    version: typeof GAME_VERSION_INFO !== 'undefined' ? GAME_VERSION_INFO.fullString : 'v0.8.3',
    timestamp: new Date().toISOString(),
    phases: {}
  };

  // Desativa telas iniciais
  const ls = document.getElementById('loading-screen');
  if (ls) { ls.classList.add('hidden', 'opacity-0'); ls.style.display = 'none'; }
  const mm = document.getElementById('main-menu-screen');
  if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
  const wm = document.getElementById('welcome-tutorial-modal');
  if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
  currentAppScreen = 'PLAYING';
  updateUI();

  // =========================================================================
  // FASE 1: DIFICULDADES & WIZARDS DE INICIALIZAÇÃO
  // =========================================================================
  const diffPresets = DIFFICULTY_PRESETS.map(d => ({
    id: d.id,
    name: d.name,
    startingCash: d.startingCash,
    marginMultiplier: d.marginMultiplier,
    rdCostMultiplier: d.rdCostMultiplier,
    loanInterestRate: d.loanInterestRate
  }));

  playerProfile = {
    playerName: 'Henrik Vance',
    companyName: 'Apex Industrial Holding',
    avatarId: 'human_elder',
    themeColor: 'amber',
    difficulty: 'standard',
    logoRegenSeed: 99
  };
  cash = 3500000;
  day = 1; month = 1; year = 1;
  updatePlayerProfileHUD();
  updateUI();

  auditResults.phases.phase1_difficulties = {
    totalPresets: diffPresets.length,
    presets: diffPresets,
    configuredCompany: playerProfile.companyName,
    startingCash: cash
  };

  // =========================================================================
  // FASE 2: CONSTRUÇÃO DAS CADEIAS DE SUPRIMENTOS (TIER 0 A TIER 3)
  // =========================================================================
  const builtFacilities = [];

  // 1. Fazenda de Trigo & Cereais (44, 37)
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
  builtFacilities.push({ type: 'farm', name: farmWheat.farm.name, loc: '44,37' });

  // 2. Granja Avícola com Suplementação de Ração (46, 37)
  const farmPoultry = worldGrid[46][37];
  farmPoultry.farm = {
    id: 'farm_poultry_1',
    name: '🐔 Granja Avícola Santa Fé',
    farmTypeId: 'farm_poultry',
    cropId: 'poultry',
    cropName: 'Ovos & Aves',
    quality: 70,
    dailyYield: 750,
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
  builtFacilities.push({ type: 'farm', name: farmPoultry.farm.name, loc: '46,37' });

  // 3. Pecuária Leiteira (47, 37)
  const farmDairy = worldGrid[47][37];
  farmDairy.farm = {
    id: 'farm_dairy_1',
    name: '🥛 Pecuária Leiteira Bela Vista',
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
  builtFacilities.push({ type: 'farm', name: farmDairy.farm.name, loc: '47,37' });

  // 4. Minas de Extração Pesada: Ferro (35,30) e Sílica (36,30)
  const mineIron = worldGrid[35][30];
  mineIron.mine = {
    id: 'mine_iron_1',
    name: '⛏️ Mina de Ferro Monte Alto',
    resourceId: 'iron_ore',
    resourceName: 'Minério de Ferro',
    quality: 72,
    dailyYield: 500,
    unitCost: 0.80,
    stock: 4000,
    maxCapacity: 8000
  };
  _indexTile(mineIron);
  builtFacilities.push({ type: 'mine', name: mineIron.mine.name, loc: '35,30' });

  const mineSilica = worldGrid[36][30];
  mineSilica.mine = {
    id: 'mine_silica_1',
    name: '⛏️ Jazida de Sílica Industrial',
    resourceId: 'silica',
    resourceName: 'Sílica & Quartzo',
    quality: 70,
    dailyYield: 450,
    unitCost: 0.65,
    stock: 3500,
    maxCapacity: 8000
  };
  _indexTile(mineSilica);
  builtFacilities.push({ type: 'mine', name: mineSilica.mine.name, loc: '36,30' });

  // 5. Complexo Industrial Central (43, 37) com 4 Linhas Integradas
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
        finishedStock: 2000,
        maxStock: 5000,
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
        finishedStock: 2500,
        maxStock: 5000,
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
        finishedStock: 2000,
        maxStock: 5000,
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
        finishedStock: 1500,
        maxStock: 4000,
        inputsConfig: {
          iron_ore: { supplierId: 'mine_35_30', supplierName: 'Mina Ferro', wholesalePrice: 0.80, freight: 0.08, landedCost: 0.88, quality: 72 }
        }
      }
    }
  };
  _indexTile(facCentral);
  builtFacilities.push({ type: 'factory', name: facCentral.factory.name, loc: '43,37' });

  // 6. Rede de Varejo Multicidades (Nova Atenas 40,37 e Porto Real 92,37)
  const storeNA = worldGrid[40][37];
  storeNA.district = { name: 'Distrito Residencial (Nova Atenas)', population: 15750, trafficIndex: 49, landRentDaily: 14 };
  storeNA.store = {
    id: 'store_na_1',
    name: '🏪 Kombini de Bairro (Nova Atenas)',
    storeTypeId: 'kombini',
    maxShelves: 4,
    dailyRent: 14,
    shelves: {
      bread: { price: 2.80, stock: 1000, maxCapacity: 1000, dailyRestock: 160, quality: 68, supplierId: 'factory_43_37_rec_bread', supplierName: 'Fábrica Central', landedCost: 0.68 },
      milk:  { price: 2.20, stock: 1000, maxCapacity: 1000, dailyRestock: 130, quality: 70, supplierId: 'factory_43_37_rec_pasteurized_milk', supplierName: 'Fábrica Central', landedCost: 0.62 },
      eggs:  { price: 2.10, stock: 1000, maxCapacity: 1000, dailyRestock: 150, quality: 70, supplierId: 'farm_46_37', supplierName: 'Granja Avícola', landedCost: 0.42 }
    }
  };
  _indexTile(storeNA);
  builtFacilities.push({ type: 'store', name: storeNA.store.name, loc: '40,37' });

  const storePR = worldGrid[92][37];
  storePR.district = { name: 'Distrito Comercial (Porto Real)', population: 9800, trafficIndex: 42, landRentDaily: 12 };
  storePR.store = {
    id: 'store_pr_1',
    name: '🏪 Kombini de Bairro (Porto Real)',
    storeTypeId: 'kombini',
    maxShelves: 4,
    dailyRent: 12,
    shelves: {
      bread: { price: 2.90, stock: 800, maxCapacity: 1000, dailyRestock: 95, quality: 68, supplierId: 'factory_43_37_rec_bread', supplierName: 'Fábrica Central', landedCost: 1.15 },
      eggs:  { price: 2.20, stock: 800, maxCapacity: 1000, dailyRestock: 85, quality: 70, supplierId: 'farm_46_37', supplierName: 'Granja Avícola', landedCost: 0.95 }
    }
  };
  _indexTile(storePR);
  builtFacilities.push({ type: 'store', name: storePR.store.name, loc: '92,37' });

  // 7. Centro de P&D (45, 37)
  const rdTile = worldGrid[45][37];
  rdTile.rdCenter = {
    id: 'rd_center_1',
    name: '🔬 Centro de P&D Metropolitano',
    maxLabs: 4,
    dailyRent: 20
  };
  _indexTile(rdTile);
  builtFacilities.push({ type: 'rdCenter', name: rdTile.rdCenter.name, loc: '45,37' });

  auditResults.phases.phase2_supply_chain = {
    totalFacilities: builtFacilities.length,
    sparseIndexCount: activeFacilitySet.size,
    facilities: builtFacilities
  };

  // =========================================================================
  // FASE 3: AUDITORIA DE UI, BOTÕES, MENUS, SIMULADORES E CALCULADORAS
  // =========================================================================
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
  
  document.getElementById('sim-price-slider').value = 3.20;
  updatePriceSimulatorLive();
  const salesText = document.getElementById('sim-sales-display').textContent;
  const marginText = document.getElementById('sim-margin-display').textContent;
  const profitText = document.getElementById('sim-profit-display').textContent;
  applyPriceSimulatorResult();
  const newPriceApplied = tileStore.store.shelves['bread'].price === 3.20;
  uiChecks.push({ element: 'PriceSimulator', simOpen, salesText, marginText, profitText, newPriceApplied });

  // 3. Botão "Encher" (Drenagem de Silo Interno a Custo $0)
  tileStore.store.shelves['bread'].stock = 500;
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

  // 5. DRE Interativa
  renderFacilityDRETable();
  const dreRev = document.getElementById('fdre-total-rev').textContent;
  const dreNet = document.getElementById('fdre-total-net').textContent;
  uiChecks.push({ element: 'DRE_Table', dreRev, dreNet });

  auditResults.phases.phase3_ui_verification = { uiChecks };

  // =========================================================================
  // FASE 4: STRESS TEST MULTI-ANUAL (1.095 DIAS / 3 ANOS) & ANTI-SINKING
  // =========================================================================
  let nanDetected = false;
  let infinityDetected = false;
  let lowestCash = cash;
  let peakCash = cash;
  let bankruptOccurred = false;

  const yearlyReports = [];
  const TOTAL_DAYS = 1095;

  for (let d = 1; d <= TOTAL_DAYS; d++) {
    simulateDay();

    if (isNaN(cash) || isNaN(monthRevenue) || isNaN(monthCogs)) nanDetected = true;
    if (!isFinite(cash)) infinityDetected = true;

    if (cash < lowestCash) lowestCash = cash;
    if (cash > peakCash) peakCash = cash;

    if (consecutiveInsolventMonths >= 6 && insolvencyCountdownMonths <= 0) {
      bankruptOccurred = true;
    }

    if (d % 365 === 0) {
      const nwObj = calculateCorporateNetWorth();
      yearlyReports.push({
        yearCompleted: d / 365,
        currentDate: `Dia ${day} / Mês ${month} / Ano ${year}`,
        cash: Math.round(cash),
        netWorth: Math.round(nwObj.netWorth),
        historyEntries: historicalLedger.length,
        brandRatingBread: playerBrandRating['bread'] || 20
      });
    }
  }

  auditResults.phases.phase4_stress_test = {
    totalDaysSimulated: TOTAL_DAYS,
    nanDetected,
    infinityDetected,
    lowestCash: Math.round(lowestCash),
    peakCash: Math.round(peakCash),
    finalCash: Math.round(cash),
    bankruptOccurred,
    yearlyReports,
    historyLedgerCount: historicalLedger.length
  };

  // =========================================================================
  // FASE 5: AUDITORIA DO ANALISTA CORPORATIVO & DRE HISTÓRICA
  // =========================================================================
  renderFacilityDRETable();
  const diagText = document.getElementById('fdre-diag-text')?.textContent || '';
  const diagBadge = document.getElementById('fdre-diag-badge')?.textContent || '';
  const barsCount = document.getElementById('fdre-history-bars')?.children.length || 0;
  const totalRev = document.getElementById('fdre-total-rev')?.textContent || '';
  const totalNet = document.getElementById('fdre-total-net')?.textContent || '';

  auditResults.phases.phase5_corporate_analyst = {
    analystSummary: diagText,
    analystBadge: diagBadge,
    renderedHistoryBars: barsCount,
    totalRevenue: totalRev,
    totalNetProfit: totalNet
  };

  return auditResults;
})();
