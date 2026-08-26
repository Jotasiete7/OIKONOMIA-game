/**
 * math/brand.ts — Atualização Dinâmica de Brand Rating
 */

export function updateBrandRating(
  currentBrand: number,
  monthlyNetProfit: number
): number {
  let delta = 0;
  if (monthlyNetProfit > 0) {
    delta = Math.floor(1 + Math.random() * 3); // +1 a +3
  } else {
    delta = -1;
  }
  return Math.min(100, Math.max(0, currentBrand + delta));
}
