/**
 * math/rating.ts — Cálculo do Product Overall Rating (0–100)
 */

import type { ProductType } from '../types/index.ts';

export function calculatePriceRating(standardPrice: number, currentPrice: number): number {
  if (currentPrice <= 0) return 100;
  const ratio = standardPrice / currentPrice;
  return Math.min(100, Math.max(0, ratio * 50));
}

export function calculateProductRating(
  product: ProductType,
  currentPrice: number,
  currentQuality: number,
  currentBrand: number
): number {
  const qWeight = product.qualityWeight;
  const bWeight = product.brandWeight;
  const pWeight = Math.max(0, 100 - (qWeight + bWeight));

  const priceRating = calculatePriceRating(product.standardPrice, currentPrice);
  const qrClamped = Math.min(100, Math.max(0, currentQuality));
  const brClamped = Math.min(100, Math.max(0, currentBrand));

  const overall = (qrClamped * qWeight + brClamped * bWeight + priceRating * pWeight) / 100;
  return Number(Math.min(100, Math.max(1, overall)).toFixed(2));
}
