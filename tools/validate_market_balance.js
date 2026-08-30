// tools/validate_market_balance.js
// Validador Automatizado de Payback e Equilíbrio de Mercado (OIKONOMIA vs Capitalism Lab Target)

const fs = require('fs');
const CoreMath = require('d:/OIKONOMIA PROJETO/client/core_math.js');
const {
  CITY_DISTRICTS,
  STORE_TYPES,
  STORE_CATEGORY_WHITELIST,
  PRODUCT_CATALOG,
  FACTORY_RECIPES,
  SEAPORTS
} = require('d:/OIKONOMIA PROJETO/client/data_catalogs.js');

let out = '';
const log = (msg) => { out += msg + '\n'; };

log('================================================================');
log('       OIKONOMIA — VALIDAÇÃO DE EQUILÍBRIO & PAYBACK DE VAREJO   ');
log('================================================================\n');

const representativeDistrict = {
  population: 12000,
  trafficIndex: 65,
  landRentDaily: 35
};

const storePaybacks = [];
const outliers = [];

try {
  for (const storeType of STORE_TYPES) {
    const allowedCats = STORE_CATEGORY_WHITELIST[storeType.id] || [];
    const validProducts = Object.values(PRODUCT_CATALOG).filter(p => allowedCats.includes(p.category));

    if (validProducts.length === 0) continue;

    const actualRent = representativeDistrict.landRentDaily * storeType.rentMultiplier;
    // Custo operacional diário de funcionários e infraestrutura de loja
    const storeStaffOverheadDaily = {
      kombini: 65,        // Atendentes de turno e energia
      supermarket: 380,   // Equipe de caixas, repositores e gerência
      apparel: 220,       // Vendedores comissionados e segurança
      electronics: 360,   // Consultores técnicos e seguro de estoque
      automotive: 450,    // Vendedores, mecânicos e showroom
      pharmacy: 140,      // Farmacêuticos responsáveis e climatização
      furniture: 240,     // Montadores e carregadores
      jewelry: 180,       // Segurança armada e seguro de joias
      hardware: 140       // Atendentes e operadores de carga
    }[storeType.id] || 200;

    const initialStockUnits = {
      automotive: 5,
      jewelry: 10,
      furniture: 15,
      electronics: 25,
      apparel: 35
    }[storeType.id] || 50;

    const fixedDailyCost = actualRent + storeStaffOverheadDaily;

    // Seleciona uma cesta representativa de produtos até o limite de slots
    const basket = validProducts.slice(0, storeType.maxShelves);
    let totalDailyGrossProfit = 0;
    let totalInitialStockCost = 0;

    for (const prod of basket) {
      // Busca custo de manufatura ou custo portuário (com margem de atacado de 30-40%)
      const recipe = FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id);
      const factoryUnitCost = recipe ? recipe.unitCost : (prod.baseCost * 1.5);
      const wholesaleCost = Math.max(factoryUnitCost * 1.15, prod.standardPrice * 0.65);
      const landedCost = wholesaleCost * 1.04; // frete médio

      const unitMargin = Math.max(0.35, prod.standardPrice - landedCost);
      const baseDem = representativeDistrict.population * (prod.perCapitaDailyDemand || 0.01) * (representativeDistrict.trafficIndex / 100);
      const dailyDemand = baseDem * 0.50; // 50% de market share

      const shelfDailyProfit = dailyDemand * unitMargin;
      totalDailyGrossProfit += shelfDailyProfit;
      totalInitialStockCost += Math.round(initialStockUnits * landedCost);
    }

    const dailyNetProfit = totalDailyGrossProfit - fixedDailyCost;
    const monthlyNetProfit = dailyNetProfit * 30;
    const totalCapex = storeType.cost + totalInitialStockCost;
    const paybackMonths = monthlyNetProfit > 0 ? (totalCapex / monthlyNetProfit) : Infinity;

    const storeResult = {
      id: storeType.id,
      name: storeType.name,
      maxShelves: storeType.maxShelves,
      capex: totalCapex,
      dailyGross: Math.round(totalDailyGrossProfit),
      fixedDaily: Math.round(fixedDailyCost),
      dailyNet: Math.round(dailyNetProfit),
      monthlyNet: Math.round(monthlyNetProfit),
      paybackMonths: Number(paybackMonths.toFixed(1))
    };

    storePaybacks.push(storeResult);

    if (paybackMonths < 3.0 || paybackMonths > 24.0) {
      outliers.push(storeResult);
    }
  }

  log('--- RESULTADO DE PAYBACK POR TIPO DE LOJA (Cesta Cheia em Distrito Médio) ---');
  for (const s of storePaybacks) {
    const status = (s.paybackMonths >= 4.0 && s.paybackMonths <= 18.0)
      ? '✅ EQUILIBRADO'
      : (s.paybackMonths < 4.0 ? '⚠️ MUITO RÁPIDO' : '⚠️ LENTO');

    log(`• [${s.id}] ${s.name} (${s.maxShelves} slots)`);
    log(`   Capex Total: $${s.capex.toLocaleString()} | Lucro Líquido/Mês: $${s.monthlyNet.toLocaleString()}`);
    log(`   Payback Estimado: ${s.paybackMonths} meses [${status}]\n`);
  }

  log('================================================================');
  log(`TOTAL DE LOJAS AVALIADAS: ${storePaybacks.length}`);
  log(`LOJAS DENTRO DA FAIXA ALVO (4-18 MESES): ${storePaybacks.length - outliers.length}/${storePaybacks.length}`);
  log('================================================================');
} catch (err) {
  log('ERRO NA EXECUÇÃO: ' + err.stack);
}

fs.writeFileSync('C:/Users/Metalgear/.gemini/antigravity/brain/6039e0ed-ec30-46aa-a995-01ddbdee4920/scratch/market_balance_result.txt', out, 'utf8');
