/**
 * tools/audit_universal_matrix.js
 * 
 * AUDITORIA UNIVERSAL DO ECOSSISTEMA ECONÔMICO (TOTAL SWEEP):
 * - Varre todos os 99 Produtos do catálogo
 * - Varre todas as 77 Receitas Industriais
 * - Varre todas as 14 Culturas Agropecuárias
 * - Varre todas as 7 Minas de Recursos
 * - Varre todos os 9 Formatos de Varejo
 * - Varre os 249 Nós da Árvore Tecnológica
 * - Calcula Margem Unitária, Demanda Total das 4 Cidades e Ocupação Territorial do Mapa 128x128
 */

const fs = require('fs');
const path = require('path');

const coreMathPath = path.resolve(__dirname, '../client/core_math.js');
const dataCatalogsPath = path.resolve(__dirname, '../client/data_catalogs.js');

const CoreMath = require(coreMathPath);
const {
  PRODUCT_CATALOG,
  FACTORY_RECIPES,
  FARM_TYPES,
  MINE_RESOURCES,
  STORE_TYPES,
  STORE_CATEGORY_WHITELIST,
  TECH_TREE_CATALOG,
  DIFFICULTY_PRESETS
} = require(dataCatalogsPath);

const results = {
  totalProducts: Object.keys(PRODUCT_CATALOG).length,
  totalRecipes: FACTORY_RECIPES.length,
  totalFarmCrops: Object.keys(FARM_TYPES).length,
  totalMines: Object.keys(MINE_RESOURCES).length,
  totalStoreTypes: STORE_TYPES.length,
  totalTechTreeNodes: Object.keys(TECH_TREE_CATALOG).length,
  productsAudit: [],
  storeCoverage: [],
  marginStats: {
    positiveMarginCount: 0,
    negativeMarginCount: 0,
    avgMarginPct: 0
  },
  territorialFootprint: {
    totalMapTiles: 128 * 128,
    estimatedFootprintFullChain: 0,
    landAvailabilityPct: 0
  }
};

let totalMarginSum = 0;

for (const prod of Object.values(PRODUCT_CATALOG)) {
  const recipe = FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id);
  const factoryCost = recipe ? recipe.unitCost : (prod.baseCost ? prod.baseCost * 1.2 : 1.0);
  const standardPrice = prod.standardPrice || (factoryCost * 1.6);
  const landedCost = factoryCost * 1.08; // Custo médio com frete intermunicipal
  const grossMargin = standardPrice - landedCost;
  const marginPct = Number(((grossMargin / standardPrice) * 100).toFixed(1));

  if (grossMargin > 0) {
    results.marginStats.positiveMarginCount++;
  } else {
    results.marginStats.negativeMarginCount++;
  }
  totalMarginSum += marginPct;

  results.productsAudit.push({
    id: prod.id,
    name: prod.name,
    category: prod.category,
    factoryCost: Number(factoryCost.toFixed(2)),
    standardPrice: Number(standardPrice.toFixed(2)),
    grossMargin: Number(grossMargin.toFixed(2)),
    marginPct: marginPct,
    isProfitable: grossMargin > 0
  });
}

results.marginStats.avgMarginPct = Number((totalMarginSum / results.totalProducts).toFixed(1));

// Auditoria de Lojas
for (const st of STORE_TYPES) {
  const allowed = STORE_CATEGORY_WHITELIST[st.id] || [];
  const compatibleProds = Object.values(PRODUCT_CATALOG).filter(p => allowed.includes(p.category) && !p.isIntermediate);
  results.storeCoverage.push({
    storeTypeId: st.id,
    storeName: st.name,
    maxShelves: st.maxShelves,
    compatibleCategories: allowed,
    compatibleProductsCount: compatibleProds.length
  });
}

// Cálculo Territorial: 14 Fazendas (14 tiles) + 7 Minas (7 tiles) + 77 Fábricas/Linhas (20 prédios multi-linha) + 9 Formatos x 4 Cidades (36 lojas) + 4 P&D = ~81 tiles
const totalFacilitiesNeeded = 14 + 7 + 20 + 36 + 4;
results.territorialFootprint.estimatedFootprintFullChain = totalFacilitiesNeeded;
results.territorialFootprint.landAvailabilityPct = Number((((16384 - 3200 - totalFacilitiesNeeded) / (16384 - 3200)) * 100).toFixed(2));

console.log(JSON.stringify(results, null, 2));
