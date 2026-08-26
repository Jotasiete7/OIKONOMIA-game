/**
 * loader/stateLoader.ts — Carregador de Dados e Inicializador de Estado
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GameState, ProductType, District } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadMasterData(basePath?: string): GameState {
  const dataDir = basePath || path.resolve(__dirname, '../../../data');

  const rawProducts = fs.readFileSync(path.join(dataDir, 'products', 'product-catalog.json'), 'utf-8');
  const rawCity = fs.readFileSync(path.join(dataDir, 'cities', 'neo-capital.json'), 'utf-8');
  const rawAi = fs.readFileSync(path.join(dataDir, 'competitors', 'default-ai.json'), 'utf-8');

  const productsList: ProductType[] = JSON.parse(rawProducts);
  const cityData = JSON.parse(rawCity);
  const aiData = JSON.parse(rawAi);

  const catalog: Record<string, ProductType> = {};
  const playerBrandRating: Record<string, number> = {};

  for (const prod of productsList) {
    catalog[prod.id] = prod;
    playerBrandRating[prod.id] = 20; // Marca inicial
  }

  const districts: District[] = cityData.districts.map((d: any) => {
    const dist: District = {
      id: d.id,
      name: d.name,
      type: d.type,
      population: d.population,
      trafficIndex: d.trafficIndex,
      landRentDaily: d.landRentDaily,
      playerStore: null,
      competitorStore: null
    };

    if (d.starterPlayerStore) {
      dist.playerStore = {
        id: `store_${d.id}`,
        name: `Kombini Matriz (${d.name})`,
        shelves: {
          bread: { price: 3.50, stock: 800, maxCapacity: 1500, dailyRestock: 250, quality: 50 },
          beer:  { price: 4.00, stock: 600, maxCapacity: 1200, dailyRestock: 180, quality: 50 },
          cola:  { price: 2.20, stock: 700, maxCapacity: 1200, dailyRestock: 200, quality: 50 }
        }
      };
    }

    if (d.starterCompetitorStore) {
      dist.competitorStore = {
        id: `ai_${d.id}`,
        name: aiData.startingStore.storeName,
        shelves: { ...aiData.startingStore.shelves },
        lastShare: 0.50
      };
    }

    return dist;
  });

  return {
    day: 1,
    month: 1,
    year: 1,
    cash: 50000.00,
    cityName: cityData.cityName,
    catalog,
    districts,
    playerBrandRating,
    monthRevenue: 0,
    monthCogs: 0,
    monthFixedExpenses: 0
  };
}
