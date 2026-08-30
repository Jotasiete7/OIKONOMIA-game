// tools/validate_market_balance.js
// Validador Automatizado de Payback e Equilíbrio de Mercado (OIKONOMIA vs Capitalism Lab Target)

const path = require('path');
const fs = require('fs');

const coreMathPath = path.resolve(__dirname, '../client/core_math.js');
const dataCatalogsPath = path.resolve(__dirname, '../client/data_catalogs.js');

const CoreMath = require(coreMathPath);
const {
  CITY_DISTRICTS,
  STORE_TYPES,
  STORE_CATEGORY_WHITELIST,
  PRODUCT_CATALOG,
  FACTORY_RECIPES,
  SEAPORTS
} = require(dataCatalogsPath);

let out = '';
const log = (msg) => {
  out += msg + '\n';
  console.log(msg);
};

log('================================================================');
log('       OIKONOMIA — VALIDAÇÃO DE EQUILÍBRIO & PAYBACK DE VAREJO   ');
log('================================================================\n');

const representativeDistrict = {
  population: 12000,
  trafficIndex: 65,
  landRentDaily: 35
};

// Custos projetados de Licenciamento / Concessão Regulatória de Nicho
const NICHE_LICENSES = {
  kombini: 5000,        // Alvará de conveniência de bairro
  supermarket: 50000,   // Licença sanitária e logística de grande porte
  apparel: 40000,       // Licença de representação de marcas e boutique
  electronics: 180000,  // Concessão de distribuição tech e homologação
  automotive: 250000,   // Concessão de montadoras e showroom automotivo
  pharmacy: 25000,      // Alvará sanitário farmacêutico e CRF
  furniture: 50000,     // Concessão de marcenarias e grande showroom
  jewelry: 150000,      // Licença de custódia e segurança de metais nobres
  hardware: 35000       // Alvará de materiais pesados e químicos
};

const storeStaffOverheadDaily = {
  kombini: 65,
  supermarket: 380,
  apparel: 220,
  electronics: 360,
  automotive: 450,
  pharmacy: 140,
  furniture: 240,
  jewelry: 180,
  hardware: 140
};

const initialStockUnits = {
  automotive: 5,
  jewelry: 10,
  furniture: 15,
  electronics: 25,
  apparel: 35
};

const negativeMarginProducts = [];

// 1. Auditoria individual de margem de produtos
for (const prod of Object.values(PRODUCT_CATALOG)) {
  if (prod.isIntermediate || prod.category === 'Insumos Industriais') continue;

  const recipe = FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id);
  const factoryUnitCost = recipe ? recipe.unitCost : (prod.baseCost * 1.5);
  const wholesaleCost = Math.max(factoryUnitCost * 1.15, prod.standardPrice * 0.65);
  const landedCost = wholesaleCost * 1.04;
  const unitMargin = prod.standardPrice - landedCost;

  if (unitMargin <= 0) {
    negativeMarginProducts.push({
      id: prod.id,
      name: prod.name,
      category: prod.category,
      standardPrice: prod.standardPrice,
      landedCost: Number(landedCost.toFixed(2)),
      unitMargin: Number(unitMargin.toFixed(2))
    });
  }
}

