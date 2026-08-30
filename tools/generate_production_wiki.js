/**
 * tools/generate_production_wiki.js
 * Gerador automatizado da Wiki Interna do Grafo de Produção (docs/wiki/producao.md).
 * Lê diretamente data_catalogs.js e core_math.js para garantir documentação viva 100% atualizada.
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
  RD_CATEGORIES
} = catalogs;

function generateWiki() {
  const products = Object.values(PRODUCT_CATALOG);

  // Mapeamentos
  const recipeByOutput = {};
  FACTORY_RECIPES.forEach(r => {
    const out = r.outputProdId || r.id;
    recipeByOutput[out] = r;
  });

  const mineByResource = {};
  NATURAL_MINES.forEach(m => {
    mineByResource[m.resourceId] = m;
  });

  const farmByCrop = {};
  FARM_TYPES.forEach(f => {
    farmByCrop[f.cropId] = f;
  });

  // Mapeia onde cada produto é consumido como insumo
  const usedInRecipes = {};
  FACTORY_RECIPES.forEach(r => {
    if (r.inputs) {
      Object.entries(r.inputs).forEach(([inpId, qty]) => {
        if (!usedInRecipes[inpId]) usedInRecipes[inpId] = [];
        usedInRecipes[inpId].push({ recipeName: r.name, outputName: r.outputName, qty });
      });
    }
  });

  // Mapeia onde cada produto é vendido
  const soldInStores = {};
  products.forEach(p => {
    const stores = [];
    STORE_TYPES.forEach(st => {
      const whitelist = STORE_CATEGORY_WHITELIST[st.id] || [];
      if (whitelist.includes(p.category) || st.category === 'all') {
        if (!p.isIntermediate && p.category !== 'Insumos Industriais') {
          stores.push(st.name);
        }
      }
    });
    soldInStores[p.id] = stores;
  });

  // Agrupa produtos por Tier (0 a 5)
  const tierGroups = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };

  products.forEach(p => {
    const tier = CoreMath.calculateProductionTier(p.id, FACTORY_RECIPES);
    const safeTier = Math.min(5, Math.max(0, tier));
    tierGroups[safeTier].push(p);
  });

  // Geração do Markdown
  let md = `# 📖 Wiki Interna do Grafo de Produção — OIKONOMIA\n\n`;
  md += `> **Documentação Viva**: Este arquivo foi gerado automaticamente a partir de \`client/data_catalogs.js\`.\n`;
  md += `> **Total de Produtos**: ${products.length} itens catalogados | **Receitas Industriais**: ${FACTORY_RECIPES.length} | **Minas**: ${NATURAL_MINES.length} | **Fazendas**: ${FARM_TYPES.length}\n`;
  md += `> **Data de Geração**: ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `---\n\n`;

  const tierDescriptions = {
    0: 'Tier 0 — Matérias-Primas & Recursos Naturais (Extrativismo / Agronegócio)',
    1: 'Tier 1 — Insumos Básicos & Refino Primário',
    2: 'Tier 2 — Bens de Consumo Intermediários & Manufatura',
    3: 'Tier 3 — Montadoras & Produtos Compostos',
    4: 'Tier 4 — Manufatura Avançada & Precisão Integrada',
    5: 'Tier 5 — Síntese Tecnológica Suprema & Bens Nobres'
  };

  for (let t = 0; t <= 5; t++) {
    const list = tierGroups[t] || [];
    md += `## ${tierDescriptions[t]} (${list.length} produtos)\n\n`;

    if (list.length === 0) {
      md += `*Nenhum produto cadastrado neste Tier.*\n\n`;
      continue;
    }

    list.sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
      const rec = recipeByOutput[p.id];
      const mine = mineByResource[p.id];
      const farm = farmByCrop[p.id];
      const usedIn = usedInRecipes[p.id] || [];
      const stores = soldInStores[p.id] || [];

      let origin = '';
      if (mine) origin = `⛏️ Extração Mineral — ${mine.name} (Rendimento: ${mine.dailyYield} un/dia · Custo: $${mine.unitCost.toFixed(2)})`;
      else if (farm) origin = `🌾 Produção Agrícola — ${farm.name} (Rendimento: ${farm.dailyYield} un/dia · Custo: $${farm.unitCost.toFixed(2)})`;
      else if (rec) origin = `🏭 Linha Fabril — ${rec.name} (Capacidade: ${rec.dailyCap} un/dia · Custo: $${rec.unitCost.toFixed(2)}/un)`;
      else origin = `⚓ Importação Portuária Direta`;

      let inputsStr = '(nenhum — recurso primário)';
      if (rec && rec.inputs && Object.keys(rec.inputs).length > 0) {
        inputsStr = Object.entries(rec.inputs).map(([inpId, qty]) => {
          const inpP = PRODUCT_CATALOG[inpId];
          const inpTier = CoreMath.calculateProductionTier(inpId, FACTORY_RECIPES);
          return `${inpP ? inpP.name : inpId} (Tier ${inpTier}) × ${qty}`;
        }).join(', ');
      }

      const bonus = CoreMath.calculateConvergenceBonus(p.id, FACTORY_RECIPES);
      const researchCost = CoreMath.calculateResearchCost(t, bonus);
      const catInfo = RD_CATEGORIES[p.category] || {};

      let unlockStr = '';
      if (t === 0) unlockStr = `Livre desde o início (Extrativismo / Commodities)`;
      else unlockStr = `Pesquisa de P&D — Tier ${t} (Custo base: $${researchCost.toLocaleString('en-US')}${bonus > 0 ? `, Bônus convergência: +$${bonus}` : ''})`;

      let storesStr = stores.length > 0 ? stores.join(', ') : '(nenhuma — produto de uso estritamente industrial)';
      let usedInStr = usedIn.length > 0
        ? usedIn.map(u => `${u.recipeName} (${u.outputName}) [${u.qty} un]`).join('; ')
        : '(nenhum — produto final de consumo)';

      md += `### ${catInfo.icon || '📦'} ${p.name} (Tier ${t})\n`;
      md += `- **ID do Produto:** \`${p.id}\`\n`;
      md += `- **Categoria:** ${p.category} ${p.isIntermediate ? '*(Insumo Industrial)*' : '*(Bem Comercial)*'}\n`;
      md += `- **Onde é obtido:** ${origin}\n`;
      md += `- **Insumos necessários:** ${inputsStr}\n`;
      md += `- **Desbloqueio:** ${unlockStr}\n`;
      md += `- **Vendido em:** ${storesStr}\n`;
      md += `- **Usado como insumo em:** ${usedInStr}\n\n`;
    });

    md += `---\n\n`;
  }

  const outputPath = path.resolve(__dirname, '../docs/wiki/producao.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`✅ Wiki gerada com sucesso em: ${outputPath}`);
}

module.exports = { generateWiki };

if (require.main === module) {
  generateWiki();
}
