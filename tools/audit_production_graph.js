/**
 * tools/audit_production_graph.js
 * Auditoria estrutural e automatizada do Grafo de Produção do OIKONOMIA.
 * 
 * Verifica 7 regras mandatórias de integridade e consistência econômica:
 * 1. Receitas referenciando produtos inexistentes
 * 2. Produtos órfãos (impossíveis de produzir ou extrair)
 * 3. Matérias-primas sem fonte de extração (Mina/Fazenda)
 * 4. Produtos beco sem saída (sem consumo industrial e sem canal de varejo)
 * 5. Dependências circulares no grafo de receitas
 * 6. Receitas ou produtos com campos incompletos ou nulos
 * 7. Produtos sem categoria de loja correspondente
 */

const path = require('path');
const fs = require('fs');

const dataCatalogsPath = path.resolve(__dirname, '../client/data_catalogs.js');
const coreMathPath = path.resolve(__dirname, '../client/core_math.js');

const catalogs = require(dataCatalogsPath);
const CoreMath = require(coreMathPath);

const {
  PRODUCT_CATALOG,
  FACTORY_RECIPES,
  STORE_TYPES,
  STORE_CATEGORY_WHITELIST,
  NATURAL_MINES,
  FARM_TYPES,
  SEAPORTS,
  PORT_SUPPLIES_FOOD_CONSUMER,
  PORT_SUPPLIES_COMMODITIES,
  PORT_SUPPLIES_TECH_PARTS,
  RD_CATEGORIES
} = catalogs;

