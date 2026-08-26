/**
 * types/index.ts — Modelos e Tipos Oficiais de OIKONOMIA
 */

export interface ProductType {
  id: string;
  name: string;
  category: string;
  storeType: string;
  standardPrice: number;
  baseCost: number;
  necessityIndex: number;
  qualityWeight: number;
  brandWeight: number;
  perCapitaDailyDemand: number;
}

export interface NaturalResourceMine {
  id: string;
  name: string;
  emoji: string;
  resourceId: string;
  resourceName: string;
  cost: number;
  unitCost: number;
  quality: number;
  dailyYield: number;
  desc: string;
}

export interface FarmCropType {
  id: string;
  name: string;
  emoji: string;
  cropId: string;
  cropName: string;
  cost: number;
  unitCost: number;
  quality: number;
  dailyYield: number;
  desc: string;
}

export interface StoreTypeDef {
  id: string;
  name: string;
  emoji: string;
  category: string;
  cost: number;
  maxShelves: number;
  rentMultiplier: number;
  desc: string;
}

export interface RecipeDef {
  id: string;
  name: string;
  outputProdId: string;
  outputName: string;
  isIntermediate?: boolean;
  unitCost: number;
  quality: number;
  dailyCap: number;
  inputs?: Record<string, number>;
  desc: string;
}

export interface ShelfState {
  price: number;
  stock: number;
  maxCapacity: number;
  dailyRestock: number;
  quality: number;
  supplierId?: string;
  supplierName?: string;
  wholesalePrice?: number;
  unitFreight?: number;
  landedCost?: number;
}

export interface StoreState {
  id: string;
  name: string;
  storeTypeId: string;
  maxShelves: number;
  rentMultiplier: number;
  dailyRent: number;
  shelves: Record<string, ShelfState>;
}

export interface ProductionFacilityState {
  id: string;
  type: 'mine' | 'farm' | 'factory';
  name: string;
  dailyOperatingCost: number;
  dailyRent: number;
  stock: number;
  maxCapacity: number;
  quality: number;
  dailyYield?: number;
  lines?: Record<string, {
    recipeId: string;
    recipeName: string;
    outputProductId: string;
    unitCost: number;
    outputQuality: number;
    dailyCapacity: number;
    finishedStock: number;
    maxStock: number;
  }>;
}

export interface District {
  id: string;
  name: string;
  type: string;
  population: number;
  trafficIndex: number;
  landRentDaily: number;
}
