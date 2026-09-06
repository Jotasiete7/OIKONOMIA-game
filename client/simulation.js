/**
 * simulation.js — Motor de Simulação Contínua (Ticks Diários & Fechamento Mensal)
 * OIKONOMIA v0.8.4
 */

import CoreMath from './core_math.js';
import MacroCycleSystem from './macro_cycle_system.js';
import { PRODUCT_CATALOG, FACTORY_RECIPES, MEDIA_OUTLETS } from './data_catalogs.js';
import GameState from './game_state.js';
import AdvisorSystem from './advisor_system.js';

export function calcPriceRating(standardPrice, price) {
  return CoreMath.calculatePriceRating(standardPrice, price);
}

export function calcProductRating(prod, price, quality, brand) {
  return CoreMath.calculateProductRating(prod, price, quality, brand);
}

export function calcElasticity(necessityIndex, standardPrice, price, quality = 50) {
  return CoreMath.calculatePriceElasticityFactor(necessityIndex, standardPrice, price, quality);
}

/**
 * Resolve o contexto de execução da simulação (permite injeção de dependências em testes headless ou defaults de runtime)
 */
export function resolveSimulationContext(customContext = {}) {
  const isBrowser = typeof window !== 'undefined';
  const state = customContext.state || (isBrowser && window.GameState ? window.GameState : GameState);
  const worldGrid = customContext.worldGrid || (isBrowser && window.worldGrid ? window.worldGrid : []);
  const activeFacilitySet = customContext.activeFacilitySet || (isBrowser && window.activeFacilitySet ? window.activeFacilitySet : new Map());
  const addLog = customContext.addLog || (isBrowser && window.addLog ? window.addLog : () => {});
  const getDefaultSupplierForInput = customContext.getDefaultSupplierForInput || (isBrowser && window.getDefaultSupplierForInput ? window.getDefaultSupplierForInput : null);
  const propagateQualityRD = customContext.propagateQualityRD || (isBrowser && window.propagateQualityRD ? window.propagateQualityRD : () => {});
  const checkAutoSave = customContext.checkAutoSave || (isBrowser && window.checkAutoSave ? window.checkAutoSave : () => {});
  const checkTutorialProgress = customContext.checkTutorialProgress || (isBrowser && window.checkTutorialProgress ? window.checkTutorialProgress : () => {});
  const updateUI = customContext.updateUI || (isBrowser && window.updateUI ? window.updateUI : () => {});
  const calculateCorporateNetWorth = customContext.calculateCorporateNetWorth || (isBrowser && window.calculateCorporateNetWorth ? window.calculateCorporateNetWorth : () => ({ netWorth: state.cash, totalDebt: 0 }));
  const openInsolvencyModal = customContext.openInsolvencyModal || (isBrowser && window.openInsolvencyModal ? window.openInsolvencyModal : () => {});
  const showBankruptcyModal = customContext.showBankruptcyModal || (isBrowser && window.showBankruptcyModal ? window.showBankruptcyModal : () => {});
  const processRDProgress = customContext.processRDProgress || (isBrowser && window.processRDProgress ? window.processRDProgress : () => {});
  const renderFacilityPanel = customContext.renderFacilityPanel || (isBrowser && window.renderFacilityPanel ? window.renderFacilityPanel : () => {});
  const getActiveManagedTile = customContext.getActiveManagedTile || (isBrowser ? () => window.activeManagedTile : () => null);
  const processBankingInstallments = customContext.processBankingInstallments || (isBrowser && window.processBankingInstallments ? window.processBankingInstallments : () => {});

  return {
    state,
    worldGrid,
    activeFacilitySet,
    addLog,
    getDefaultSupplierForInput,
    propagateQualityRD,
    checkAutoSave,
    checkTutorialProgress,
    updateUI,
    calculateCorporateNetWorth,
    openInsolvencyModal,
    showBankruptcyModal,
    processRDProgress,
    renderFacilityPanel,
    getActiveManagedTile,
    processBankingInstallments,
  };
}

/**
 * Executa 1 dia de simulação contínua (Consumo, Produção, Varejo, Finanças e Calendário)
 */
