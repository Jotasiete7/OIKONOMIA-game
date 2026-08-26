/**
 * math/logistics.ts — Cálculo de Frete e Roteamento Logístico de Mercadorias
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Calcula a distância Manhattan em malha de quarteirões (tiles)
 */
export function calculateManhattanDistance(p1: Point2D, p2: Point2D): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Calcula o custo de frete unitário entre um fornecedor (Porto/Fábrica) e a loja
 * @param distance Distância em tiles
 * @param ratePerTile Tarifa de frete por tile
 * @param baseFreight Custo fixo de manuseio/despacho
 */
export function calculateUnitFreight(
  distance: number,
  ratePerTile: number = 0.015,
  baseFreight: number = 0.02
): number {
  const freight = baseFreight + distance * ratePerTile;
  return Number(freight.toFixed(3));
}

/**
 * Calcula o Custo Efetivo de Reposição (Landed Cost = Preço FOB/CIF + Frete)
 */
export function calculateLandedCost(
  wholesalePrice: number,
  unitFreight: number
): number {
  return Number((wholesalePrice + unitFreight).toFixed(3));
}
