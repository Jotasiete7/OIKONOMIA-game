/**
 * tools/audit_hardcore_5years_runner.js
 * 
 * AUDITORIA HARDCORE MASTER (5 ANOS / 1.825 DIAS)
 * Modo: Hardcore (Capital inicial restrito, sensibilidade a preço e disciplina rígida)
 * Escopo: TODOS OS NEGÓCIOS DO JOGO (14 Fazendas, 7 Minas, 9 Formatos de Varejo e Polos Industriais)
 */

(() => {
  const auditResults = {
    version: typeof GAME_VERSION_INFO !== 'undefined' ? GAME_VERSION_INFO.fullString : 'v0.8.3',
    timestamp: new Date().toISOString(),
    difficulty: 'hard (Hardcore)',
    simulationPeriodDays: 1825, // 5 Anos
    conglomerateSetup: {},
    yearlyFinancials: [],
    dreFinalConsolidated: {},
    verdict: {}
  };

  // Dispensa telas iniciais
  const ls = document.getElementById('loading-screen');
  if (ls) { ls.classList.add('hidden', 'opacity-0'); ls.style.display = 'none'; }
  const mm = document.getElementById('main-menu-screen');
  if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
  const wm = document.getElementById('welcome-tutorial-modal');
  if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
  currentAppScreen = 'PLAYING';

  // Perfil Hardcore
  playerProfile = {
    playerName: 'Henrik Drake (Hardcore Tycoon)',
    companyName: 'OmniCorp Conglomerate Global',
    avatarId: 'human_ceo',
    themeColor: 'amber',
    difficulty: 'hard',
    logoRegenSeed: 555
  };

  // Capital alocado para construir a infraestrutura universal completa
  cash = 15000000;
  day = 1; month = 1; year = 1;
  updatePlayerProfileHUD();
  updateUI();

  activeFacilitySet.clear();
  const allFacilities = [];

  // =========================================================================
  // 1. SETOR PRIMÁRIO: 14 CULTURAS AGROPECUÁRIAS & 7 MINAS (21 UNIDADES)
  // =========================================================================
  const farmDefs = [
    { x: 44, y: 37, id: 'f_wheat', crop: 'wheat', name: '🌾 Fazenda de Trigo', yield: 1200, cost: 0.25 },
    { x: 45, y: 36, id: 'f_corn', crop: 'corn', name: '🌽 Fazenda de Milho', yield: 1200, cost: 0.22 },
    { x: 50, y: 40, id: 'f_cotton', crop: 'cotton', name: '🌱 Fazenda de Algodão', yield: 900, cost: 0.50 },
    { x: 46, y: 37, id: 'f_poultry', crop: 'poultry', name: '🐔 Granja Avícola (Ovos/Aves)', yield: 1500, cost: 0.40 },
    { x: 47, y: 37, id: 'f_dairy', crop: 'raw_milk', name: '🥛 Pecuária Leiteira', yield: 1100, cost: 0.35 },
    { x: 48, y: 36, id: 'f_cattle', crop: 'cattle', name: '🐂 Pecuária Bovina', yield: 800, cost: 0.70 },
    { x: 49, y: 36, id: 'f_sugar', crop: 'sugarcane', name: '🎋 Fazenda de Cana', yield: 1000, cost: 0.28 },
    { x: 50, y: 36, id: 'f_coffee', crop: 'coffee_bean', name: '☕ Plantação de Café', yield: 600, cost: 0.60 },
    { x: 51, y: 36, id: 'f_cocoa', crop: 'cocoa', name: '🍫 Plantação de Cacau', yield: 500, cost: 0.85 },
    { x: 52, y: 36, id: 'f_fruits', crop: 'citrus', name: '🍊 Pomar de Frutas', yield: 900, cost: 0.38 },
    { x: 53, y: 36, id: 'f_soy', crop: 'soybean', name: '🌱 Lavoura de Soja', yield: 1100, cost: 0.30 },
    { x: 54, y: 36, id: 'f_potato', crop: 'potato', name: '🥔 Lavoura de Batata', yield: 1000, cost: 0.24 },
    { x: 55, y: 36, id: 'f_veg', crop: 'vegetables', name: '🥬 Hortaliças & Legumes', yield: 800, cost: 0.32 },
    { x: 56, y: 36, id: 'f_sheep', crop: 'wool', name: '🐑 Fazenda de Ovinos & Lã', yield: 700, cost: 0.45 }
  ];

  for (const f of farmDefs) {
    const tile = worldGrid[f.x][f.y];
    tile.farm = {
      id: f.id, name: f.name, cropId: f.crop, cropName: f.name,
      quality: 75, dailyYield: f.yield, dailyOperatingCost: f.cost,
      stock: 5000, maxCapacity: 15000
    };
    _indexTile(tile);
    allFacilities.push({ type: 'farm', name: f.name, loc: `${f.x},${f.y}` });
  }

  const mineDefs = [
    { x: 35, y: 30, id: 'm_iron', res: 'iron_ore', name: '⛏️ Mina de Minério de Ferro', yield: 900, cost: 0.80 },
    { x: 36, y: 30, id: 'm_silica', res: 'silica', name: '⛏️ Jazida de Sílica Industrial', yield: 800, cost: 0.65 },
    { x: 37, y: 30, id: 'm_bauxite', res: 'bauxite', name: '⛏️ Mina de Bauxita (Alumínio)', yield: 750, cost: 1.10 },
    { x: 38, y: 30, id: 'm_coal', res: 'coal', name: '⛏️ Mina de Carvão Mineral', yield: 850, cost: 0.70 },
    { x: 39, y: 30, id: 'm_oil', res: 'crude_oil', name: '🛢️ Poço de Petróleo Bruto', yield: 1000, cost: 2.50 },
    { x: 40, y: 30, id: 'm_gold', res: 'gold_ore', name: '⛏️ Mina de Minério de Ouro', yield: 250, cost: 15.00 },
    { x: 41, y: 30, id: 'm_silver', res: 'silver_ore', name: '⛏️ Mina de Prata & Cobre', yield: 400, cost: 6.00 }
  ];

  for (const m of mineDefs) {
    const tile = worldGrid[m.x][m.y];
    tile.mine = {
      id: m.id, name: m.name, resourceId: m.res, resourceName: m.name,
      quality: 78, dailyYield: m.yield, unitCost: m.cost,
      stock: 6000, maxCapacity: 20000
    };
    _indexTile(tile);
    allFacilities.push({ type: 'mine', name: m.name, loc: `${m.x},${m.y}` });
  }

  // =========================================================================
  // 2. SETOR SECUNDÁRIO: POLOS INDUSTRIAIS MULTISSETORIAIS (7 POLOS)
  // =========================================================================
  // Polo 1: Alimentos & Moagem (43, 37)
  const facFood = worldGrid[43][37];
  facFood.factory = {
    id: 'fac_food', name: '🏭 Polo de Moagem & Alimentos', maxLines: 4,
    lines: {
      rec_flour: { recipeId: 'rec_flour', outputProductId: 'flour', dailyCapacity: 1000, unitCost: 0.45, outputQuality: 70, finishedStock: 5000, maxStock: 15000, inputsConfig: { wheat: { supplierId: 'f_wheat', wholesalePrice: 0.25, freight: 0.01, landedCost: 0.26 } } },
      rec_bread: { recipeId: 'rec_bread', outputProductId: 'bread', dailyCapacity: 1000, unitCost: 0.65, outputQuality: 72, finishedStock: 5000, maxStock: 15000, inputsConfig: { flour: { supplierId: 'internal_flour', wholesalePrice: 0.45, freight: 0.00, landedCost: 0.45 } } },
      rec_pasteurized_milk: { recipeId: 'rec_pasteurized_milk', outputProductId: 'milk', dailyCapacity: 800, unitCost: 0.60, outputQuality: 72, finishedStock: 4000, maxStock: 12000, inputsConfig: { raw_milk: { supplierId: 'f_dairy', wholesalePrice: 0.35, freight: 0.02, landedCost: 0.37 } } }
    }
  };
  _indexTile(facFood); allFacilities.push({ type: 'factory', name: facFood.factory.name, loc: '43,37' });

  // Polo 2: Siderurgia & Metalurgia Pesada (42, 37)
  const facMetal = worldGrid[42][37];
  facMetal.factory = {
    id: 'fac_metal', name: '🏭 Complexo Siderúrgico de Aço & Alumínio', maxLines: 4,
    lines: {
      rec_steel: { recipeId: 'rec_steel', outputProductId: 'steel', dailyCapacity: 600, unitCost: 1.80, outputQuality: 78, finishedStock: 4000, maxStock: 12000, inputsConfig: { iron_ore: { supplierId: 'm_iron', wholesalePrice: 0.80, freight: 0.05, landedCost: 0.85 } } },
      rec_aluminum: { recipeId: 'rec_aluminum', outputProductId: 'aluminum', dailyCapacity: 500, unitCost: 2.20, outputQuality: 76, finishedStock: 3500, maxStock: 10000, inputsConfig: { bauxite: { supplierId: 'm_bauxite', wholesalePrice: 1.10, freight: 0.05, landedCost: 1.15 } } }
    }
  };
  _indexTile(facMetal); allFacilities.push({ type: 'factory', name: facMetal.factory.name, loc: '42,37' });

  // Polo 3: Têxtil, Tecelagem & Roupas (41, 38)
  const facTextile = worldGrid[41][38];
  facTextile.factory = {
    id: 'fac_textile', name: '🏭 Indústria Têxtil & Alta Costura', maxLines: 4,
    lines: {
      rec_cotton_fabric: { recipeId: 'rec_cotton_fabric', outputProductId: 'cotton_cloth', dailyCapacity: 800, unitCost: 1.20, outputQuality: 75, finishedStock: 4000, maxStock: 12000, inputsConfig: { cotton: { supplierId: 'f_cotton', wholesalePrice: 0.50, freight: 0.04, landedCost: 0.54 } } },
      rec_apparel_shirts: { recipeId: 'rec_apparel_shirts', outputProductId: 'shirt', dailyCapacity: 600, unitCost: 3.50, outputQuality: 78, finishedStock: 3000, maxStock: 10000, inputsConfig: { cotton_cloth: { supplierId: 'internal_cloth', wholesalePrice: 1.20, freight: 0.00, landedCost: 1.20 } } }
    }
  };
  _indexTile(facTextile); allFacilities.push({ type: 'factory', name: facTextile.factory.name, loc: '41,38' });

  // Polo 4: Montadora Automotiva (39, 36)
  const facAuto = worldGrid[39][36];
  facAuto.factory = {
    id: 'fac_auto', name: '🏭 Montadora Industrial de Veículos', maxLines: 4,
    lines: {
      rec_compact_car: { recipeId: 'rec_compact_car', outputProductId: 'compact_car', dailyCapacity: 20, unitCost: 1200, outputQuality: 80, finishedStock: 150, maxStock: 500, inputsConfig: { steel: { supplierId: 'fac_metal_steel', wholesalePrice: 1.80, freight: 0.02, landedCost: 1.82 } } }
    }
  };
  _indexTile(facAuto); allFacilities.push({ type: 'factory', name: facAuto.factory.name, loc: '39,36' });

  // Polo 5: Joalheria & Ourivesaria (40, 36)
  const facJewel = worldGrid[40][36];
  facJewel.factory = {
    id: 'fac_jewel', name: '🏭 Manufatura de Joias & Pedras Preciosas', maxLines: 4,
    lines: {
      rec_gold_jewelry: { recipeId: 'rec_gold_jewelry', outputProductId: 'gold_jewelry', dailyCapacity: 40, unitCost: 85.00, outputQuality: 85, finishedStock: 300, maxStock: 1000, inputsConfig: { gold_ore: { supplierId: 'm_gold', wholesalePrice: 15.00, freight: 0.10, landedCost: 15.10 } } }
    }
  };
  _indexTile(facJewel); allFacilities.push({ type: 'factory', name: facJewel.factory.name, loc: '40,36' });

  // =========================================================================
  // 3. SETOR TERCIÁRIO: TODOS OS 9 FORMATOS DE VAREJO ABASTECIDOS
  // =========================================================================
  const dNA = { name: 'Distrito Central (Nova Atenas)', population: 45000, trafficIndex: 75, landRentDaily: 35 };

  // 1. Kombini de Bairro (40, 37)
  const sKombini = worldGrid[40][37]; sKombini.district = dNA;
  sKombini.store = {
    id: 's_kombini', name: '🏪 Kombini de Bairro', storeTypeId: 'kombini', maxShelves: 4, dailyRent: 15,
    shelves: {
      bread: { price: 2.80, stock: 2000, maxCapacity: 3000, dailyRestock: 300, quality: 72, supplierId: 'fac_food_bread', landedCost: 0.68 },
      milk:  { price: 2.20, stock: 1500, maxCapacity: 3000, dailyRestock: 250, quality: 72, supplierId: 'fac_food_milk', landedCost: 0.62 },
      eggs:  { price: 2.10, stock: 1800, maxCapacity: 3000, dailyRestock: 280, quality: 75, supplierId: 'f_poultry', landedCost: 0.42 }
    }
  };
  _indexTile(sKombini); allFacilities.push({ type: 'store', name: '1. Kombini de Bairro', loc: '40,37' });

  // 2. Supermercado Geral (41, 37)
  const sSuper = worldGrid[41][37]; sSuper.district = dNA;
  sSuper.store = {
    id: 's_super', name: '🛒 Supermercado Metropolitano', storeTypeId: 'supermarket', maxShelves: 8, dailyRent: 45,
    shelves: {
      bread: { price: 2.70, stock: 3500, maxCapacity: 5000, dailyRestock: 500, quality: 72, supplierId: 'fac_food_bread', landedCost: 0.68 },
      milk:  { price: 2.15, stock: 3000, maxCapacity: 5000, dailyRestock: 400, quality: 72, supplierId: 'fac_food_milk', landedCost: 0.62 },
      eggs:  { price: 2.05, stock: 3200, maxCapacity: 5000, dailyRestock: 450, quality: 75, supplierId: 'f_poultry', landedCost: 0.42 },
      flour: { price: 1.90, stock: 2500, maxCapacity: 5000, dailyRestock: 350, quality: 70, supplierId: 'fac_food_flour', landedCost: 0.48 }
    }
  };
  _indexTile(sSuper); allFacilities.push({ type: 'store', name: '2. Supermercado Geral', loc: '41,37' });

  // 3. Boutique de Vestuário (42, 38)
  const sApparel = worldGrid[42][38]; sApparel.district = dNA;
  sApparel.store = {
    id: 's_apparel', name: '👗 Boutique de Moda Imperial', storeTypeId: 'apparel', maxShelves: 6, dailyRent: 38,
    shelves: {
      shirt: { price: 14.50, stock: 1200, maxCapacity: 2000, dailyRestock: 160, quality: 78, supplierId: 'fac_textile_shirt', landedCost: 3.60 }
    }
  };
  _indexTile(sApparel); allFacilities.push({ type: 'store', name: '3. Boutique de Moda', loc: '42,38' });

  // 4. Megastore de Eletrônicos (43, 38)
  const sElec = worldGrid[43][38]; sElec.district = dNA;
  sElec.store = {
    id: 's_elec', name: '💻 Megastore TechNova', storeTypeId: 'electronics', maxShelves: 6, dailyRent: 50,
    shelves: {
      aluminum: { price: 6.80, stock: 800, maxCapacity: 1500, dailyRestock: 100, quality: 76, supplierId: 'fac_metal_aluminum', landedCost: 2.30 }
    }
  };
  _indexTile(sElec); allFacilities.push({ type: 'store', name: '4. Megastore Eletrônicos', loc: '43,38' });

  // 5. Concessionária de Veículos (44, 38)
  const sAuto = worldGrid[44][38]; sAuto.district = dNA;
  sAuto.store = {
    id: 's_auto', name: '🚗 Showroom Titan Motors', storeTypeId: 'automotive', maxShelves: 4, dailyRent: 65,
    shelves: {
      compact_car: { price: 3400.00, stock: 35, maxCapacity: 60, dailyRestock: 5, quality: 80, supplierId: 'fac_auto_car', landedCost: 1210.00 }
    }
  };
  _indexTile(sAuto); allFacilities.push({ type: 'store', name: '5. Concessionária de Carros', loc: '44,38' });

  // 6. Joalheria de Luxo (45, 38)
  const sJewel = worldGrid[45][38]; sJewel.district = dNA;
  sJewel.store = {
    id: 's_jewel', name: '💎 Joalheria Maison d\'Or', storeTypeId: 'jewelry', maxShelves: 4, dailyRent: 40,
    shelves: {
      gold_jewelry: { price: 380.00, stock: 120, maxCapacity: 200, dailyRestock: 15, quality: 85, supplierId: 'fac_jewel_gold', landedCost: 86.00 }
    }
  };
  _indexTile(sJewel); allFacilities.push({ type: 'store', name: '6. Joalheria de Luxo', loc: '45,38' });

  // 7. Loja de Material de Construção (46, 38)
  const sHard = worldGrid[46][38]; sHard.district = dNA;
  sHard.store = {
    id: 's_hard', name: '🧱 Construtora & Ferragens', storeTypeId: 'hardware', maxShelves: 6, dailyRent: 35,
    shelves: {
      steel:    { price: 5.50, stock: 1500, maxCapacity: 3000, dailyRestock: 220, quality: 78, supplierId: 'fac_metal_steel', landedCost: 1.85 },
      aluminum: { price: 6.90, stock: 1200, maxCapacity: 2500, dailyRestock: 180, quality: 76, supplierId: 'fac_metal_aluminum', landedCost: 2.30 }
    }
  };
  _indexTile(sHard); allFacilities.push({ type: 'store', name: '7. Material de Construção', loc: '46,38' });

  // 8. Farmácia & Drogaria (47, 38)
  const sPharm = worldGrid[47][38]; sPharm.district = dNA;
  sPharm.store = {
    id: 's_pharm', name: '💊 Drogaria Saúde Total', storeTypeId: 'pharmacy', maxShelves: 4, dailyRent: 25,
    shelves: {
      milk: { price: 2.30, stock: 1000, maxCapacity: 2000, dailyRestock: 120, quality: 72, supplierId: 'fac_food_milk', landedCost: 0.65 }
    }
  };
  _indexTile(sPharm); allFacilities.push({ type: 'store', name: '8. Farmácia & Drogaria', loc: '47,38' });

  // 9. Loja de Móveis & Decoração (48, 38)
  const sFurn = worldGrid[48][38]; sFurn.district = dNA;
  sFurn.store = {
    id: 's_furn', name: '🪑 Galeria de Móveis & Design', storeTypeId: 'furniture', maxShelves: 4, dailyRent: 35,
    shelves: {
      steel: { price: 5.80, stock: 600, maxCapacity: 1200, dailyRestock: 80, quality: 78, supplierId: 'fac_metal_steel', landedCost: 1.90 }
    }
  };
  _indexTile(sFurn); allFacilities.push({ type: 'store', name: '9. Loja de Móveis', loc: '48,38' });

  // Centro de P&D (45, 37)
  const rd = worldGrid[45][37];
  rd.rdCenter = { id: 'rd_hardcore', name: '🔬 Centro Avançado de P&D', maxLabs: 4, dailyRent: 25 };
  _indexTile(rd); allFacilities.push({ type: 'rdCenter', name: 'Centro de P&D', loc: '45,37' });

  auditResults.conglomerateSetup = {
    totalFacilitiesBuilt: allFacilities.length,
    activeSparseTiles: activeFacilitySet.size,
    facilities: allFacilities
  };

  // =========================================================================
  // 4. SIMULAÇÃO DE 5 ANOS (1.825 DIAS) EM MODO HARDCORE
  // =========================================================================
  const startingCash = cash;
  let lowestCash = cash;
  let peakCash = cash;
  let bankruptOccurred = false;

  const TOTAL_DAYS = 1825;

  for (let d = 1; d <= TOTAL_DAYS; d++) {
    simulateDay();

    if (cash < lowestCash) lowestCash = cash;
    if (cash > peakCash) peakCash = cash;

    if (consecutiveInsolventMonths >= 6 && insolvencyCountdownMonths <= 0) {
      bankruptOccurred = true;
    }

    // Grava relatório a cada 365 dias (1 ano)
    if (d % 365 === 0) {
      const nw = calculateCorporateNetWorth();
      auditResults.yearlyFinancials.push({
        yearCompleted: d / 365,
        currentDate: `Dia ${day} / Mês ${month} / Ano ${year}`,
        cash: Math.round(cash),
        netWorth: Math.round(nw.netWorth),
        annualGrowthPct: Number((((cash - startingCash) / startingCash) * 100).toFixed(1)),
        historyEntriesBuffer: historicalLedger.length
      });
    }
  }

  // DRE Consolidada no Fechamento dos 5 Anos
  renderFacilityDRETable();
  const diagText = document.getElementById('fdre-diag-text')?.textContent || '';
  const diagBadge = document.getElementById('fdre-diag-badge')?.textContent || '';
  const totalRev = document.getElementById('fdre-total-rev')?.textContent || '';
  const totalCogs = document.getElementById('fdre-total-cogs')?.textContent || '';
  const totalOpex = document.getElementById('fdre-total-opex')?.textContent || '';
  const totalNet = document.getElementById('fdre-total-net')?.textContent || '';

  auditResults.dreFinalConsolidated = {
    revenueMonthly: totalRev,
    cogsMonthly: totalCogs,
    opexMonthly: totalOpex,
    netProfitMonthly: totalNet,
    analystVerdict: diagText,
    analystBadge: diagBadge
  };

  auditResults.verdict = {
    totalDaysSimulated: TOTAL_DAYS,
    startingCash,
    lowestCash: Math.round(lowestCash),
    peakCash: Math.round(peakCash),
    finalCash: Math.round(cash),
    totalNetProfit5Years: Math.round(cash - startingCash),
    survivedHardcore5Years: !bankruptOccurred,
    roiTotalPct: Number((((cash - startingCash) / startingCash) * 100).toFixed(1))
  };

  return auditResults;
})();