export function simulateDay(customContext = {}) {
  const ctx = resolveSimulationContext(customContext);
  const {
    state,
    worldGrid,
    activeFacilitySet,
    addLog,
    getDefaultSupplierForInput,
    propagateQualityRD,
    checkAutoSave,
    checkTutorialProgress,
    updateUI
  } = ctx;

  let dailyRev = 0, dailyCogs = 0, dailyFixed = 0;

  // Marketing (contrato por contrato — já é O(k))
  let dailyMarketing = 0;
  if (state.activeMarketingContracts) {
    for (const contractKey of state.activeMarketingContracts) {
      const [outletId, prodId] = contractKey.split('::');
      const outlet = MEDIA_OUTLETS.find(o => o.id === outletId);
      if (outlet) {
        dailyMarketing += (prodId === '__institutional__' ? outlet.institutionalMonthlyCost : outlet.monthlyCost) / 30;
      }
    }
  }

  // === SPARSE INDEX: Simulação Diária Estruturada em Fases Sequenciais ===

  // FASE 1: Custos Fixos & OPEX Diário (Aluguel do Solo + Salários & Manutenção)
  for (const tile of activeFacilitySet.values()) {
    const d = tile.district || { landRentDaily: 50, population: 50000, trafficIndex: 50 };
    tile.monthlyMetrics = tile.monthlyMetrics || { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
    let tileDailyOpex = 0;

    if (tile.store) {
      const shelvesCount = tile.store.shelves ? Math.max(1, Object.keys(tile.store.shelves).length) : 1;
      const clerkWages = shelvesCount * 40; // $40/dia por gôndola ativa
      const op = (tile.store.dailyRent || d.landRentDaily) + clerkWages;
      dailyFixed += op;
      tileDailyOpex += op;
    }
    if (tile.mine) {
      const isFull = (tile.mine.stock || 0) >= (tile.mine.maxCapacity || 8000);
      const mineWages = isFull ? 65 : 180; // Standby ($65/dia vs $180/dia)
      const op = d.landRentDaily + mineWages;
      dailyFixed += op;
      tileDailyOpex += op;
    }
    if (tile.farm) {
      const isFull = (tile.farm.stock || 0) >= (tile.farm.maxCapacity || 5000);
      const farmWages = isFull ? 45 : 120; // Standby ($45/dia vs $120/dia)
      const op = d.landRentDaily + farmWages;
      dailyFixed += op;
      tileDailyOpex += op;
    }
    if (tile.factory) {
      const lines = tile.factory.lines ? Object.values(tile.factory.lines) : [];
      let factoryWages = 0;
      if (lines.length === 0) {
        factoryWages = 200;
      } else {
        for (const line of lines) {
          const isFull = (line.finishedStock || 0) >= (line.maxStock || 3000);
          factoryWages += isFull ? 70 : 200; // Standby ($70/dia vs $200/dia)
        }
      }
      const op = d.landRentDaily + factoryWages;
      dailyFixed += op;
      tileDailyOpex += op;
    }
    if (tile.rdCenter) {
      const rdMaintenance = 150; // $150/dia
      const op = (tile.rdCenter.dailyRent || Math.round(d.landRentDaily * 1.2)) + rdMaintenance;
      dailyFixed += op;
      tileDailyOpex += op;
    }
    if (tile.warehouse) {
      const whMaintenance = tile.warehouse.dailyMaintenance || 60; // $60/dia de manutenção logística
      const op = (tile.warehouse.dailyRent || Math.round(d.landRentDaily * 1.1)) + whMaintenance;
      dailyFixed += op;
      tileDailyOpex += op;
    }
    tile.monthlyMetrics.opex += tileDailyOpex;
  }

  // FASE 2: Produção Primária (Extração Mineral & Colheita Agropecuária)
  for (const tile of activeFacilitySet.values()) {
    if (tile.mine) {
      tile.mine.stock = Math.min(tile.mine.maxCapacity || 8000, (tile.mine.stock || 0) + (tile.mine.dailyYield || 0));
    }
    if (tile.farm) {
      const farm = tile.farm;
      const isLivestock = ['poultry', 'raw_milk', 'cattle', 'pigs', 'wool'].includes(farm.cropId) || ['farm_poultry', 'farm_dairy', 'farm_cattle', 'farm_pigs', 'farm_sheep'].includes(farm.farmTypeId);
      const agroSeasonal = (!isLivestock && CoreMath.getSeasonalAgroYieldMultiplier)
        ? CoreMath.getSeasonalAgroYieldMultiplier(state.month)
        : 1.0;
      let effectiveYield = Math.round((farm.dailyYield || 500) * agroSeasonal);
      let effectiveQR = farm.quality || 60;

      if (isLivestock && farm.feedConfig && farm.feedConfig.active) {
        const feedNeeded = Math.ceil((farm.dailyYield || 500) * 0.20);
        let feedSupplied = false;

        if (farm.feedConfig.supplierId?.startsWith('farm_')) {
          const parts = farm.feedConfig.supplierId.split('_');
          const fx = Number(parts[1]), fy = Number(parts[2]);
          const feedFarmTile = worldGrid[fx]?.[fy];
          if (feedFarmTile?.farm && feedFarmTile.farm.stock >= feedNeeded) {
            feedFarmTile.farm.stock = Math.max(0, feedFarmTile.farm.stock - feedNeeded);
            feedSupplied = true;
          } else {
            // Suprimento transparente do armazém se a fazenda de grãos teve seu excedente centralizado
            const grainId = farm.feedConfig.grainProdId || 'wheat';
            for (const whTile of activeFacilitySet.values()) {
              const whItem = whTile.warehouse?.inventory?.[grainId];
              if (whItem && whItem.stock >= feedNeeded) {
                whItem.stock -= feedNeeded;
                feedSupplied = true;
                break;
              }
            }
          }
        } else if (farm.feedConfig.supplierId?.startsWith('warehouse_')) {
          const parts = farm.feedConfig.supplierId.split('_');
          const wx = Number(parts[1]), wy = Number(parts[2]);
          const whTile = worldGrid[wx]?.[wy];
          const grainId = farm.feedConfig.grainProdId || 'wheat';
          const whItem = whTile?.warehouse?.inventory?.[grainId];
          if (whItem && whItem.stock >= feedNeeded) {
            whItem.stock -= feedNeeded;
            feedSupplied = true;
          }
        } else if (farm.feedConfig.supplierId?.startsWith('port_') || farm.feedConfig.supplierId?.startsWith('primary_') || farm.feedConfig.supplierId?.startsWith('port')) {
          const feedCost = feedNeeded * (farm.feedConfig.landedCost || 0.60);
          if (state.cash >= feedCost) {
            state.cash -= feedCost;
            dailyFixed += feedCost;
            feedSupplied = true;
          }
        } else {
          feedSupplied = true;
        }

        if (feedSupplied) {
          effectiveYield = Math.round((farm.dailyYield || 500) * 1.5);
          effectiveQR = Math.min(100, (farm.quality || 60) + 15);
        } else if (Math.random() < 0.08) {
          addLog(`⚠ ${farm.name}: Falta de ração de grãos. Produção operando em ritmo básico de pasto.`, 'text-amber-400');
        }
      }

      farm.effectiveYield = effectiveYield;
      farm.effectiveQuality = effectiveQR;
      farm.stock = Math.min(farm.maxCapacity || 5000, (farm.stock || 0) + effectiveYield);
    }
  }

  // FASE 3: Manufatura Secundária (Fábricas consomem insumos e geram produtos acabados)
  for (const tile of activeFacilitySet.values()) {
    if (tile.factory && tile.factory.lines) {
      for (const line of Object.values(tile.factory.lines)) {
        const rec = FACTORY_RECIPES.find(r => r.id === line.recipeId);
        let productionRatio = 1.0;

        if (rec && rec.inputs) {
          line.inputsConfig = line.inputsConfig || {};
          for (const [inpId, qtyRatio] of Object.entries(rec.inputs)) {
            if (!line.inputsConfig[inpId] && getDefaultSupplierForInput) {
              line.inputsConfig[inpId] = getDefaultSupplierForInput(inpId, tile);
            }
            const cfg = line.inputsConfig[inpId];
            const neededUnits = line.dailyCapacity * qtyRatio;

            if (cfg && cfg.supplierId) {
              if (cfg.supplierId.startsWith('farm_')) {
                const parts = cfg.supplierId.split('_');
                const fx = Number(parts[1]), fy = Number(parts[2]);
                const farmTile = worldGrid[fx]?.[fy];
                let avail = farmTile?.farm?.stock || 0;

                // Fallback para armazém holding se a fazenda de origem teve excedente centralizado
                let fallbackWhItem = null;
                if (avail < neededUnits) {
                  for (const whTile of activeFacilitySet.values()) {
                    if (whTile.warehouse?.inventory?.[inpId]?.stock > 0) {
                      fallbackWhItem = whTile.warehouse.inventory[inpId];
                      avail += fallbackWhItem.stock;
                      break;
                    }
                  }
                }

                if (avail < neededUnits) {
                  productionRatio = Math.min(productionRatio, avail / Math.max(1, neededUnits));
                }
                const toConsume = Math.floor(neededUnits * productionRatio);
                if (farmTile?.farm && farmTile.farm.stock > 0) {
                  const fromFarm = Math.min(farmTile.farm.stock, toConsume);
                  farmTile.farm.stock -= fromFarm;
                  const rem = toConsume - fromFarm;
                  if (rem > 0 && fallbackWhItem) {
                    fallbackWhItem.stock = Math.max(0, fallbackWhItem.stock - rem);
                  }
                } else if (fallbackWhItem) {
                  fallbackWhItem.stock = Math.max(0, fallbackWhItem.stock - toConsume);
                }
              } else if (cfg.supplierId.startsWith('mine_')) {
                const parts = cfg.supplierId.split('_');
                const mx = Number(parts[1]), my = Number(parts[2]);
                const mineTile = worldGrid[mx]?.[my];
                let avail = mineTile?.mine?.stock || 0;

                let fallbackWhItem = null;
                if (avail < neededUnits) {
                  for (const whTile of activeFacilitySet.values()) {
                    if (whTile.warehouse?.inventory?.[inpId]?.stock > 0) {
                      fallbackWhItem = whTile.warehouse.inventory[inpId];
                      avail += fallbackWhItem.stock;
                      break;
                    }
                  }
                }

                if (avail < neededUnits) {
                  productionRatio = Math.min(productionRatio, avail / Math.max(1, neededUnits));
                }
                const toConsume = Math.floor(neededUnits * productionRatio);
                if (mineTile?.mine && mineTile.mine.stock > 0) {
                  const fromMine = Math.min(mineTile.mine.stock, toConsume);
                  mineTile.mine.stock -= fromMine;
                  const rem = toConsume - fromMine;
                  if (rem > 0 && fallbackWhItem) {
                    fallbackWhItem.stock = Math.max(0, fallbackWhItem.stock - rem);
                  }
                } else if (fallbackWhItem) {
                  fallbackWhItem.stock = Math.max(0, fallbackWhItem.stock - toConsume);
                }
              } else if (cfg.supplierId.startsWith('factory_')) {
                const parts = cfg.supplierId.split('_');
                const fx = Number(parts[1]), fy = Number(parts[2]), rId = parts.slice(3).join('_');
                const facTile = worldGrid[fx]?.[fy];
                const sourceLine = facTile?.factory?.lines[rId];
                let avail = sourceLine?.finishedStock || 0;

                let fallbackWhItem = null;
                if (avail < neededUnits) {
                  for (const whTile of activeFacilitySet.values()) {
                    if (whTile.warehouse?.inventory?.[inpId]?.stock > 0) {
                      fallbackWhItem = whTile.warehouse.inventory[inpId];
                      avail += fallbackWhItem.stock;
                      break;
                    }
                  }
                }

                if (avail < neededUnits) {
                  productionRatio = Math.min(productionRatio, avail / Math.max(1, neededUnits));
                }
                const toConsume = Math.floor(neededUnits * productionRatio);
                if (sourceLine && sourceLine.finishedStock > 0) {
                  const fromLine = Math.min(sourceLine.finishedStock, toConsume);
                  sourceLine.finishedStock -= fromLine;
                  const rem = toConsume - fromLine;
                  if (rem > 0 && fallbackWhItem) {
                    fallbackWhItem.stock = Math.max(0, fallbackWhItem.stock - rem);
                  }
                } else if (fallbackWhItem) {
                  fallbackWhItem.stock = Math.max(0, fallbackWhItem.stock - toConsume);
                }
              } else if (cfg.supplierId.startsWith('warehouse_')) {
                const parts = cfg.supplierId.split('_');
                const wx = Number(parts[1]), wy = Number(parts[2]);
                const whTile = worldGrid[wx]?.[wy];
                const whItem = whTile?.warehouse?.inventory?.[inpId];
                if (whItem) {
                  if (whItem.stock < neededUnits) {
                    productionRatio = Math.min(productionRatio, whItem.stock / Math.max(1, neededUnits));
                  }
                  const consumed = Math.min(whItem.stock, Math.floor(neededUnits * productionRatio));
                  whItem.stock = Math.max(0, whItem.stock - consumed);
                }
              }
            }
          }
        }

        const actualOutput = Math.floor(line.dailyCapacity * productionRatio);
        line.finishedStock = Math.min(line.maxStock, line.finishedStock + actualOutput);
      }
    }
  }

  // FASE 4: Varejo, Demanda & Reposição com Smart Sourcing Fallback
  for (const tile of activeFacilitySet.values()) {
    if (tile.store) {
      const d = tile.district || { landRentDaily: 50, population: 50000, trafficIndex: 50 };
      for (const [prodId, shelf] of Object.entries(tile.store.shelves)) {
        const prod = PRODUCT_CATALOG[prodId];
        if (!prod) continue;
        const noise = 0.94 + Math.random() * 0.12;
        const seasonalMult = CoreMath.getSeasonalDemandMultiplier
          ? CoreMath.getSeasonalDemandMultiplier(prodId, state.month, prod.category)
          : 1.0;
        const macroDemandMult = MacroCycleSystem ? MacroCycleSystem.getDemandMultiplier(state.year) : 1.0;
        const macroWholesaleMult = MacroCycleSystem ? MacroCycleSystem.getWholesaleCostMultiplier(state.year) : 1.0;
        const baseDem = d.population * prod.perCapitaDailyDemand * (d.trafficIndex / 100) * noise * seasonalMult * macroDemandMult;
        const elast = calcElasticity(prod.necessityIndex, prod.standardPrice, shelf.price, shelf.quality);
        const brand = (state.playerBrandRating && state.playerBrandRating[prodId]) || 20;
        const rating = calcProductRating(prod, shelf.price, shelf.quality, brand);

        let compRating = 0;
        const nb = worldGrid[tile.x+1]?.[tile.y]?.competitor || worldGrid[tile.x]?.[tile.y+1]?.competitor || worldGrid[tile.x-1]?.[tile.y]?.competitor || worldGrid[tile.x]?.[tile.y-1]?.competitor || worldGrid[tile.x]?.[tile.y]?.competitor;
        if (nb?.shelves?.[prodId]) {
          const cs = nb.shelves[prodId];
          compRating = calcProductRating(prod, cs.price, cs.quality, cs.brand || 30);
        }

        const { playerShare: share, compShare } = CoreMath.calculateQuadraticMarketShare(rating, compRating, 25);
        if (nb) {
          nb.lastShare = compShare;
        }
        const rawDemand = baseDem * elast * share;
        const potDemand = Math.floor(rawDemand) + (Math.random() < (rawDemand % 1) ? 1 : 0);
        const sold = Math.min(shelf.stock, potDemand);

        if (shelf.stock === 0 && potDemand > 5 && Math.random() < 0.15) {
          addLog(`⚠ Stockout de "${prod.name}" na ${tile.store?.name ?? ''}!`, 'text-amber-400');
        }

        shelf.stock = Math.max(0, shelf.stock - sold);
        const soldRev = sold * shelf.price;
        const isInternalSupplier = !!(shelf.supplierId?.startsWith('farm_') || shelf.supplierId?.startsWith('factory_') || shelf.supplierId?.startsWith('warehouse_') || shelf.supplierId?.startsWith('mine_'));
        const unitCogs = isInternalSupplier 
          ? (shelf.landedCost || prod.baseCost || 1.0) 
          : (shelf.landedCost || prod.baseCost || 1.0) * macroWholesaleMult;
        const soldCogs = sold * unitCogs;
        dailyRev  += soldRev;
        dailyCogs += soldCogs;
        tile.monthlyMetrics.revenue += soldRev;
        tile.monthlyMetrics.cogs += soldCogs;

        // Reposição Inteligente: supre da origem e complementa do armazém se a fazenda/fábrica foi coletada
        const effectiveRestockRate = Math.round(shelf.dailyRestock * macroDemandMult);
        const restock = Math.min(effectiveRestockRate, shelf.maxCapacity - shelf.stock);
        if (restock > 0) {
          let deliverUnits = 0;
          if (shelf.supplierId?.startsWith('farm_')) {
            const parts = shelf.supplierId.split('_');
            const fx = Number(parts[1]), fy = Number(parts[2]);
            const farmTile = worldGrid[fx]?.[fy];
            if (farmTile?.farm && farmTile.farm.stock > 0) {
              deliverUnits = Math.min(farmTile.farm.stock, restock);
              farmTile.farm.stock = Math.max(0, farmTile.farm.stock - deliverUnits);
            }
            // Fallback transparente: se o armazém recolheu da fazenda, supre do armazém!
            if (deliverUnits < restock) {
              const needed = restock - deliverUnits;
              for (const whTile of activeFacilitySet.values()) {
                const whItem = whTile.warehouse?.inventory?.[prodId];
                if (whItem && whItem.stock > 0) {
                  const fromWh = Math.min(whItem.stock, needed);
                  whItem.stock -= fromWh;
                  deliverUnits += fromWh;
                  if (deliverUnits >= restock) break;
                }
              }
            }
          } else if (shelf.supplierId?.startsWith('factory_')) {
            const parts = shelf.supplierId.split('_');
            const fx = Number(parts[1]), fy = Number(parts[2]), rId = parts.slice(3).join('_');
            const facTile = worldGrid[fx]?.[fy];
            const sourceLine = facTile?.factory?.lines[rId];
            if (sourceLine && sourceLine.finishedStock > 0) {
              deliverUnits = Math.min(sourceLine.finishedStock, restock);
              sourceLine.finishedStock = Math.max(0, sourceLine.finishedStock - deliverUnits);
            }
            // Fallback transparente para produto no armazém
            if (deliverUnits < restock) {
              const needed = restock - deliverUnits;
              for (const whTile of activeFacilitySet.values()) {
                const whItem = whTile.warehouse?.inventory?.[prodId];
                if (whItem && whItem.stock > 0) {
                  const fromWh = Math.min(whItem.stock, needed);
                  whItem.stock -= fromWh;
                  deliverUnits += fromWh;
                  if (deliverUnits >= restock) break;
                }
              }
            }
          } else if (shelf.supplierId?.startsWith('warehouse_')) {
            const parts = shelf.supplierId.split('_');
            const wx = Number(parts[1]), wy = Number(parts[2]);
            const whTile = worldGrid[wx]?.[wy];
            const whItem = whTile?.warehouse?.inventory?.[prodId];
            if (whItem) {
              deliverUnits = Math.min(whItem.stock, restock);
              whItem.stock = Math.max(0, whItem.stock - deliverUnits);
            }
          } else {
            // Porto marítimo
            deliverUnits = restock;
          }

          if (deliverUnits > 0) {
            if (isInternalSupplier) {
              const freightCost = deliverUnits * (shelf.unitFreight || 0.01);
              state.cash -= freightCost;
              shelf.stock += deliverUnits;
            } else {
              const rc = deliverUnits * unitCogs;
              if (state.cash >= rc) {
                state.cash -= rc;
                shelf.stock += deliverUnits;
              } else if (state.cash > 0) {
                const affordUnits = Math.max(1, Math.floor(state.cash / unitCogs));
                const actualDeliver = Math.min(deliverUnits, affordUnits);
                state.cash -= actualDeliver * unitCogs;
                shelf.stock += actualDeliver;
              }
            }
          }
        }
      }
    }

    // Competidores (apenas tiles com competitor no índice)
    if (tile.competitor?.shelves) {
      for (const [pId, cs] of Object.entries(tile.competitor.shelves)) {
        const prod = PRODUCT_CATALOG[pId];
        if (!prod) continue;
        
        const playerNb = worldGrid[tile.x+1]?.[tile.y]?.store || worldGrid[tile.x]?.[tile.y+1]?.store || worldGrid[tile.x-1]?.[tile.y]?.store || worldGrid[tile.x]?.[tile.y-1]?.store;
        let playerRating = 0;
        if (playerNb?.shelves?.[pId]) {
          const ps = playerNb.shelves[pId];
          const brand = (state.playerBrandRating && state.playerBrandRating[pId]) || 20;
          playerRating = calcProductRating(prod, ps.price, ps.quality, brand);
        }

        const cR = calcProductRating(prod, cs.price, cs.quality, cs.brand || 30);
        const { compShare } = CoreMath.calculateQuadraticMarketShare(playerRating, cR, 25);
        tile.competitor.lastShare = compShare;
      }
    }
  }

  // FASE 5: Centros de Distribuição & Armazéns Logísticos (Coleta de Excedente & Compras Portuárias)
  for (const tile of activeFacilitySet.values()) {
    if (tile.warehouse) {
      const wh = tile.warehouse;
      wh.inventory = wh.inventory || {};
      let totalCurrentStock = Object.values(wh.inventory).reduce((sum, item) => sum + (item.stock || 0), 0);
      const freeCapacity = Math.max(0, (wh.maxCapacity || 25000) - totalCurrentStock);

      const phaseInfo = (typeof MacroCycleSystem !== 'undefined' && MacroCycleSystem.getPhaseInfo) 
        ? MacroCycleSystem.getPhaseInfo(state.year) 
        : null;
      const macroPhase = phaseInfo ? (phaseInfo.code || '').toLowerCase() : 'boom';
      const isDiscountCycle = (macroPhase === 'recession' || macroPhase === 'depression');

      for (const [prodId, item] of Object.entries(wh.inventory)) {
        if (!item) continue;
        item.stock = item.stock || 0;
        item.avgUnitCost = item.avgUnitCost || 1.0;
        item.quality = item.quality || 60;

        // 1. Coleta Inbound do Excedente Diário das fontes próprias (após atendimento do consumo local)
        const maxQuota = (item.maxQuota && item.maxQuota > 0) ? item.maxQuota : (wh.maxCapacity || 25000);
        let quotaRoom = Math.max(0, maxQuota - item.stock);

        if (item.collectMode === 'all_own' && freeCapacity > 0 && quotaRoom > 0) {
          for (const srcTile of activeFacilitySet.values()) {
            if (freeCapacity <= 0 || quotaRoom <= 0) break;

            // Fazenda própria produzindo este item
            if (srcTile.farm && (srcTile.farm.cropId === prodId || (prodId === 'eggs' && srcTile.farm.cropId === 'poultry'))) {
              const avail = srcTile.farm.stock || 0;
              if (avail > 0) {
                const toCollect = Math.min(avail, freeCapacity, quotaRoom);
                if (toCollect > 0) {
                  srcTile.farm.stock -= toCollect;

                  const oldStock = item.stock;
                  const newStock = oldStock + toCollect;
                  const srcCost = srcTile.farm.dailyOperatingCost || 0.45;
                  const srcQR = srcTile.farm.effectiveQuality || srcTile.farm.quality || 60;

                  item.avgUnitCost = newStock > 0 ? Number((((oldStock * item.avgUnitCost) + (toCollect * srcCost)) / newStock).toFixed(2)) : srcCost;
                  item.quality = newStock > 0 ? Math.round(((oldStock * item.quality) + (toCollect * srcQR)) / newStock) : srcQR;
                  item.stock = newStock;
                  totalCurrentStock += toCollect;
                  quotaRoom -= toCollect;
                }
              }
            }

            // Mina própria produzindo este item
            if (srcTile.mine && srcTile.mine.resourceId === prodId) {
              const avail = srcTile.mine.stock || 0;
              if (avail > 0) {
                const toCollect = Math.min(avail, freeCapacity, quotaRoom);
                if (toCollect > 0) {
                  srcTile.mine.stock -= toCollect;

                  const oldStock = item.stock;
                  const newStock = oldStock + toCollect;
                  const srcCost = srcTile.mine.unitCost || 10.0;
                  const srcQR = srcTile.mine.quality || 60;

                  item.avgUnitCost = newStock > 0 ? Number((((oldStock * item.avgUnitCost) + (toCollect * srcCost)) / newStock).toFixed(2)) : srcCost;
                  item.quality = newStock > 0 ? Math.round(((oldStock * item.quality) + (toCollect * srcQR)) / newStock) : srcQR;
                  item.stock = newStock;
                  totalCurrentStock += toCollect;
                  quotaRoom -= toCollect;
                }
              }
            }

            // Fábrica própria produzindo este item
            if (srcTile.factory && srcTile.factory.lines) {
              for (const line of Object.values(srcTile.factory.lines)) {
                if (quotaRoom <= 0) break;
                if (line.outputProductId === prodId && line.finishedStock > 0) {
                  const toCollect = Math.min(line.finishedStock, freeCapacity, quotaRoom);
                  if (toCollect > 0) {
                    line.finishedStock -= toCollect;

                    const oldStock = item.stock;
                    const newStock = oldStock + toCollect;
                    const srcCost = line.unitCost || 2.0;
                    const srcQR = line.outputQuality || 65;

                    item.avgUnitCost = newStock > 0 ? Number((((oldStock * item.avgUnitCost) + (toCollect * srcCost)) / newStock).toFixed(2)) : srcCost;
                    item.quality = newStock > 0 ? Math.round(((oldStock * item.quality) + (toCollect * srcQR)) / newStock) : srcQR;
                    item.stock = newStock;
                    totalCurrentStock += toCollect;
                    quotaRoom -= toCollect;
                  }
                }
              }
            }
          }
        }

        // 2. Reabastecimento Automático Portuário (Safety Stock) & Modo Anticíclico
        const targetStock = Math.min(item.safetyStock || 0, maxQuota);
        if (item.autoRestockPort && targetStock > 0 && item.stock < targetStock && freeCapacity > 0) {
          const canBuy = !item.buyOnRecessionOnly || isDiscountCycle;
          if (canBuy) {
            const neededUnits = Math.min(targetStock - item.stock, freeCapacity, 1500);
            const macroMult = (typeof MacroCycleSystem !== 'undefined') ? MacroCycleSystem.getWholesaleCostMultiplier(state.year) : 1.0;
            const baseProdCost = (typeof PRODUCT_CATALOG !== 'undefined' && PRODUCT_CATALOG[prodId]?.baseCost) ? PRODUCT_CATALOG[prodId].baseCost : 1.0;
            const unitPrice = Number((baseProdCost * 1.15 * macroMult).toFixed(2));
            const totalCost = Math.round(neededUnits * unitPrice);

            if (state.cash >= totalCost) {
              state.cash -= totalCost;
              dailyFixed += totalCost;

              const oldStock = item.stock;
              const newStock = oldStock + neededUnits;
              item.avgUnitCost = newStock > 0 ? Number((((oldStock * item.avgUnitCost) + (neededUnits * unitPrice)) / newStock).toFixed(2)) : unitPrice;
              item.quality = newStock > 0 ? Math.round(((oldStock * item.quality) + (neededUnits * 50)) / newStock) : 50;
              item.stock = newStock;
              totalCurrentStock += neededUnits;

              if (Math.random() < 0.08) {
                const discountText = macroMult < 1.0 ? ` (${Math.round((1 - macroMult)*100)}% desc. recessão)` : '';
                const pName = (typeof PRODUCT_CATALOG !== 'undefined' && PRODUCT_CATALOG[prodId]?.name) ? PRODUCT_CATALOG[prodId].name : prodId;
                addLog(`📦 ${wh.name}: Reabastecidas ${neededUnits} un de ${pName} via Porto alfandegado${discountText}.`, 'text-sky-300 font-bold');
              }
            }
          }
        }
      }
    }
  }

  // Propagação de P&D para prateleiras de varejo
  propagateQualityRD();

  // Nível 1: Juros de Cheque Especial sobre Caixa Negativo (3.5% ao mês)
  let dailyFinancial = 0;
  if (state.cash < 0) {
    const overdraftInterest = Math.abs(state.cash) * (0.035 / 30);
    dailyFinancial += overdraftInterest;
    state.cash -= overdraftInterest;
    state.monthFinancialExpenses = (state.monthFinancialExpenses || 0) + overdraftInterest;
  }

  state.cash += dailyRev - dailyFixed - dailyMarketing;
  state.monthRevenue = (state.monthRevenue || 0) + dailyRev;
  state.monthCogs = (state.monthCogs || 0) + dailyCogs;
  state.monthFixedExpenses = (state.monthFixedExpenses || 0) + dailyFixed;
  state.monthMarketingExpenses = (state.monthMarketingExpenses || 0) + dailyMarketing;

  // Boletim Trimestral Antecipado (Dia 20 dos meses de fechamento 3, 6, 9, 12)
  if (state.day === 20 && (state.month === 3 || state.month === 6 || state.month === 9 || state.month === 12)) {
    const nextMonth = state.month === 12 ? 1 : state.month + 1;
    if (CoreMath.getQuarterInfo) {
      const nextQ = CoreMath.getQuarterInfo(nextMonth);
      addLog(`🌾 BOLETIM TRIMESTRAL: O ${nextQ.code} (${nextQ.name}) começa em 10 dias! Prepare seus estoques.`, 'text-sky-300 font-bold', { isAlert: true });
    }
  }

  state.day++;
  if (state.day > 30) {
    closeMonthEnd(ctx);
    checkAutoSave();
    state.day = 1;
    if (state.month === 12) {
      const oldYear = state.year;
      state.month = 1;
      state.year++;
      addLog(`🎆 FELIZ ANO NOVO! Início do Exercício Fiscal do Ano ${state.year}!`, 'text-amber-300 font-bold', { isAlert: true });
      if (MacroCycleSystem && MacroCycleSystem.onYearChange) {
        MacroCycleSystem.onYearChange(oldYear, state.year);
      }
    } else {
      state.month++;
    }

    // Anúncio de Início de Novo Trimestre Macroeconômico (Meses 1, 4, 7, 10 no Dia 1)
    if (state.month === 1 || state.month === 4 || state.month === 7 || state.month === 10) {
      if (CoreMath.getQuarterInfo) {
        const curQ = CoreMath.getQuarterInfo(state.month);
        addLog(curQ.alertMessage, 'text-amber-300 font-bold', { isAlert: true });
      }
    }
  }

  checkTutorialProgress();
  updateUI();

  return {
    dailyRev,
    dailyCogs,
    dailyFixed,
    dailyMarketing,
    cash: state.cash,
    day: state.day,
    month: state.month,
    year: state.year
  };
}

/**
 * Executa o fechamento contábil mensal (DRE, insolvência, P&D, reputação de marca e snapshots)
 */
export function closeMonthEnd(customContext = {}) {
  const ctx = resolveSimulationContext(customContext);
  const {
    state,
    activeFacilitySet,
    addLog,
    calculateCorporateNetWorth,
    openInsolvencyModal,
    showBankruptcyModal,
    processRDProgress,
    renderFacilityPanel,
    getActiveManagedTile,
    processBankingInstallments,
  } = ctx;

  // Processa parcelas de empréstimos bancários ANTES da avaliação de insolvência
  processBankingInstallments();

  // Snapshot de performance por instalação para auditoria e DRE detalhada
  for (const tile of activeFacilitySet.values()) {
    if (tile.monthlyMetrics) {
      tile.lastMonthMetrics = {
        revenue: tile.monthlyMetrics.revenue || 0,
        cogs: tile.monthlyMetrics.cogs || 0,
        opex: tile.monthlyMetrics.opex || 0,
        netProfit: (tile.monthlyMetrics.revenue || 0) - (tile.monthlyMetrics.cogs || 0) - (tile.monthlyMetrics.opex || 0)
      };
      tile.monthlyMetrics = { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
    }
  }

  const monthRevenue = state.monthRevenue || 0;
  const monthCogs = state.monthCogs || 0;
  const monthFixedExpenses = state.monthFixedExpenses || 0;
  const monthMarketingExpenses = state.monthMarketingExpenses || 0;
  const monthFinancialExpenses = state.monthFinancialExpenses || 0;

  const net = monthRevenue - monthCogs - monthFixedExpenses - monthMarketingExpenses - monthFinancialExpenses;
  if (net > 0) {
    state.hasRecordedPositiveMonth = true;
  }
  addLog(
    `📊 FIM DO MÊS ${String(state.month).padStart(2,'0')}: Receita $${monthRevenue.toLocaleString('en-US',{maximumFractionDigits:0})} | Lucro Líq: $${net.toLocaleString('en-US',{maximumFractionDigits:0})}`,
    net >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold',
    { actionType: 'OPEN_DRE' }
  );

  // Solvência Corporativa em 3 Degraus
  const nwObj = calculateCorporateNetWorth();
  // Insolvência técnica:
  // - netWorth < 0: patrimônio líquido negativo (inclui banking debt — over-leverage real)
  // - overdraftDebt excessivo: cheque especial fora de controle (sinal de crise operacional)
  // NOTA: banking.totalDebt (empréstimos voluntários) NÃO entra na condição de ratio —
  //       um empréstimo estratégico de $80k numa empresa com $20k de receita mensal é
  //       uma decisão legítima, não insolvência. Só o netWorth negativo captura over-leverage.
  const overdraftDebt = nwObj.overdraftDebt || 0;
  const isTechnicallyInsolvent = (
    nwObj.netWorth < 0 ||
    (overdraftDebt > Math.max(1, monthRevenue * 3) && monthRevenue > 0)
  );

  if (isTechnicallyInsolvent) {
    state.consecutiveInsolventMonths = (state.consecutiveInsolventMonths || 0) + 1;
    if (state.consecutiveInsolventMonths >= 2 && !state.insolvencyLevel2Triggered) {
      state.insolvencyLevel2Triggered = true;
      state.insolvencyCountdownMonths = 6;
      openInsolvencyModal(nwObj);
      addLog('🚨 ALERTA DE INSOLVÊNCIA TÉCNICA (Nível 2): Patrimônio Líquido negativo acumulado! Restam 6 meses para reestruturar.', 'text-amber-400 font-bold');
    } else if (state.insolvencyLevel2Triggered) {
      state.insolvencyCountdownMonths = (state.insolvencyCountdownMonths || 6) - 1;
      if (state.insolvencyCountdownMonths <= 0) {
        showBankruptcyModal(nwObj);
        addLog('⚖️ FALÊNCIA DECRETADA: O Tribunal de Justiça decretou a liquidação dos bens da sua corporação.', 'text-rose-500 font-bold');
      } else {
        addLog(`🚨 ALERTA JUDICIAL: Restam ${state.insolvencyCountdownMonths} meses para sanear o Patrimônio Líquido antes da Falência!`, 'text-rose-400 font-bold');
      }
    }
  } else {
    if (nwObj.netWorth > 0) {
      if (state.insolvencyLevel2Triggered) {
        addLog('⚖️ SOLVÊNCIA RESTAURADA: Sua corporação recuperou o Patrimônio Líquido positivo e o processo judicial foi extinto!', 'text-emerald-400 font-bold');
      }
      state.consecutiveInsolventMonths = 0;
      state.insolvencyLevel2Triggered = false;
      state.insolvencyCountdownMonths = 6;
    }
  }

  // Processa o avanço das pesquisas de P&D
  processRDProgress();

  const activeMarketingContracts = state.activeMarketingContracts || new Set();
  const playerBrandRating = state.playerBrandRating || {};

  const activeInstOutlets = MEDIA_OUTLETS.filter(o => activeMarketingContracts.has(`${o.id}::__institutional__`));
  const instBoost = activeInstOutlets.reduce((s, o) => s + Math.floor(o.brandBoostMonthly * 0.75), 0);

  for (const prodId of Object.keys(PRODUCT_CATALOG)) {
    const activeOutletsForProd = MEDIA_OUTLETS.filter(o => activeMarketingContracts.has(`${o.id}::${prodId}`));
    const currentBrand = playerBrandRating[prodId] || 20;

    if (activeOutletsForProd.length > 0 || instBoost > 0) {
      let totalBoost = activeOutletsForProd.reduce((sum, o) => sum + o.brandBoostMonthly, 0) + instBoost;
      if (net > 0) totalBoost += 1;
      const maxCap = activeOutletsForProd.length > 0
        ? Math.max(...activeOutletsForProd.map(o => o.brandCap))
        : (activeInstOutlets.length > 0 ? Math.max(...activeInstOutlets.map(o => o.brandCap)) : 70);
      
      const newBrand = Math.min(maxCap, currentBrand + totalBoost);
      playerBrandRating[prodId] = newBrand;
    } else {
      const decay = net > 0 ? 1 : 2;
      playerBrandRating[prodId] = Math.max(10, currentBrand - decay);
    }
  }

  // Atualiza preços e qualidade (P&D) dos concorrentes apenas para tiles com concorrente (Sparse Index)
  for (const tile of activeFacilitySet.values()) {
    if (!tile.competitor?.shelves) continue;
    for (const [pId, cs] of Object.entries(tile.competitor.shelves)) {
      const prod = PRODUCT_CATALOG[pId];
      if (!prod) continue;

      // Ajuste de Preço Competitivo
      if ((tile.competitor.lastShare || 0.5) < 0.38) {
        const newPrice = Number(Math.max(prod.baseCost * 1.08, cs.price * (0.94 + Math.random() * 0.03)).toFixed(2));
        const pctDrop  = Math.round((1 - newPrice / cs.price) * 100);
        cs.price = newPrice;
        if (pctDrop > 1) addLog(`🤖 ${tile.competitor.name} reduziu ${prod.name} para $${newPrice} (-${pctDrop}%)!`, 'text-purple-400');
      } else {
        cs.price = Number(Math.min(prod.standardPrice * 1.25, cs.price * (1.005 + Math.random() * 0.01)).toFixed(2));
      }

      // Evolução Assintótica de P&D da IA (Competidor investe entre $2.500 e $6.500/mês)
      const compBudget = 2500 + Math.random() * 4000;
      const currentCompQR = cs.quality || 55;
      const aiGain = CoreMath.applyQRAsymptoticGrowth(currentCompQR, compBudget);
      if (aiGain > 0 && currentCompQR < 92) {
        cs.quality = Math.min(92, Number((currentCompQR + aiGain).toFixed(1)));
      }
    }
  }

  // Registra Snapshot Mensal Granular no TimeSeriesBuffer (Buffer circular de 24 meses)
  const facilitiesSnapshot = {};
  for (const tile of activeFacilitySet.values()) {
    if (!tile.store && !tile.factory && !tile.farm && !tile.mine && !tile.rdCenter && !tile.warehouse) continue;
    const key = `${tile.x}_${tile.y}`;
    const name = tile.store?.name || tile.factory?.name || tile.farm?.name || tile.mine?.name || tile.rdCenter?.name || tile.warehouse?.name || 'Instalação';
    const type = tile.store ? 'store' : (tile.factory ? 'factory' : (tile.farm ? 'farm' : (tile.mine ? 'mine' : (tile.rdCenter ? 'rdCenter' : 'warehouse'))));
    const lm = tile.lastMonthMetrics || { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
    facilitiesSnapshot[key] = {
      x: tile.x,
      y: tile.y,
      name,
      type,
      loc: `${tile.district?.name || 'Interior'} (${tile.x}, ${tile.y})`,
      revenue: lm.revenue,
      cogs: lm.cogs,
      opex: lm.opex,
      netProfit: lm.netProfit
    };
  }

  const historicalLedger = state.historicalLedger || [];
  historicalLedger.push({
    month: state.month,
    year: state.year,
    revenue: monthRevenue,
    cogs: monthCogs,
    fixedExpenses: monthFixedExpenses,
    marketingExpenses: monthMarketingExpenses,
    financialExpenses: monthFinancialExpenses,
    totalOpex: monthFixedExpenses + monthMarketingExpenses + monthFinancialExpenses,
    netProfit: net,
    cash: state.cash,
    netWorth: nwObj.netWorth,
    facilities: facilitiesSnapshot
  });

  if (historicalLedger.length > 24) {
    historicalLedger.shift();
  }

  // 7. Avaliação Estratégica da Diretoria Executiva (Pulso de Saúde & Alertas com Causa-Raiz)
  if (AdvisorSystem) {
    const pulse = AdvisorSystem.evaluateCorporatePulse({ state, activeFacilitySet, rdLabs: state.rdLabs });
    const rawAlerts = AdvisorSystem.diagnoseCorporateIssues({ state, activeFacilitySet, rdLabs: state.rdLabs });
    state.advisorState = AdvisorSystem.updateAdvisorAlertStates(state.advisorState, rawAlerts, state.month, state.year);
    state.advisorState.lastPulse = pulse;

    const newCriticals = Object.values(state.advisorState.activeAlerts || {}).filter(a => a.state === 'new' && a.severity === 'critical');
    if (newCriticals.length > 0) {
      addLog(`👔 DIRETORIA EXECUTIVA: ${newCriticals.length} alerta(s) operacional(is) crítico(s) detectado(s)!`, 'text-rose-400 font-bold', { actionType: 'OPEN_ADVISOR' });
    }
  }

  state.monthRevenue = 0;
  state.monthCogs = 0;
  state.monthFixedExpenses = 0;
  state.monthMarketingExpenses = 0;
  state.monthFinancialExpenses = 0;

  const activeTile = getActiveManagedTile();
  if (activeTile) {
    renderFacilityPanel(activeTile);
  }

  return {
    netProfit: net,
    netWorth: nwObj.netWorth,
    month: state.month,
    year: state.year
  };
}
