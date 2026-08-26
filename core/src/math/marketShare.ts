/**
 * math/marketShare.ts — Cálculo de Market Share por Atratividade Quadrática
 */

export function calculateQuadraticMarketShare(
  playerRating: number,
  competitorRating: number,
  unorganizedBaseRating: number = 25
): { playerShare: number; compShare: number } {
  const pWeight = playerRating > 0 ? Math.pow(playerRating, 2) : 0;
  const cWeight = competitorRating > 0 ? Math.pow(competitorRating, 2) : 0;
  const uWeight = Math.pow(unorganizedBaseRating, 2);

  const total = pWeight + cWeight + uWeight;
  if (total <= 0) return { playerShare: 0, compShare: 0 };

  return {
    playerShare: pWeight / total,
    compShare: cWeight / total
  };
}
