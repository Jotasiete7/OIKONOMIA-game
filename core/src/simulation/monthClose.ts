/**
 * simulation/monthClose.ts — Fechamento Contábil Mensal & Evolução Estratégica
 */

import type { GameState, MonthlyFinancialReport } from '../types/index.ts';
import { updateBrandRating } from '../math/brand.ts';

export function closeMonth(state: GameState): GameState {
  const netProfit = state.monthRevenue - state.monthCogs - state.monthFixedExpenses;

  const report: MonthlyFinancialReport = {
    month: state.month,
    year: state.year,
    grossRevenue: state.monthRevenue,
    cogs: state.monthCogs,
    fixedRent: state.monthFixedExpenses,
    netProfit: Number(netProfit.toFixed(2)),
    endingCash: state.cash
  };

  // 1. Atualiza Brand Rating
  const updatedBrand: Record<string, number> = {};
  for (const prodId of Object.keys(state.catalog)) {
    const curBrand = state.playerBrandRating[prodId] || 0;
    updatedBrand[prodId] = updateBrandRating(curBrand, netProfit);
  }

  // 2. Reação de Preços da IA
  const updatedDistricts = state.districts.map(dist => {
    if (!dist.competitorStore) return dist;
    const compStore = {
      ...dist.competitorStore,
      shelves: { ...dist.competitorStore.shelves }
    };

    for (const pId of Object.keys(compStore.shelves)) {
      const shelf = compStore.shelves[pId];
      const prodDef = state.catalog[pId];
      if (!prodDef) continue;

      if ((compStore.lastShare || 0.5) < 0.40) {
        shelf.price = Number(Math.max(prodDef.baseCost * 1.1, shelf.price * (0.95 + Math.random() * 0.02)).toFixed(2));
      } else {
        shelf.price = Number(Math.min(prodDef.standardPrice * 1.3, shelf.price * (1.01 + Math.random() * 0.01)).toFixed(2));
      }
    }
    return { ...dist, competitorStore: compStore };
  });

  let nextMonth = state.month + 1;
  let nextYear = state.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }

  return {
    ...state,
    day: 1,
    month: nextMonth,
    year: nextYear,
    playerBrandRating: updatedBrand,
    districts: updatedDistricts,
    monthRevenue: 0,
    monthCogs: 0,
    monthFixedExpenses: 0,
    lastMonthReport: report
  };
}
