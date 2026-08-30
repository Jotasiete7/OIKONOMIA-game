/**
 * core_math.js — Motor Matemático Econômico e Logístico de OIKONOMIA
 * Funções puras sem efeitos colaterais para simulação micro e macroeconômica.
 */

const CoreMath = {
  /**
   * Avaliação de Preço (0-100): Razão inversa ao preço padrão de mercado.
   */
  calculatePriceRating(standardPrice, currentPrice) {
    if (currentPrice <= 0) return 100;
    const ratio = standardPrice / currentPrice;
    return Number(Math.min(100, Math.max(0, ratio * 50)).toFixed(2));
  },

  /**
   * Avaliação Geral do Produto (0-100): Ponderação entre Qualidade, Marca e Preço.
   */
  calculateProductRating(product, currentPrice, currentQuality, currentBrand) {
    if (!product) return 50;
    const qWeight = product.qualityWeight || 40;
    const bWeight = product.brandWeight || 20;
    const pWeight = Math.max(0, 100 - (qWeight + bWeight));

    const priceRating = this.calculatePriceRating(product.standardPrice, currentPrice);
    const qrClamped = Math.min(100, Math.max(0, currentQuality || 0));
    const brClamped = Math.min(100, Math.max(0, currentBrand || 0));

    const overall = (qrClamped * qWeight + brClamped * bWeight + priceRating * pWeight) / 100;
    return Number(Math.min(100, Math.max(1, overall)).toFixed(2));
  },

  /**
   * Fator de Elasticidade de Preço por Índice de Necessidade (0.05x a 3.00x).
   */
  calculatePriceElasticityFactor(necessityIndex, standardPrice, currentPrice) {
    if (currentPrice <= 0) return 2.5;
    if (standardPrice <= 0) return 1.0;

    const nClamped = Math.min(100, Math.max(0, necessityIndex || 50));
    const elasticityExponent = 2.20 - 1.85 * (nClamped / 100);

    const priceRatio = standardPrice / currentPrice;
    const factor = Math.pow(priceRatio, elasticityExponent);

    return Number(Math.min(3.0, Math.max(0.05, factor)).toFixed(4));
  },

  /**
   * Divisão Quadrática de Market Share (Atratividade ao Quadrado).
   */
  calculateQuadraticMarketShare(playerRating, competitorRating, unorganizedBaseRating = 25) {
    const pWeight = playerRating > 0 ? Math.pow(playerRating, 2) : 0;
    const cWeight = competitorRating > 0 ? Math.pow(competitorRating, 2) : 0;
    const uWeight = Math.pow(unorganizedBaseRating, 2);

    const total = pWeight + cWeight + uWeight;
    if (total <= 0) return { playerShare: 0, compShare: 0 };

    return {
      playerShare: pWeight / total,
      compShare: cWeight / total
    };
  },

  /**
   * Distância Manhattan em malha ortogonal/isométrica.
   */
  calculateManhattanDistance(p1, p2) {
    if (!p1 || !p2) return 0;
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  },

  /**
   * Custo Unitário de Frete por Distância.
   */
  calculateUnitFreight(distance, ratePerTile = 0.010, baseFreight = 0.02) {
    const freight = baseFreight + distance * ratePerTile;
    return Number(freight.toFixed(3));
  },

  /**
   * Custo de Reposição Efetivo no Destino (Landed Cost = Preço FOB/CIF + Frete).
   */
  calculateLandedCost(wholesalePrice, unitFreight) {
    return Number(((wholesalePrice || 0) + (unitFreight || 0)).toFixed(3));
  },

  /**
   * Custo e Qualidade Resultante de Receita Fabril.
   */
  calculateRecipeOutput(inputs, processingCost = 0, qualityBonus = 5) {
    let totalInputCost = 0;
    let totalWeightedQuality = 0;
    let totalUnits = 0;

    for (const input of inputs) {
      totalInputCost += (input.standardCost || 0) * (input.quantity || 1);
      totalWeightedQuality += (input.quality || 50) * (input.quantity || 1);
      totalUnits += (input.quantity || 1);
    }

    const avgInputQuality = totalUnits > 0 ? totalWeightedQuality / totalUnits : 50;
    const unitCost = Number((totalInputCost + processingCost).toFixed(3));
    const outputQuality = Math.min(100, Math.round(avgInputQuality + qualityBonus));

    return { unitCost, outputQuality };
  },

  /**
   * Custo Diário de Publicidade a partir dos contratos ativos.
   */
  calculateDailyMarketingExpense(activeOutlets) {
    if (!Array.isArray(activeOutlets) || activeOutlets.length === 0) return 0;
    const monthlyTotal = activeOutlets.reduce((sum, o) => sum + (o.monthlyCost || 0), 0);
    return Number((monthlyTotal / 30).toFixed(2));
  },

  /**
   * Atualização Mensal do Brand Rating.
   */
  updateProductBrandWithMarketing(currentBrand, activeOutlets, isProfitable = true) {
    const brand = currentBrand || 20;
    if (!activeOutlets || activeOutlets.length === 0) {
      const decay = isProfitable ? 1 : 2;
      return Math.max(10, brand - decay);
    }

    let totalBoost = activeOutlets.reduce((sum, o) => sum + (o.brandBoostMonthly || 0), 0);
    if (isProfitable) totalBoost += 1;

    const maxCap = Math.max(...activeOutlets.map(o => o.brandCap || 70));
    return Math.min(100, Math.min(maxCap, brand + totalBoost));
  },

  // ═══════════════════════════════════════════════════════════════════
  // P&D — SISTEMA DE PESQUISA & DESENVOLVIMENTO (fiel ao Capitalism II)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Calcula o custo mensal mínimo de pesquisa para um produto.
   * Usa curva exponencial: C = baseCost × e^(2.5 × QR/100)
   * Quanto maior o QR atual, mais cara fica cada unidade de ganho.
   * @param {number} currentQR - QR atual da linha de produção (0-100)
   * @param {number} categoryBaseCost - Custo base da categoria (ex: Eletrônicos = 12000)
   * @returns {number} Custo mensal mínimo em dólares
   */
  calculateRDMonthlyCost(currentQR, categoryBaseCost) {
    const qrClamped = Math.min(100, Math.max(0, currentQR || 50));
    const cost = (categoryBaseCost || 2000) * Math.exp(2.5 * qrClamped / 100);
    return Math.round(cost);
  },

  /**
   * Calcula o ganho de QR no mês baseado na verba alocada vs. mínima necessária.
   * Lei dos Rendimentos Decrescentes: ganho diminui conforme QR se aproxima de 100.
   * Fórmula: ΔQRD = baseGain × (verba/mínimo) × (1 - QR_atual/120)
   * @param {number} currentQR - QR atual (0-100)
   * @param {number} targetQR - QR alvo definido pelo jogador (60-100)
   * @param {number} monthlyBudget - Verba mensal alocada ($)
   * @param {number} baseMonthlyRequired - Custo mensal mínimo para progressão ($)
   * @returns {number} Delta de QR ganho neste mês (float, pode ser 0 se verba insuficiente)
   */
  calculateRDQualityGain(currentQR, targetQR, monthlyBudget, baseMonthlyRequired) {
    if (!monthlyBudget || monthlyBudget <= 0) return 0;
    if (currentQR >= targetQR) return 0;

    const minRequired = baseMonthlyRequired || 1;
    const budgetRatio = Math.min(2.5, monthlyBudget / minRequired); // cap 2.5x aceleração
    const baseGainPerMonth = 3.0; // ganho base com verba mínima: +3 QR/mês

    // Lei dos Rendimentos Decrescentes (espelha o Capitalism)
    const diminishingFactor = Math.max(0, 1 - currentQR / 120);

    const rawGain = baseGainPerMonth * budgetRatio * diminishingFactor;
    const remaining = targetQR - currentQR;
    return Number(Math.min(rawGain, remaining).toFixed(3));
  },

  /**
   * Propaga gradualmente o QR da linha de produção para a gôndola da loja.
   * O novo QR só aparece na prateleira conforme o estoque antigo é consumido.
   * Fiel ao Capitalism: o consumidor só "sente" a melhoria quando recebe produto novo.
   * @param {number} shelfQR - QR atual na gôndola (0-100)
   * @param {number} factoryQR - QR atual da linha de produção da fábrica (0-100)
   * @param {number} soldToday - Unidades vendidas hoje nessa gôndola
   * @param {number} shelfCapacity - Capacidade máxima da gôndola (maxCapacity)
   * @returns {number} Novo QR da gôndola após a propagação
   */
  propagateQualityToShelf(shelfQR, factoryQR, soldToday, shelfCapacity) {
    if (!shelfCapacity || shelfCapacity <= 0) return shelfQR;
    if (Math.abs(factoryQR - shelfQR) < 0.1) return shelfQR; // já alinhado

    const turnoverRate = Math.min(1, (soldToday || 0) / shelfCapacity);
    const newQR = shelfQR + (factoryQR - shelfQR) * turnoverRate;
    return Number(Math.min(100, Math.max(0, newQR)).toFixed(2));
  },

  // ═══════════════════════════════════════════════════════════════════
  // PROGRESSÃO ESTRUTURAL DE P&D — GRAFO DE RECEITAS & TECH TREE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Calcula recursivamente a profundidade de produção (Tier 0 a 5) de um produto.
   * Tier 0 = Matéria-prima pura (sem receita/inputs).
   * Tier N = 1 + max(Tier dos seus ingredientes diretos).
   */
  calculateProductionTier(productId, recipes, cache = {}) {
    if (cache[productId] !== undefined) return cache[productId];
    
    // Suporta array de receitas ou dicionário indexado por outputProdId/id
    let recipe = null;
    if (Array.isArray(recipes)) {
      recipe = recipes.find(r => r.outputProdId === productId || r.id === productId);
    } else if (recipes && typeof recipes === 'object') {
      recipe = recipes[productId] || Object.values(recipes).find(r => r.outputProdId === productId || r.id === productId);
    }

    if (!recipe || !recipe.inputs || Object.keys(recipe.inputs).length === 0) {
      cache[productId] = 0; // Matéria-prima de extração (Tier 0)
      return 0;
    }

    const ingredientIds = Object.keys(recipe.inputs);
    if (ingredientIds.length === 0) {
      cache[productId] = 0;
      return 0;
    }

    let maxIngredientTier = 0;
    for (const ingId of ingredientIds) {
      const ingTier = this.calculateProductionTier(ingId, recipes, cache);
      if (ingTier > maxIngredientTier) {
        maxIngredientTier = ingTier;
      }
    }

    cache[productId] = maxIngredientTier + 1;
    return cache[productId];
  },

  /**
   * Coleta recursivamente todas as matérias-primas raiz (Tier 0) de um produto.
   */
  getRootBranches(productId, recipes, visited = new Set()) {
    if (visited.has(productId)) return new Set();
    visited.add(productId);

    let recipe = null;
    if (Array.isArray(recipes)) {
      recipe = recipes.find(r => r.outputProdId === productId || r.id === productId);
    } else if (recipes && typeof recipes === 'object') {
      recipe = recipes[productId] || Object.values(recipes).find(r => r.outputProdId === productId || r.id === productId);
    }

    if (!recipe || !recipe.inputs || Object.keys(recipe.inputs).length === 0) {
      return new Set([productId]);
    }

    const roots = new Set();
    for (const ingId of Object.keys(recipe.inputs)) {
      const subRoots = this.getRootBranches(ingId, recipes, visited);
      for (const r of subRoots) roots.add(r);
    }
    return roots;
  },

  /**
   * Bônus de convergência para produtos complexos que integram múltiplos ramos de insumos.
   */
  calculateConvergenceBonus(productId, recipes, baseCost = 60) {
    const roots = this.getRootBranches(productId, recipes);
    if (roots.size <= 1) return 0;
    return Math.round((roots.size - 1) * baseCost * 1.5);
  },

  /**
   * Calcula o custo total de pontos de pesquisa para desbloquear um produto.
   * Fórmula exponencial por tier: C = round(60 * 2.4^(tier - 1)) + bônus de convergência.
   */
  calculateResearchCost(tier, convergenceBonus = 0, baseCost = 60, multiplier = 2.4) {
    if (tier <= 0) return 0;
    const tierCost = Math.round(baseCost * Math.pow(multiplier, tier - 1));
    return tierCost + (convergenceBonus || 0);
  },

  /**
   * Valida se todos os ingredientes de tier N-1 estão desbloqueados antes de permitir a pesquisa.
   */
  canResearch(productId, unlockedSet, recipes) {
    if (!unlockedSet) return true;
    
    let recipe = null;
    if (Array.isArray(recipes)) {
      recipe = recipes.find(r => r.outputProdId === productId || r.id === productId);
    } else if (recipes && typeof recipes === 'object') {
      recipe = recipes[productId] || Object.values(recipes).find(r => r.outputProdId === productId || r.id === productId);
    }

    if (!recipe || !recipe.inputs || Object.keys(recipe.inputs).length === 0) {
      return true; // Matéria-prima sempre disponível
    }

    // Todos os ingredientes devem estar desbloqueados ou ser Tier 0
    return Object.keys(recipe.inputs).every(ingId => {
      if (unlockedSet.has(ingId)) return true;
      const tier = this.calculateProductionTier(ingId, recipes);
      return tier === 0;
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // CURVA ASSINTÓTICA DE QUALIDADE (QR) SIMÉTRICA (PLAYER & IA)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Custo por ponto de QR com explosão assintótica contínua rumo a 100.
   */
  calculateQRUpgradeCost(currentQR, baseCost = 40, exponent = 1.8) {
    const qrClamped = Math.max(0, currentQR || 0);
    const distanceToMax = Math.max(100 - qrClamped, 0.0001); // epsilon apenas para evitar divisão por zero exata
    const cost = baseCost * Math.pow(qrClamped / distanceToMax, exponent);
    return Number(cost.toFixed(2));
  },

  /**
   * Teto de ganho mensal de QR perto do limite máximo (Rate Cap).
   * Sem piso mínimo artificial: se o ganho for 0.0001, retorna 0.0001.
   */
  calculateMaxMonthlyQRGain(currentQR, maxMonthlyGain = 3.0, decayExponent = 2.2) {
    const proximityToMax = Math.min(1, Math.max(0, (currentQR || 0) / 100));
    const maxGain = maxMonthlyGain * (1 - Math.pow(proximityToMax, decayExponent));
    return Number(maxGain.toFixed(5));
  },

  /**
   * Aplicação unificada e simétrica de evolução assintótica de QR no fechamento do mês.
   * Totalmente contínua, sem bandas discretas e sem pisos mínimos.
   */
  applyQRAsymptoticGrowth(currentQR, monthlyBudget) {
    if (!monthlyBudget || monthlyBudget <= 0) return 0;
    const costPerPoint = this.calculateQRUpgradeCost(currentQR);
    if (costPerPoint <= 0) return 0;
    const maxGain = this.calculateMaxMonthlyQRGain(currentQR);
    const affordableGain = monthlyBudget / costPerPoint;
    const actualGain = Math.min(maxGain, affordableGain);
    return Number(actualGain.toFixed(5));
  },

  /**
   * Camada puramente visual e informativa de Tech Levels (Níveis 1 a 5).
   * Não interfere nas fórmulas matemáticas subjacentes.
   */
  getTechLevelLabel(qr) {
    const q = Number(qr) || 0;
    if (q >= 95) return { level: 5, label: 'Estado da Arte Global', icon: '👑', color: 'text-amber-300 border-amber-500 bg-amber-950/60' };
    if (q >= 85) return { level: 4, label: 'Vanguarda Tecnológica', icon: '💎', color: 'text-purple-300 border-purple-500 bg-purple-950/60' };
    if (q >= 75) return { level: 3, label: 'Grau Superior', icon: '🥇', color: 'text-cyan-300 border-cyan-500 bg-cyan-950/60' };
    if (q >= 65) return { level: 2, label: 'Qualidade Comercial', icon: '🥈', color: 'text-emerald-300 border-emerald-500 bg-emerald-950/60' };
    return { level: 1, label: 'Padrão Genérico', icon: '🥉', color: 'text-slate-300 border-slate-600 bg-slate-900/60' };
  }
};

// Exporta para ambiente de módulos e navegador global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreMath;
}
if (typeof window !== 'undefined') {
  window.CoreMath = CoreMath;
}