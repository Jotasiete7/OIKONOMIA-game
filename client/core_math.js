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
  }
};

// Exporta para ambiente de módulos e navegador global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreMath;
}
if (typeof window !== 'undefined') {
  window.CoreMath = CoreMath;
}