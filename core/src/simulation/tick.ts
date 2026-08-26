/**
 * simulation/tick.ts — Pipeline Diário de Simulação (Função Pura)
 */

import type { GameState, District } from '../types/index.ts';
import { calculateProductRating } from '../math/rating.ts';
import { calculatePriceElasticityFactor } from '../math/elasticity.ts';
import { calculateQuadraticMarketShare } from '../math/marketShare.ts';
import { closeMonth } from './monthClose.ts';

export function tickDay(state: GameState): GameState {
  let dailyGrossRev = 0;
  let dailyGrossCogs = 0;
  let dailyFixedCost = 0;

  const updatedDistricts: District[] = state.districts.map(dist => {
    const updatedDist: District = {
      ...dist,
      playerStore: dist.playerStore ? {
        ...dist.playerStore,
        shelves: { ...dist.playerStore.shelves }
      } : null,
      competitorStore: dist.competitorStore ? {
        ...dist.competitorStore,
        shelves: { ...dist.competitorStore.shelves }
      } : null
    };

    if (updatedDist.playerStore) {
      dailyFixedCost += updatedDist.landRentDaily;
    }

    for (const prodId of Object.keys(state.catalog)) {
      const prodDef = state.catalog[prodId];
      const hasPlayer = updatedDist.playerStore && updatedDist.playerStore.shelves[prodId];
      const hasComp = updatedDist.competitorStore && updatedDist.competitorStore.shelves[prodId];

      if (!hasPlayer && !hasComp) continue;

      const noise = 0.94 + Math.random() * 0.12;
      const baseDemand = updatedDist.population * prodDef.perCapitaDailyDemand * (updatedDist.trafficIndex / 100) * noise;

      let playerRating = 0;
      let playerElast = 1.0;
      if (hasPlayer) {
        const shelf = updatedDist.playerStore!.shelves[prodId];
        playerElast = calculatePriceElasticityFactor(prodDef.necessityIndex, prodDef.standardPrice, shelf.price);
        playerRating = calculateProductRating(prodDef, shelf.price, shelf.quality, state.playerBrandRating[prodId] || 0);
      }

      let compRating = 0;
      if (hasComp) {
        const compShelf = updatedDist.competitorStore!.shelves[prodId];
        compRating = calculateProductRating(prodDef, compShelf.price, compShelf.quality, compShelf.brand);
      }

      const { playerShare, compShare } = calculateQuadraticMarketShare(playerRating, compRating, 25);

      if (hasPlayer) {
        const shelf = updatedDist.playerStore!.shelves[prodId];
        const potentialDemand = Math.floor(baseDemand * playerElast * playerShare);
        const unitsSold = Math.min(shelf.stock, potentialDemand);

        shelf.stock -= unitsSold;
        const rev = unitsSold * shelf.price;
        const cogs = unitsSold * prodDef.baseCost;

        dailyGrossRev += rev;
        dailyGrossCogs += cogs;

        const restockQty = Math.min(shelf.dailyRestock, shelf.maxCapacity - shelf.stock);
        if (restockQty > 0) {
          const restockCost = restockQty * prodDef.baseCost;
          if (state.cash >= restockCost) {
            shelf.stock += restockQty;
          }
        }
      }

      if (hasComp) {
        updatedDist.competitorStore!.lastShare = compShare;
      }
    }

    return updatedDist;
  });

  const nextCash = state.cash + dailyGrossRev - dailyFixedCost;
  const nextMonthRev = state.monthRevenue + dailyGrossRev;
  const nextMonthCogs = state.monthCogs + dailyGrossCogs;
  const nextMonthFixed = state.monthFixedExpenses + dailyFixedCost;

  let nextDay = state.day + 1;
  let nextMonth = state.month;
  let nextYear = state.year;
  let nextState: GameState = {
    ...state,
    day: nextDay,
    month: nextMonth,
    year: nextYear,
    cash: Number(nextCash.toFixed(2)),
    districts: updatedDistricts,
    monthRevenue: Number(nextMonthRev.toFixed(2)),
    monthCogs: Number(nextMonthCogs.toFixed(2)),
    monthFixedExpenses: Number(nextMonthFixed.toFixed(2))
  };

  if (nextDay > 30) {
    nextState = closeMonth(nextState);
  }

  return nextState;
}
