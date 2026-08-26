/**
 * types/index.ts — Modelos e Tipos Estritos do Sim-Core de OIKONOMIA
 */

export interface ProductType {
  id: string;
  name: string;
  category: string;
  standardPrice: number;
  baseCost: number;
  qualityRating: number;
  brandRating: number;
  necessityIndex: number;
  qualityWeight: number;
  brandWeight: number;
  perCapitaDailyDemand: number;
}

export interface District {
  id: string;
  name: string;
  type: string;
  population: number;
  trafficIndex: number;
  landRentDaily: number;
  playerStore?: StoreState | null;
  competitorStore?: CompetitorStoreState | null;
}

export interface SupplierOffer {
  supplierId: string;
  supplierName: string;
  wholesalePrice: number;
  quality: number;
  dailyQuota: number;
  origin: string;
  distance: number;
  unitFreight: number;
  landedCost: number;
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

export interface CompetitorShelfState {
  price: number;
  quality: number;
  brand: number;
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

export interface CompetitorStoreState {
  id: string;
  name: string;
  shelves: Record<string, CompetitorShelfState>;
  lastShare?: number;
}

export interface MonthlyFinancialReport {
  month: number;
  year: number;
  grossRevenue: number;
  cogs: number;
  fixedRent: number;
  netProfit: number;
  endingCash: number;
}

export interface GameState {
  day: number;
  month: number;
  year: number;
  cash: number;
  cityName: string;
  catalog: Record<string, ProductType>;
  districts: District[];
  playerBrandRating: Record<string, number>;
  monthRevenue: number;
  monthCogs: number;
  monthFixedExpenses: number;
  lastMonthReport?: MonthlyFinancialReport;
}
