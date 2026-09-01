/**
 * tools/audit_zero_to_hero_runner.js
 * 
 * SIMULAÇÃO ORGÂNICA "ZERO TO HERO" — MODO HARDCORE REAL ($20.000 INICIAIS)
 * 
 * Simula um jogador real jogando por 5 Anos (1.825 dias) a partir de $20.000:
 * - Mês 1: Começa no varejo puro (Kombini em Nova Atenas abastecida pelo Porto).
 * - Ano 1-2: Reinveste o lucro para construir a primeira Fazenda de Trigo e verticalizar insumos.
 * - Ano 2-3: Constrói Fábrica com moagem e panificação própria.
 * - Ano 3-4: Expande para Supermercado, Granja Avícola e Lojas em outras cidades.
 * - Ano 4-5: Entra em setores de alta margem (Moda, Construção, Siderurgia e Concessionária).
 */

(() => {
  const auditResults = {
    version: typeof GAME_VERSION_INFO !== 'undefined' ? GAME_VERSION_INFO.fullString : 'v0.8.3',
    timestamp: new Date().toISOString(),
    mode: 'Hardcore Autêntico (Zero to Hero)',
    startingCash: 20000,
    progressionLog: [],
    yearlyFinancials: [],
    finalResults: {}
  };

  // Dispensa telas iniciais
  const ls = document.getElementById('loading-screen');
  if (ls) { ls.classList.add('hidden', 'opacity-0'); ls.style.display = 'none'; }
  const mm = document.getElementById('main-menu-screen');
  if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
  const wm = document.getElementById('welcome-tutorial-modal');
  if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
  currentAppScreen = 'PLAYING';

  // Perfil Hardcore Autêntico
  playerProfile = {
    playerName: 'Arthur Vance (Zero to Hero)',
    companyName: 'Vance Industries',
    avatarId: 'human_ceo',
    themeColor: 'emerald',
    difficulty: 'hard',
    logoRegenSeed: 123
  };

  // $20.000 REAIS DO HARDCORE
  cash = 20000;
  day = 1; month = 1; year = 1;
  updatePlayerProfileHUD();
  updateUI();

  activeFacilitySet.clear();

  const dNA = { name: 'Distrito Central (Nova Atenas)', population: 45000, trafficIndex: 75, landRentDaily: 25 };

  // =========================================================================
  // DIA 1: ABERTURA DA 1ª KOMBINI (INVESTIMENTO INICIAL: ~$12.000)
  // =========================================================================
  const sKombini = worldGrid[40][37];
  sKombini.district = dNA;
  sKombini.store = {
    id: 's_kombini_na',
    name: '🏪 Kombini Pioneira',
    storeTypeId: 'kombini',
    maxShelves: 4,
    dailyRent: 15,
    shelves: {
      bread: { price: 2.80, stock: 800, maxCapacity: 1000, dailyRestock: 150, quality: 60, supplierId: 'port_1', supplierName: 'Porto de Nova Atenas', landedCost: 1.10 },
      milk:  { price: 2.20, stock: 600, maxCapacity: 1000, dailyRestock: 120, quality: 60, supplierId: 'port_1', supplierName: 'Porto de Nova Atenas', landedCost: 0.95 },
      eggs:  { price: 2.10, stock: 700, maxCapacity: 1000, dailyRestock: 130, quality: 60, supplierId: 'port_1', supplierName: 'Porto de Nova Atenas', landedCost: 0.85 }
    }
  };
  _indexTile(sKombini);
  // Custo de montagem da loja + estoque inicial (~$8.000 aluguel/licença + $3.500 estoque = $11.500)
  cash -= 11500; // Restam $8.500 de capital de giro de segurança!
  auditResults.progressionLog.push({ day: 1, event: 'Inauguração da Kombini Pioneira com abastecimento portuário (Caixa restante: $' + Math.round(cash) + ')' });

  let farmBuilt = false;
  let factoryBuilt = false;
  let supermarketBuilt = false;
  let heavyIndustryBuilt = false;
  let autoShowroomBuilt = false;

  const TOTAL_DAYS = 1825; // 5 Anos
  let lowestCash = cash;
  let peakCash = cash;
  let bankruptOccurred = false;

  for (let d = 1; d <= TOTAL_DAYS; d++) {
    simulateDay();

    if (cash < lowestCash) lowestCash = cash;
    if (cash > peakCash) peakCash = cash;

    if (consecutiveInsolventMonths >= 6 && insolvencyCountdownMonths <= 0) {
      bankruptOccurred = true;
    }

    // DECISÃO DE IA DO JOGADOR: REINVESTIMENTO ORGÂNICO BASEADO NO LUCRO ACUMULADO

    // 1. Quando acumula $35.000 (após ~8-12 meses): Constrói 1ª Fazenda de Trigo própria para cortar frete
    if (!farmBuilt && cash >= 35000 && d >= 180) {
      const fWheat = worldGrid[44][37];
      fWheat.farm = {
        id: 'f_wheat_1', name: '🌾 Fazenda de Trigo Própria', cropId: 'wheat', cropName: 'Trigo',
        quality: 68, dailyYield: 800, dailyOperatingCost: 0.25, stock: 2000, maxCapacity: 6000
      };
      _indexTile(fWheat);
      cash -= 25000; // Custo de aquisição do terreno e plantio
      farmBuilt = true;
      auditResults.progressionLog.push({ day: d, event: 'Construção da 1ª Fazenda de Trigo própria (Caixa: $' + Math.round(cash) + ')' });
    }

    // 2. Quando acumula $65.000 (após ~1.5 a 2 anos): Constrói Fábrica de Moagem & Panificação
    if (!factoryBuilt && farmBuilt && cash >= 65000 && d >= 400) {
      const fac = worldGrid[43][37];
      fac.factory = {
        id: 'fac_bread_1', name: '🏭 Panificadora Industrial', maxLines: 4,
        lines: {
          rec_flour: { recipeId: 'rec_flour', outputProductId: 'flour', dailyCapacity: 600, unitCost: 0.45, outputQuality: 68, finishedStock: 2000, maxStock: 6000, inputsConfig: { wheat: { supplierId: 'f_wheat_1', wholesalePrice: 0.25, freight: 0.01, landedCost: 0.26 } } },
          rec_bread: { recipeId: 'rec_bread', outputProductId: 'bread', dailyCapacity: 600, unitCost: 0.65, outputQuality: 70, finishedStock: 2500, maxStock: 6000, inputsConfig: { flour: { supplierId: 'internal_flour', wholesalePrice: 0.45, freight: 0.00, landedCost: 0.45 } } }
        }
      };
      _indexTile(fac);
      // Conecta a Kombini ao pão da fábrica própria (Custo cai de $1.10 para $0.68!)
      sKombini.store.shelves.bread.supplierId = 'fac_bread_1_rec_bread';
      sKombini.store.shelves.bread.landedCost = 0.68;
      cash -= 45000;
      factoryBuilt = true;
      auditResults.progressionLog.push({ day: d, event: 'Inauguração da Panificadora Industrial Própria (Custo do Pão caiu 38%!)' });
    }

    // 3. Quando acumula $120.000 (após ~2.5 anos): Expande para Supermercado de Grande Porte
    if (!supermarketBuilt && factoryBuilt && cash >= 120000 && d >= 750) {
      const sSuper = worldGrid[41][37];
      sSuper.district = dNA;
      sSuper.store = {
        id: 's_super_1', name: '🛒 Supermercado Vance', storeTypeId: 'supermarket', maxShelves: 8, dailyRent: 45,
        shelves: {
          bread: { price: 2.75, stock: 2500, maxCapacity: 4000, dailyRestock: 400, quality: 70, supplierId: 'fac_bread_1_rec_bread', landedCost: 0.68 },
          flour: { price: 1.95, stock: 2000, maxCapacity: 3000, dailyRestock: 250, quality: 68, supplierId: 'fac_bread_1_rec_flour', landedCost: 0.48 },
          milk:  { price: 2.15, stock: 2000, maxCapacity: 3000, dailyRestock: 300, quality: 65, supplierId: 'port_1', landedCost: 0.90 },
          eggs:  { price: 2.05, stock: 2000, maxCapacity: 3000, dailyRestock: 300, quality: 65, supplierId: 'port_1', landedCost: 0.80 }
        }
      };
      _indexTile(sSuper);
      cash -= 60000;
      supermarketBuilt = true;
      auditResults.progressionLog.push({ day: d, event: 'Inauguração do Supermercado Metropolitano (Volume de Vendas Triplicou!)' });
    }

    // 4. Quando acumula $300.000 (após ~3.5 anos): Entra no setor Têxtil & Moda
    if (!heavyIndustryBuilt && supermarketBuilt && cash >= 280000 && d >= 1100) {
      // Fazenda de Algodão (50, 40)
      const fCot = worldGrid[50][40];
      fCot.farm = { id: 'f_cot_1', name: '🌱 Fazenda de Algodão', cropId: 'cotton', cropName: 'Algodão', quality: 72, dailyYield: 600, dailyOperatingCost: 0.50, stock: 2000, maxCapacity: 5000 };
      _indexTile(fCot);

      // Fábrica Têxtil (41, 38)
      const fTex = worldGrid[41][38];
      fTex.factory = {
        id: 'f_tex_1', name: '🏭 Indústria Têxtil', maxLines: 4,
        lines: {
          rec_cotton_fabric: { recipeId: 'rec_cotton_fabric', outputProductId: 'cotton_cloth', dailyCapacity: 500, unitCost: 1.20, outputQuality: 72, finishedStock: 2000, maxStock: 5000, inputsConfig: { cotton: { supplierId: 'f_cot_1', wholesalePrice: 0.50, freight: 0.04, landedCost: 0.54 } } },
          rec_apparel_shirts: { recipeId: 'rec_apparel_shirts', outputProductId: 'shirt', dailyCapacity: 400, unitCost: 3.50, outputQuality: 75, finishedStock: 1500, maxStock: 4000, inputsConfig: { cotton_cloth: { supplierId: 'internal_cloth', wholesalePrice: 1.20, freight: 0.00, landedCost: 1.20 } } }
        }
      };
      _indexTile(fTex);

      // Boutique de Moda (42, 38)
      const sApp = worldGrid[42][38]; sApp.district = dNA;
      sApp.store = {
        id: 's_app_1', name: '👗 Boutique Vance Moda', storeTypeId: 'apparel', maxShelves: 6, dailyRent: 38,
        shelves: {
          shirt: { price: 14.80, stock: 800, maxCapacity: 1500, dailyRestock: 140, quality: 75, supplierId: 'f_tex_1_rec_apparel_shirts', landedCost: 3.60 }
        }
      };
      _indexTile(sApp);
      cash -= 180000;
      heavyIndustryBuilt = true;
      auditResults.progressionLog.push({ day: d, event: 'Verticalização Têxtil: Fazenda Algodão + Fábrica Tecidos + Boutique de Moda inauguradas!' });
    }

    // 5. Quando acumula $800.000 (após ~4 anos): Entra no setor Automotivo / Concessionária
    if (!autoShowroomBuilt && heavyIndustryBuilt && cash >= 700000 && d >= 1400) {
      const mIron = worldGrid[35][30];
      mIron.mine = { id: 'm_iron_1', name: '⛏️ Mina de Ferro', resourceId: 'iron_ore', quality: 78, dailyYield: 500, unitCost: 0.80, stock: 3000, maxCapacity: 10000 };
      _indexTile(mIron);

      const fAuto = worldGrid[39][36];
      fAuto.factory = {
        id: 'f_auto_1', name: '🏭 Montadora de Veículos', maxLines: 4,
        lines: {
          rec_compact_car: { recipeId: 'rec_compact_car', outputProductId: 'compact_car', dailyCapacity: 10, unitCost: 1200, outputQuality: 80, finishedStock: 50, maxStock: 200, inputsConfig: { iron_ore: { supplierId: 'm_iron_1', wholesalePrice: 0.80, freight: 0.05, landedCost: 0.85 } } }
        }
      };
      _indexTile(fAuto);

      const sAuto = worldGrid[44][38]; sAuto.district = dNA;
      sAuto.store = {
        id: 's_auto_1', name: '🚗 Concessionária Vance Motors', storeTypeId: 'automotive', maxShelves: 4, dailyRent: 65,
        shelves: {
          compact_car: { price: 3400.00, stock: 20, maxCapacity: 40, dailyRestock: 4, quality: 80, supplierId: 'f_auto_1', landedCost: 1210.00 }
        }
      };
      _indexTile(sAuto);
      cash -= 450000;
      autoShowroomBuilt = true;
      auditResults.progressionLog.push({ day: d, event: 'Mega-Expansão Automotiva: Mina de Ferro + Montadora + Concessionária de Carros!' });
    }

    // Registra métricas anuais
    if (d % 365 === 0) {
      const nw = calculateCorporateNetWorth();
      auditResults.yearlyFinancials.push({
        yearCompleted: d / 365,
        currentDate: `Dia ${day} / Mês ${month} / Ano ${year}`,
        cash: Math.round(cash),
        netWorth: Math.round(nw.netWorth),
        growthMultiplier: Number((nw.netWorth / 20000).toFixed(1)) + 'x'
      });
    }
  }

  // DRE Final
  renderFacilityDRETable();
  const diagText = document.getElementById('fdre-diag-text')?.textContent || '';
  const totalRev = document.getElementById('fdre-total-rev')?.textContent || '';
  const totalNet = document.getElementById('fdre-total-net')?.textContent || '';

  auditResults.finalResults = {
    survived5YearsHardcore: !bankruptOccurred,
    startingCash: 20000,
    finalCash: Math.round(cash),
    finalNetWorth: Math.round(calculateCorporateNetWorth().netWorth),
    growthTotalMultiple: Number((calculateCorporateNetWorth().netWorth / 20000).toFixed(1)) + 'x do capital inicial',
    finalMonthlyRevenue: totalRev,
    finalMonthlyProfit: totalNet,
    analystVerdict: diagText
  };

  return auditResults;
})();
