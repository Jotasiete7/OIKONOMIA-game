/**
 * math/elasticity.ts — Cálculo do Fator de Elasticidade por Necessity Index
 */

export function calculatePriceElasticityFactor(
  necessityIndex: number,
  standardPrice: number,
  currentPrice: number
): number {
  if (currentPrice <= 0) return 2.5;
  if (standardPrice <= 0) return 1.0;

  const nClamped = Math.min(100, Math.max(0, necessityIndex));
  const elasticityExponent = 2.20 - 1.85 * (nClamped / 100);

  const priceRatio = standardPrice / currentPrice;
  const factor = Math.pow(priceRatio, elasticityExponent);

  return Number(Math.min(3.0, Math.max(0.05, factor)).toFixed(4));
}
