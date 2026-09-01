/**
 * tools/audit_megaconglomerate_runner.js
 * 
 * SIMULAÇÃO DE HOLDING MEGACONGLOMERADA COMPLETA (TODOS OS 9 FORMATOS DE VAREJO)
 * - Constrói e abastece Lojas de Carros, Vestuário, Eletrônicos, Supermercados, Farmácias, Móveis, Joalherias e Materiais de Construção.
 * - Integra com complexos industriais, minas, fazendas e portos.
 * - Simula 3 Anos (1.095 dias) de operação contínua e audita a DRE consolidada.
 */

(() => {
  const auditResults = {
    version: typeof GAME_VERSION_INFO !== 'undefined' ? GAME_VERSION_INFO.fullString : 'v0.8.3',
    timestamp: new Date().toISOString(),
    conglomerateSetup: {},
    simulationReport: {},
    dreConsolidated: {}
  };

  // Dispensa telas iniciais
  const ls = document.getElementById('loading-screen');
  if (ls) { ls.classList.add('hidden', 'opacity-0'); ls.style.display = 'none'; }
  const mm = document.getElementById('main-menu-screen');
  if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
  const wm = document.getElementById('welcome-tutorial-modal');
  if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
  currentAppScreen = 'PLAYING';

  playerProfile = {
    playerName: 'Henrik Vance',
    companyName: 'Titan Global Megacorp',
    avatarId: 'human_ceo',
    themeColor: 'amber',
    difficulty: 'standard',
    logoRegenSeed: 777
  };
  cash = 10000000; // $10 Milhões de Caixa para o Conglomerado
  day = 1; month = 1; year = 1;
  updatePlayerProfileHUD();
  updateUI();

  // Limpa indexação anterior
  activeFacilitySet.clear();

  const facilities = [];

  // =========================================================================
  // 1. SETOR PRIMÁRIO: FAZENDAS & MINAS
  // =========================================================================
  // Fazenda 1: Trigo & Cereais (44, 37)
  const fWheat = worldGrid[44][37];
  fWheat.farm = { id: 'farm_wheat', name: '🌾 Fazenda de Trigo', cropId: 'wheat', cropName: 'Trigo', quality: 65, dailyYield: 1000, dailyOperatingCost: 0.25, stock: 5000, maxCapacity: 10000 };
  _indexTile(fWheat); facilities.push('Fazenda Trigo');

  // Fazenda 2: Granja Avícola (46, 37)
  const fPoultry = worldGrid[46][37];
  fPoultry.farm = { id: 'farm_poultry', name: '🐔 Granja Avícola', cropId: 'poultry', cropName: 'Ovos & Aves', quality: 75, dailyYield: 1200, dailyOperatingCost: 0.40, stock: 5000, maxCapacity: 10000 };
  _indexTile(fPoultry); facilities.push('Granja Avícola');

  // Fazenda 3: Algodão Têxtil (50, 40)
  const fCotton = worldGrid[50][40];
  fCotton.farm = { id: 'farm_cotton', name: '🌱 Fazenda de Algodão', cropId: 'cotton', cropName: 'Algodão', quality: 70, dailyYield: 800, dailyOperatingCost: 0.50, stock: 4000, maxCapacity: 10000 };
  _indexTile(fCotton); facilities.push('Fazenda Algodão');

  // Fazenda 4: Pecuária Leiteira (47, 37)
  const fDairy = worldGrid[47][37];
  fDairy.farm = { id: 'farm_dairy', name: '🥛 Pecuária Leiteira', cropId: 'raw_milk', cropName: 'Leite Cru', quality: 70, dailyYield: 900, dailyOperatingCost: 0.35, stock: 4500, maxCapacity: 10000 };
  _indexTile(fDairy); facilities.push('Pecuária Leiteira');

  // Mina 1: Minério de Ferro (35, 30)
  const mIron = worldGrid[35][30];
  mIron.mine = { id: 'mine_iron', name: '⛏️ Mina de Ferro', resourceId: 'iron_ore', resourceName: 'Minério de Ferro', quality: 75, dailyYield: 800, unitCost: 0.80, stock: 6000, maxCapacity: 15000 };
  _indexTile(mIron); facilities.push('Mina Ferro');

  // Mina 2: Sílica (36, 30)
  const mSilica = worldGrid[36][30];
  mSilica.mine = { id: 'mine_silica', name: '⛏️ Jazida de Sílica', resourceId: 'silica', resourceName: 'Sílica', quality: 70, dailyYield: 700, unitCost: 0.65, stock: 5000, maxCapacity: 15000 };
  _indexTile(mSilica); facilities.push('Mina Sílica');

  // Mina 3: Bauxita / Alumínio (37, 30)
  const mBauxite = worldGrid[37][30];
  mBauxite.mine = { id: 'mine_bauxite', name: '⛏️ Mina de Bauxita', resourceId: 'bauxite', resourceName: 'Bauxita', quality: 72, dailyYield: 600, unitCost: 1.10, stock: 4000, maxCapacity: 15000 };
  _indexTile(mBauxite); facilities.push('Mina Bauxita');

  // Mina 4: Ouro Bruto (38, 30)
  const mGold = worldGrid[38][30];
  mGold.mine = { id: 'mine_gold', name: '⛏️ Mina de Ouro', resourceId: 'gold_ore', resourceName: 'Minério de Ouro', quality: 80, dailyYield: 200, unitCost: 15.00, stock: 1500, maxCapacity: 5000 };
  _indexTile(mGold); facilities.push('Mina Ouro');

  // =========================================================================
  // 2. SETOR SECUNDÁRIO: POLOS INDUSTRIAIS MULTI-LINHAS
  // =========================================================================
  // Fábrica 1: Alimentos & Moagem (43, 37)
  const facFood = worldGrid[43][37];
  facFood.factory = {
    id: 'fac_food',
    name: '🏭 Polo Agroindustrial de Alimentos',
    maxLines: 4,
    lines: {
      rec_flour: { recipeId: 'rec_flour', outputProductId: 'flour', dailyCapacity: 800, unitCost: 0.45, outputQuality: 65, finishedStock: 4000, maxStock: 10000, inputsConfig: { wheat: { supplierId: 'farm_wheat', wholesalePrice: 0.25, freight: 0.01, landedCost: 0.26 } } },
      rec_bread: { recipeId: 'rec_bread', outputProductId: 'bread', dailyCapacity: 800, unitCost: 0.65, outputQuality: 68, finishedStock: 4000, maxStock: 10000, inputsConfig: { flour: { supplierId: 'internal_flour', wholesalePrice: 0.45, freight: 0.00, landedCost: 0.45 } } },
      rec_pasteurized_milk: { recipeId: 'rec_pasteurized_milk', outputProductId: 'milk', dailyCapacity: 600, unitCost: 0.60, outputQuality: 70, finishedStock: 3000, maxStock: 8000, inputsConfig: { raw_milk: { supplierId: 'farm_dairy', wholesalePrice: 0.35, freight: 0.02, landedCost: 0.37 } } }
    }
  };
  _indexTile(facFood); facilities.push('Fábrica Alimentos');

  // Fábrica 2: Polo Metalúrgico & Siderúrgico (42, 37)
  const facMetal = worldGrid[42][37];
  facMetal.factory = {
    id: 'fac_metal',
    name: '🏭 Complexo Siderúrgico & Metalmecânico',
    maxLines: 4,
    lines: {
      rec_steel: { recipeId: 'rec_steel', outputProductId: 'steel', dailyCapacity: 500, unitCost: 1.80, outputQuality: 75, finishedStock: 3000, maxStock: 8000, inputsConfig: { iron_ore: { supplierId: 'mine_iron', wholesalePrice: 0.80, freight: 0.05, landedCost: 0.85 } } },
      rec_aluminum: { recipeId: 'rec_aluminum', outputProductId: 'aluminum', dailyCapacity: 400, unitCost: 2.20, outputQuality: 74, finishedStock: 2500, maxStock: 8000, inputsConfig: { bauxite: { supplierId: 'mine_bauxite', wholesalePrice: 1.10, freight: 0.05, landedCost: 1.15 } } }
    }
  };
  _indexTile(facMetal); facilities.push('Fábrica Siderúrgica');

  // Fábrica 3: Polo Têxtil & Moda (41, 38)
  const facTextile = worldGrid[41][38];
  facTextile.factory = {
    id: 'fac_textile',
    name: '🏭 Indústria Têxtil & Confecções',
    maxLines: 4,
    lines: {
      rec_cotton_fabric: { recipeId: 'rec_cotton_fabric', outputProductId: 'cotton_cloth', dailyCapacity: 600, unitCost: 1.20, outputQuality: 70, finishedStock: 3000, maxStock: 8000, inputsConfig: { cotton: { supplierId: 'farm_cotton', wholesalePrice: 0.50, freight: 0.04, landedCost: 0.54 } } },
      rec_apparel_shirts: { recipeId: 'rec_apparel_shirts', outputProductId: 'shirt', dailyCapacity: 500, unitCost: 3.50, outputQuality: 75, finishedStock: 2500, maxStock: 6000, inputsConfig: { cotton_cloth: { supplierId: 'internal_fabric', wholesalePrice: 1.20, freight: 0.00, landedCost: 1.20 } } }
    }
  };
  _indexTile(facTextile); facilities.push('Fábrica Têxtil');

  // Fábrica 4: Montadora Automotiva & Máquinas (39, 36)
  const facAuto = worldGrid[39][36];
  facAuto.factory = {
    id: 'fac_auto',
    name: '🏭 Linha de Montagem de Automóveis',
    maxLines: 4,
    lines: {
      rec_compact_car: { recipeId: 'rec_compact_car', outputProductId: 'compact_car', dailyCapacity: 15, unitCost: 1200, outputQuality: 78, finishedStock: 100, maxStock: 300, inputsConfig: { steel: { supplierId: 'fac_metal_steel', wholesalePrice: 1.80, freight: 0.02, landedCost: 1.82 } } }
    }
  };
  _indexTile(facAuto); facilities.push('Montadora Automotiva');

  // Fábrica 5: Joalheria Industrial & Lapidação (40, 36)
  const facJewel = worldGrid[40][36];
  facJewel.factory = {
    id: 'fac_jewel',
    name: '🏭 Manufatura de Joias & Artigos de Luxo',
    maxLines: 4,
    lines: {
      rec_gold_jewelry: { recipeId: 'rec_gold_jewelry', outputProductId: 'gold_jewelry', dailyCapacity: 30, unitCost: 85.00, outputQuality: 82, finishedStock: 200, maxStock: 500, inputsConfig: { gold_ore: { supplierId: 'mine_gold', wholesalePrice: 15.00, freight: 0.10, landedCost: 15.10 } } }
    }
  };
  _indexTile(facJewel); facilities.push('Manufatura Joias');

  // =========================================================================
  // 3. SETOR TERCIÁRIO: REDE COMPLETA COM TODOS OS 9 FORMATOS COMERCIAIS
  // =========================================================================
  const dNA = { name: 'Distrito Central (Nova Atenas)', population: 45000, trafficIndex: 75, landRentDaily: 35 };

  // Formato 1: Kombini de Bairro (40, 37)
  const sKombini = worldGrid[40][37]; sKombini.district = dNA;
  sKombini.store = {
    id: 's_kombini', name: '🏪 Kombini Central', storeTypeId: 'kombini', maxShelves: 4, dailyRent: 15,
    shelves: {
      bread: { price: 2.80, stock: 1500, maxCapacity: 2000, dailyRestock: 250, quality: 68, supplierId: 'fac_food_bread', landedCost: 0.68 },
      milk:  { price: 2.20, stock: 1200, maxCapacity: 2000, dailyRestock: 200, quality: 70, supplierId: 'fac_food_milk', landedCost: 0.62 },
      eggs:  { price: 2.10, stock: 1500, maxCapacity: 2000, dailyRestock: 240, quality: 75, supplierId: 'farm_poultry', landedCost: 0.42 }
    }
  };
  _indexTile(sKombini); facilities.push('1. Kombini');

  // Formato 2: Supermercado Geral (41, 37)
  const sSuper = worldGrid[41][37]; sSuper.district = dNA;
  sSuper.store = {
    id: 's_super', name: '🛒 Supermercado Imperial', storeTypeId: 'supermarket', maxShelves: 8, dailyRent: 45,
    shelves: {
      bread: { price: 2.70, stock: 2500, maxCapacity: 4000, dailyRestock: 450, quality: 68, supplierId: 'fac_food_bread', landedCost: 0.68 },
      milk:  { price: 2.15, stock: 2000, maxCapacity: 4000, dailyRestock: 350, quality: 70, supplierId: 'fac_food_milk', landedCost: 0.62 },
      eggs:  { price: 2.05, stock: 2200, maxCapacity: 4000, dailyRestock: 400, quality: 75, supplierId: 'farm_poultry', landedCost: 0.42 },
      flour: { price: 1.90, stock: 2000, maxCapacity: 4000, dailyRestock: 300, quality: 65, supplierId: 'fac_food_flour', landedCost: 0.48 }
    }
  };
  _indexTile(sSuper); facilities.push('2. Supermercado');

  // Formato 3: Boutique de Moda / Vestuário (42, 38)
  const sApparel = worldGrid[42][38]; sApparel.district = dNA;
  sApparel.store = {
    id: 's_apparel', name: '👗 Boutique Belle Époque', storeTypeId: 'apparel', maxShelves: 6, dailyRent: 38,
    shelves: {
      shirt: { price: 14.50, stock: 800, maxCapacity: 1500, dailyRestock: 120, quality: 75, supplierId: 'fac_textile_shirt', landedCost: 3.60 }
    }
  };
  _indexTile(sApparel); facilities.push('3. Loja de Vestuário');

  // Formato 4: Megastore de Eletrônicos & Eletrodomésticos (43, 38)
  const sElec = worldGrid[43][38]; sElec.district = dNA;
  sElec.store = {
    id: 's_elec', name: '💻 Megastore TechNova', storeTypeId: 'electronics', maxShelves: 6, dailyRent: 50,
    shelves: {
      aluminum: { price: 6.80, stock: 500, maxCapacity: 1000, dailyRestock: 80, quality: 74, supplierId: 'fac_metal_aluminum', landedCost: 2.30 }
    }
  };
  _indexTile(sElec); facilities.push('4. Megastore Eletrônicos');

  // Formato 5: Concessionária de Veículos (44, 38)
  const sAuto = worldGrid[44][38]; sAuto.district = dNA;
  sAuto.store = {
    id: 's_auto', name: '🚗 Showroom Titan Motors', storeTypeId: 'automotive', maxShelves: 4, dailyRent: 65,
    shelves: {
      compact_car: { price: 3400.00, stock: 25, maxCapacity: 50, dailyRestock: 4, quality: 78, supplierId: 'fac_auto_car', landedCost: 1210.00 }
    }
  };
  _indexTile(sAuto); facilities.push('5. Concessionária de Carros');

  // Formato 6: Joalheria & Artigos de Luxo (45, 38)
  const sJewel = worldGrid[45][38]; sJewel.district = dNA;
  sJewel.store = {
    id: 's_jewel', name: '💎 Joalheria Maison d\'Or', storeTypeId: 'jewelry', maxShelves: 4, dailyRent: 40,
    shelves: {
      gold_jewelry: { price: 380.00, stock: 80, maxCapacity: 150, dailyRestock: 12, quality: 82, supplierId: 'fac_jewel_gold', landedCost: 86.00 }
    }
  };
  _indexTile(sJewel); facilities.push('6. Joalheria de Luxo');

  // Formato 7: Loja de Material de Construção (46, 38)
  const sHard = worldGrid[46][38]; sHard.district = dNA;
  sHard.store = {
    id: 's_hard', name: '🧱 Construtora & Materiais Pesados', storeTypeId: 'hardware', maxShelves: 6, dailyRent: 35,
    shelves: {
      steel:    { price: 5.50, stock: 1200, maxCapacity: 2500, dailyRestock: 180, quality: 75, supplierId: 'fac_metal_steel', landedCost: 1.85 },
      aluminum: { price: 6.90, stock: 1000, maxCapacity: 2000, dailyRestock: 140, quality: 74, supplierId: 'fac_metal_aluminum', landedCost: 2.30 }
    }
  };
  _indexTile(sHard); facilities.push('7. Material de Construção');

  // Formato 8: Farmácia & Drogaria (47, 38)
  const sPharm = worldGrid[47][38]; sPharm.district = dNA;
  sPharm.store = {
    id: 's_pharm', name: '💊 Drogaria Saúde Total', storeTypeId: 'pharmacy', maxShelves: 4, dailyRent: 25,
    shelves: {
      milk: { price: 2.30, stock: 800, maxCapacity: 1500, dailyRestock: 100, quality: 70, supplierId: 'fac_food_milk', landedCost: 0.65 }
    }
  };
  _indexTile(sPharm); facilities.push('8. Farmácia');

  // Formato 9: Loja de Móveis & Decoração (48, 38)
  const sFurn = worldGrid[48][38]; sFurn.district = dNA;
  sFurn.store = {
    id: 's_furn', name: '🪑 Galeria de Móveis & Interiores', storeTypeId: 'furniture', maxShelves: 4, dailyRent: 35,
    shelves: {
      steel: { price: 5.80, stock: 500, maxCapacity: 1000, dailyRestock: 60, quality: 75, supplierId: 'fac_metal_steel', landedCost: 1.90 }
    }
  };
  _indexTile(sFurn); facilities.push('9. Loja de Móveis');

  // Centro de P&D (45, 37)
  const rd = worldGrid[45][37];
  rd.rdCenter = { id: 'rd_megacorp', name: '🔬 QG Científico & Inovação', maxLabs: 4, dailyRent: 25 };
  _indexTile(rd); facilities.push('Centro de P&D');

  auditResults.conglomerateSetup = {
    totalFacilitiesBuilt: facilities.length,
    activeSparseTiles: activeFacilitySet.size,
    facilitiesList: facilities
  };

  // =========================================================================
  // 4. SIMULAÇÃO DE 3 ANOS (1.095 DIAS) DO MEGACONGLOMERADO
  // =========================================================================
  const startingCash = cash;
  let lowestCash = cash;
  let peakCash = cash;
  let bankruptOccurred = false;

  const yearlyData = [];
  const TOTAL_DAYS = 1095;

  for (let d = 1; d <= TOTAL_DAYS; d++) {
    simulateDay();

    if (cash < lowestCash) lowestCash = cash;
    if (cash > peakCash) peakCash = cash;

    if (consecutiveInsolventMonths >= 6 && insolvencyCountdownMonths <= 0) {
      bankruptOccurred = true;
    }

    if (d % 365 === 0) {
      const nw = calculateCorporateNetWorth();
      yearlyData.push({
        yearCompleted: d / 365,
        currentDate: `Dia ${day} / Mês ${month} / Ano ${year}`,
        cash: Math.round(cash),
        netWorth: Math.round(nw.netWorth),
        annualGrowthRatePct: Number((((cash - startingCash) / startingCash) * 100).toFixed(1))
      });
    }
  }

  // Coleta DRE Final
  renderFacilityDRETable();
  const diagSummary = document.getElementById('fdre-diag-text')?.textContent || '';
  const diagBadge = document.getElementById('fdre-diag-badge')?.textContent || '';
  const totalRev = document.getElementById('fdre-total-rev')?.textContent || '';
  const totalCogs = document.getElementById('fdre-total-cogs')?.textContent || '';
  const totalOpex = document.getElementById('fdre-total-opex')?.textContent || '';
  const totalNet = document.getElementById('fdre-total-net')?.textContent || '';

  auditResults.simulationReport = {
    totalDays: TOTAL_DAYS,
    startingCash,
    lowestCash: Math.round(lowestCash),
    peakCash: Math.round(peakCash),
    finalCash: Math.round(cash),
    netProfitTotal3Years: Math.round(cash - startingCash),
    bankruptOccurred,
    yearlyData
  };

  auditResults.dreConsolidated = {
    revenueMonthly: totalRev,
    cogsMonthly: totalCogs,
    opexMonthly: totalOpex,
    netProfitMonthly: totalNet,
    analystVerdict: diagSummary,
    analystBadge: diagBadge
  };

  return auditResults;
})();