function runAudit() {
  const issues = [];

  // Mapeamentos rápidos
  const productIds = new Set(Object.keys(PRODUCT_CATALOG));
  const mineCropIds = new Set(NATURAL_MINES.map(m => m.resourceId));
  const farmCropIds = new Set(FARM_TYPES.map(f => f.cropId));
  const recipeOutputIds = new Set(FACTORY_RECIPES.map(r => r.outputProdId || r.id));
  
  // Categorias de loja válidas em whitelists
  const allWhitelistedCategories = new Set();
  Object.values(STORE_CATEGORY_WHITELIST).forEach(cats => {
    cats.forEach(c => allWhitelistedCategories.add(c));
  });

  // Coleta de todos os insumos consumidos no jogo
  const allConsumedInputIds = new Set();
  FACTORY_RECIPES.forEach(r => {
    if (r.inputs) {
      Object.keys(r.inputs).forEach(inp => allConsumedInputIds.add(inp));
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 1: Receita referenciando produto inexistente
  // ───────────────────────────────────────────────────────────────────────────
  FACTORY_RECIPES.forEach(rec => {
    if (!rec.outputProdId && !PRODUCT_CATALOG[rec.id]) {
      issues.push({
        item: rec.name || rec.id,
        category: 'Regra 1: Receita sem produto de saída no catálogo',
        severity: 'ALTA',
        detail: `Receita "${rec.name}" (${rec.id}) produz saída "${rec.outputProdId || rec.id}" que não existe no PRODUCT_CATALOG.`
      });
    } else if (rec.outputProdId && !PRODUCT_CATALOG[rec.outputProdId]) {
      issues.push({
        item: rec.name || rec.id,
        category: 'Regra 1: Receita com outputProdId inexistente',
        severity: 'ALTA',
        detail: `Receita "${rec.name}" (${rec.id}) tem outputProdId "${rec.outputProdId}" que não existe no PRODUCT_CATALOG.`
      });
    }

    if (rec.inputs) {
      Object.entries(rec.inputs).forEach(([inpId, qty]) => {
        if (!PRODUCT_CATALOG[inpId]) {
          issues.push({
            item: `${rec.name} (${rec.id})`,
            category: 'Regra 1: Insumo inexistente no catálogo',
            severity: 'CRÍTICA',
            detail: `Receita requer insumo "${inpId}" (qty: ${qty}), mas este ID não existe no PRODUCT_CATALOG.`
          });
        }
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 2: Produto órfão (impossível de obter)
  // ───────────────────────────────────────────────────────────────────────────
  Object.values(PRODUCT_CATALOG).forEach(prod => {
    const isMined = mineCropIds.has(prod.id);
    const isFarmed = farmCropIds.has(prod.id);
    const isManufactured = recipeOutputIds.has(prod.id);
    const isImported = (PORT_SUPPLIES_COMMODITIES && PORT_SUPPLIES_COMMODITIES[prod.id]) ||
                       (PORT_SUPPLIES_FOOD_CONSUMER && PORT_SUPPLIES_FOOD_CONSUMER[prod.id]) ||
                       (PORT_SUPPLIES_TECH_PARTS && PORT_SUPPLIES_TECH_PARTS[prod.id]);

    if (!isMined && !isFarmed && !isManufactured && !isImported) {
      issues.push({
        item: `${prod.name} (${prod.id})`,
        category: 'Regra 2: Produto Órfão (Impossível de Obter)',
        severity: 'CRÍTICA',
        detail: `Produto está no catálogo mas não possui nenhuma Mina, Fazenda, Receita Fabril ou Importação Portuária que o produza.`
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 3: Matéria-prima sem local de extração direta (Mina/Fazenda)
  // ───────────────────────────────────────────────────────────────────────────
  Object.values(PRODUCT_CATALOG).forEach(prod => {
    const isManufactured = recipeOutputIds.has(prod.id);
    const isMined = mineCropIds.has(prod.id);
    const isFarmed = farmCropIds.has(prod.id);
    const isAgroOrMineralCategory = prod.category === 'Agronegócio' || prod.category === 'Recursos Naturais';

    if (isAgroOrMineralCategory && !isMined && !isFarmed && !isManufactured) {
      issues.push({
        item: `${prod.name} (${prod.id})`,
        category: 'Regra 3: Matéria-Prima sem instalação extrativa',
        severity: 'ALTA',
        detail: `Classificado como "${prod.category}", mas não existe Fazenda nem Mina no catálogo com cropId/resourceId "${prod.id}".`
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 4: Produto sem saída (beco sem saída)
  // ───────────────────────────────────────────────────────────────────────────
  Object.values(PRODUCT_CATALOG).forEach(prod => {
    const isConsumedInRecipe = allConsumedInputIds.has(prod.id);
    const isWhitelistedInStore = allWhitelistedCategories.has(prod.category);
    const isIntermediate = prod.isIntermediate || prod.category === 'Insumos Industriais';

    // Se é insumo intermediário e nunca é consumido em nenhuma receita
    if (isIntermediate && !isConsumedInRecipe) {
      issues.push({
        item: `${prod.name} (${prod.id})`,
        category: 'Regra 4: Insumo Intermediário Beco Sem Saída',
        severity: 'MÉDIA',
        detail: `Marcado como insumo/intermediário, mas nenhuma receita do jogo utiliza "${prod.id}" como ingrediente.`
      });
    }

    // Se não é intermediário, não é consumido em receita e não pode ser vendido em loja
    if (!isIntermediate && !isConsumedInRecipe && !isWhitelistedInStore) {
      issues.push({
        item: `${prod.name} (${prod.id})`,
        category: 'Regra 4: Produto Final sem Canal de Venda',
        severity: 'ALTA',
        detail: `Produto não é insumo de nenhuma receita e sua categoria "${prod.category}" não é vendida em nenhuma loja.`
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 5: Dependência Circular no Grafo de Receitas
  // ───────────────────────────────────────────────────────────────────────────
  const graph = {};
  FACTORY_RECIPES.forEach(r => {
    const out = r.outputProdId || r.id;
    graph[out] = r.inputs ? Object.keys(r.inputs) : [];
  });

  const visited = {};
  const cycleStack = [];
  const detectedCycles = [];

  function checkCycle(node) {
    visited[node] = 1;
    cycleStack.push(node);

    const neighbors = graph[node] || [];
    for (const nb of neighbors) {
      if (visited[nb] === 1) {
        const cyclePath = cycleStack.slice(cycleStack.indexOf(nb)).concat(nb);
        detectedCycles.push(cyclePath.join(' ➔ '));
      } else if (!visited[nb]) {
        checkCycle(nb);
      }
    }

    cycleStack.pop();
    visited[node] = 2;
  }

  Object.keys(graph).forEach(node => {
    if (!visited[node]) checkCycle(node);
  });

  detectedCycles.forEach(cycle => {
    issues.push({
      item: cycle,
      category: 'Regra 5: Dependência Circular no Grafo',
      severity: 'CRÍTICA',
      detail: `Ciclo detectado no grafo de receitas: ${cycle}. Isso causa loop infinito em cálculos de Tier e P&D.`
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 6: Receitas ou Produtos com Campos Incompletos / Nulos
  // ───────────────────────────────────────────────────────────────────────────
  FACTORY_RECIPES.forEach(rec => {
    const missing = [];
    if (!rec.id) missing.push('id');
    if (!rec.name) missing.push('name');
    if (!rec.outputName) missing.push('outputName');
    if (typeof rec.unitCost !== 'number' || isNaN(rec.unitCost)) missing.push('unitCost');
    if (typeof rec.quality !== 'number' || isNaN(rec.quality)) missing.push('quality');
    if (typeof rec.dailyCap !== 'number' || isNaN(rec.dailyCap)) missing.push('dailyCap');

    if (missing.length > 0) {
      issues.push({
        item: rec.name || rec.id || 'Receita Anônima',
        category: 'Regra 6: Receita Incompleta',
        severity: 'ALTA',
        detail: `Receita possui campos essenciais ausentes ou inválidos: [${missing.join(', ')}].`
      });
    }
  });

  Object.values(PRODUCT_CATALOG).forEach(prod => {
    const missing = [];
    if (!prod.id) missing.push('id');
    if (!prod.name) missing.push('name');
    if (!prod.category) missing.push('category');
    if (typeof prod.standardPrice !== 'number') missing.push('standardPrice');
    if (typeof prod.baseCost !== 'number') missing.push('baseCost');
    if (typeof prod.necessityIndex !== 'number' && !prod.isIntermediate) missing.push('necessityIndex');

    if (missing.length > 0) {
      issues.push({
        item: prod.name || prod.id || 'Produto Anônimo',
        category: 'Regra 6: Produto com Dados Incompletos',
        severity: 'MÉDIA',
        detail: `Produto no catálogo possui campos essenciais ausentes: [${missing.join(', ')}].`
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 7: Produto sem Categoria de Loja Correspondente
  // ───────────────────────────────────────────────────────────────────────────
  Object.values(PRODUCT_CATALOG).forEach(prod => {
    const isIntermediate = prod.isIntermediate || prod.category === 'Insumos Industriais' || prod.category === 'Agronegócio' || prod.category === 'Recursos Naturais';
    if (!isIntermediate) {
      if (!allWhitelistedCategories.has(prod.category)) {
        issues.push({
          item: `${prod.name} (${prod.id})`,
          category: 'Regra 7: Categoria de Loja Inexistente',
          severity: 'ALTA',
          detail: `Produto de consumo final pertence à categoria "${prod.category}", mas esta categoria não está presente na whitelist de nenhuma loja (Kombini, Supermercado, etc.).`
        });
      }
    }
  });

  return {
    totalProducts: Object.keys(PRODUCT_CATALOG).length,
    totalRecipes: FACTORY_RECIPES.length,
    totalMines: NATURAL_MINES.length,
    totalFarms: FARM_TYPES.length,
    totalStores: STORE_TYPES.length,
    issues
  };
}

module.exports = { runAudit };

if (require.main === module) {
  const res = runAudit();
  console.log(`\n=======================================================`);
  console.log(` AUDITORIA DO GRAFO DE PRODUÇÃO — OIKONOMIA`);
  console.log(`=======================================================`);
  console.log(`Produtos no Catálogo: ${res.totalProducts}`);
  console.log(`Receitas Fabris:      ${res.totalRecipes}`);
  console.log(`Minas Naturais:       ${res.totalMines}`);
  console.log(`Fazendas Agrícolas:   ${res.totalFarms}`);
  console.log(`Tipos de Loja:        ${res.totalStores}`);
  console.log(`Problemas Encontrados: ${res.issues.length}\n`);

  if (res.issues.length === 0) {
    console.log('✅ Nenhum problema estrutural encontrado no grafo de produção.');
  } else {
    console.log(`| # | Item / ID | Severidade | Categoria do Problema | Detalhes |`);
    console.log(`|---|---|---|---|---|`);
    res.issues.forEach((iss, i) => {
      console.log(`| ${i + 1} | ${iss.item} | **${iss.severity}** | ${iss.category} | ${iss.detail} |`);
    });
  }
}