function evaluateScenario(withLicensing = false) {
  const storePaybacks = [];
  const outliers = [];

  for (const storeType of STORE_TYPES) {
    const allowedCats = STORE_CATEGORY_WHITELIST[storeType.id] || [];
    const validProducts = Object.values(PRODUCT_CATALOG).filter(p => allowedCats.includes(p.category) && !p.isIntermediate);

    if (validProducts.length === 0) continue;

    const actualRent = representativeDistrict.landRentDaily * storeType.rentMultiplier;
    const staffCost = storeStaffOverheadDaily[storeType.id] || 200;
    const fixedDailyCost = actualRent + staffCost;
    const stockUnits = initialStockUnits[storeType.id] || 50;

    const basket = validProducts.slice(0, storeType.maxShelves);
    let totalDailyGrossProfit = 0;
    let totalInitialStockCost = 0;

    for (const prod of basket) {
      const recipe = FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id);
      const factoryUnitCost = recipe ? recipe.unitCost : (prod.baseCost * 1.5);
      const wholesaleCost = Math.max(factoryUnitCost * 1.15, prod.standardPrice * 0.65);
      const landedCost = wholesaleCost * 1.04;

      const unitMargin = prod.standardPrice - landedCost;
      const baseDem = representativeDistrict.population * (prod.perCapitaDailyDemand || 0.01) * (representativeDistrict.trafficIndex / 100);
      const dailyDemand = baseDem * 0.50;

      const shelfDailyProfit = dailyDemand * unitMargin;
      totalDailyGrossProfit += shelfDailyProfit;
      totalInitialStockCost += Math.round(stockUnits * landedCost);
    }

    const dailyNetProfit = totalDailyGrossProfit - fixedDailyCost;
    const monthlyNetProfit = dailyNetProfit * 30;
    const licenseCost = withLicensing ? (NICHE_LICENSES[storeType.id] || 0) : 0;
    const totalCapex = storeType.cost + licenseCost + totalInitialStockCost;
    const paybackMonths = monthlyNetProfit > 0 ? (totalCapex / monthlyNetProfit) : Infinity;

    const storeResult = {
      id: storeType.id,
      name: storeType.name,
      maxShelves: storeType.maxShelves,
      buildingCost: storeType.cost,
      licenseCost,
      initialStockCost: totalInitialStockCost,
      capex: totalCapex,
      dailyGross: Math.round(totalDailyGrossProfit),
      fixedDaily: Math.round(fixedDailyCost),
      dailyNet: Math.round(dailyNetProfit),
      monthlyNet: Math.round(monthlyNetProfit),
      paybackMonths: Number(paybackMonths.toFixed(1))
    };

    storePaybacks.push(storeResult);

    if (paybackMonths < 4.0 || paybackMonths > 18.0) {
      outliers.push(storeResult);
    }
  }

  return { storePaybacks, outliers };
}

log('--- CENÁRIO A: CAPEX ATUAL (Apenas Obra Civil + Estoque Inicial) ---');
const scenarioA = evaluateScenario(false);
for (const s of scenarioA.storePaybacks) {
  const status = (s.paybackMonths >= 4.0 && s.paybackMonths <= 18.0)
    ? '✅ EQUILIBRADO'
    : (s.paybackMonths < 4.0 ? '⚠️ MUITO RÁPIDO' : '⚠️ LENTO / PREJUÍZO');
  log(`• [${s.id}] ${s.name} (${s.maxShelves} slots)`);
  log(`   Obra: $${s.buildingCost.toLocaleString()} | Estoque: $${s.initialStockCost.toLocaleString()} | Capex Total: $${s.capex.toLocaleString()}`);
  log(`   Lucro Líquido/Mês: $${s.monthlyNet.toLocaleString()} ➔ Payback: ${s.paybackMonths} meses [${status}]\n`);
}

log('\n--- CENÁRIO B: CAPEX COM LICENCIAMENTO DE NICHO (Obra + Licença de Nicho + Estoque) ---');
const scenarioB = evaluateScenario(true);
for (const s of scenarioB.storePaybacks) {
  const status = (s.paybackMonths >= 4.0 && s.paybackMonths <= 18.0)
    ? '✅ EQUILIBRADO'
    : (s.paybackMonths < 4.0 ? '⚠️ MUITO RÁPIDO' : '⚠️ LENTO / PREJUÍZO');
  log(`• [${s.id}] ${s.name} (${s.maxShelves} slots)`);
  log(`   Obra: $${s.buildingCost.toLocaleString()} | Licença: $${s.licenseCost.toLocaleString()} | Estoque: $${s.initialStockCost.toLocaleString()} | Capex: $${s.capex.toLocaleString()}`);
  log(`   Lucro Líquido/Mês: $${s.monthlyNet.toLocaleString()} ➔ Payback: ${s.paybackMonths} meses [${status}]\n`);
}

if (negativeMarginProducts.length > 0) {
  log('⚠️ PRODUTOS COM MARGEM UNITÁRIA NEGATIVA (COMMODITIES CRUAS NO VAREJO):');
  negativeMarginProducts.forEach(p => {
    log(`   • ${p.name} (${p.id}) [${p.category}]: Preço=$${p.standardPrice} vs CustoLanded=$${p.landedCost} (Margem: $${p.unitMargin}/un)`);
  });
  log('');
}

log('================================================================');
log(`CENÁRIO A (Sem Licença): ${scenarioA.storePaybacks.length - scenarioA.outliers.length}/${scenarioA.storePaybacks.length} Lojas Equilibradas (4-18 meses)`);
log(`CENÁRIO B (Com Licença): ${scenarioB.storePaybacks.length - scenarioB.outliers.length}/${scenarioB.storePaybacks.length} Lojas Equilibradas (4-18 meses)`);
log('================================================================');

const outputFile = path.resolve(__dirname, '../docs/auditoria/market_balance_result.txt');
fs.writeFileSync(outputFile, out, 'utf8');
log(`\nSalvo em: ${outputFile}`);
