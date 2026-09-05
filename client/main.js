// client/main.js — Ponto de entrada Vite (Fases 1 a 5 de Modularização)
// Os window.X são temporários e serão removidos conforme cada sistema migrar
// para import direto. Não remover até o index.html ser modularizado.

// Pre-inicialização defensiva do loop de renderização (evita TDZ)
if (typeof window !== 'undefined') {
  window._needsRender = true;
  if (typeof window.scheduleRender !== 'function') {
    window.scheduleRender = function() { window._needsRender = true; };
  }
}

// --- Fase 5: Estilos Globais & Tailwind CSS Local ---
import './style.css';

// --- Fase 1: Sistemas de simulação ---
import CoreMath from './core_math.js';
import TickerSystem from './ticker_system.js';
import MacroCycleSystem from './macro_cycle_system.js';
import {
  simulateDay,
  closeMonthEnd,
  calcPriceRating,
  calcProductRating,
  calcElasticity,
  resolveSimulationContext
} from './simulation.js';

// --- Fase 2A: Dados do mapa ---
import { MAP_WIDTH, MAP_HEIGHT, TILE_WIDTH, TILE_HEIGHT, CITY_PROFILES_DATA, TMX_LAYERS } from './map_data.js';

// --- Fase 2C: Catálogos de dados mestres ---
import {
  CITY_DISTRICTS,
  STORE_TYPES,
  STORE_NICHE_LICENSES,
  STORE_CATEGORY_WHITELIST,
  NATURAL_MINES,
  FARM_TYPES,
  PRODUCT_CATALOG,
  FACTORY_RECIPES,
  RECIPE_GRAPH,
  MEDIA_OUTLETS,
  SEAPORTS,
  PORT_SUPPLIES_FOOD_CONSUMER,
  PORT_SUPPLIES_COMMODITIES,
  PORT_SUPPLIES_TECH_PARTS,
  RD_CATEGORIES
} from './data_catalogs.js';

// --- Fase 3A: SpriteManager ---
import SpriteManager from './sprite_manager.js';

// --- Fase 3B: Audio & SoundEngine ---
import SoundEngine, {
  getAudioContext,
  playBeep,
  playSuccessChime,
  playYearCelebration,
  playClick,
  playCashRegister
} from './audio.js';

// --- Fase 4A: Logo Generator & Game Config ---
import {
  hashStringToSeed,
  LOGO_ICONS,
  THEME_COLOR_PALETTES,
  generateCompanyLogo,
  getCompanyLogoSvg,
  drawCanvasCompanyLogoBadge
} from './logo_generator.js';

import {
  AVATAR_CATALOG,
  COLOR_PALETTES,
  DIFFICULTY_PRESETS,
  ECONOMIC_TIPS
} from './game_config.js';

// --- Fase 4B: Game State & Save System ---
import GameState, { createInitialGameState } from './game_state.js';
import {
  GAME_VERSION_INFO,
  SAVES_STORAGE_KEY,
  CURRENT_SAVE_VERSION,
  migrateSaveData,
  getSavesIndex,
  saveSavesIndex,
  serializeGameState,
  createSaveMetadata,
  deleteSaveSlot,
  generateExportDataUri
} from './save_system.js';

// --- Sistema de Armazém Logístico & CDs ---
import * as WarehouseSystem from './warehouse_system.js';

// Re-exposição global (Fase 1)
window.CoreMath = CoreMath;
window.TickerSystem = TickerSystem;
window.MacroCycleSystem = MacroCycleSystem;
window.simulateDay = simulateDay;
window.closeMonthEnd = closeMonthEnd;
window._engineSimulateDay = simulateDay;
window._engineCloseMonthEnd = closeMonthEnd;
window.calcPriceRating = calcPriceRating;
window.calcProductRating = calcProductRating;
window.calcElasticity = calcElasticity;
window.resolveSimulationContext = resolveSimulationContext;

// Re-exposição global (Fase 2A)
window.MAP_WIDTH = MAP_WIDTH;
window.MAP_HEIGHT = MAP_HEIGHT;
window.TILE_WIDTH = TILE_WIDTH;
window.TILE_HEIGHT = TILE_HEIGHT;
window.CITY_PROFILES_DATA = CITY_PROFILES_DATA;
window.TMX_LAYERS = TMX_LAYERS;

// Re-exposição global (Fase 2C)
window.CITY_DISTRICTS = CITY_DISTRICTS;
window.STORE_TYPES = STORE_TYPES;
window.STORE_NICHE_LICENSES = STORE_NICHE_LICENSES;
window.STORE_CATEGORY_WHITELIST = STORE_CATEGORY_WHITELIST;
window.NATURAL_MINES = NATURAL_MINES;
window.FARM_TYPES = FARM_TYPES;
window.PRODUCT_CATALOG = PRODUCT_CATALOG;
window.FACTORY_RECIPES = FACTORY_RECIPES;
window.RECIPE_GRAPH = RECIPE_GRAPH;
window.MEDIA_OUTLETS = MEDIA_OUTLETS;
window.SEAPORTS = SEAPORTS;
window.PORT_SUPPLIES_FOOD_CONSUMER = PORT_SUPPLIES_FOOD_CONSUMER;
window.PORT_SUPPLIES_COMMODITIES = PORT_SUPPLIES_COMMODITIES;
window.PORT_SUPPLIES_TECH_PARTS = PORT_SUPPLIES_TECH_PARTS;
window.RD_CATEGORIES = RD_CATEGORIES;

// Re-exposição global (Fase 3A)
window.SpriteManager = SpriteManager;

// Re-exposição global (Fase 3B)
window.SoundEngine = SoundEngine;
window.getAudioContext = getAudioContext;
window.playBeep = playBeep;
window.playSuccessChime = playSuccessChime;
window.playYearCelebration = playYearCelebration;
window.playClick = playClick;
window.playCashRegister = playCashRegister;

// Re-exposição global (Fase 4A: Logo Generator)
window.hashStringToSeed = hashStringToSeed;
window.LOGO_ICONS = LOGO_ICONS;
window.THEME_COLOR_PALETTES = THEME_COLOR_PALETTES;
window.generateCompanyLogo = generateCompanyLogo;
window.getCompanyLogoSvg = getCompanyLogoSvg;
window.drawCanvasCompanyLogoBadge = drawCanvasCompanyLogoBadge;

// Re-exposição global (Fase 4A: Game Config)
window.AVATAR_CATALOG = AVATAR_CATALOG;
window.COLOR_PALETTES = COLOR_PALETTES;
window.DIFFICULTY_PRESETS = DIFFICULTY_PRESETS;
window.ECONOMIC_TIPS = ECONOMIC_TIPS;

// Re-exposição global (Fase 4B: Game State & Save System)
window.GameState = window.GameState || GameState;
window.createInitialGameState = createInitialGameState;
window.GAME_VERSION_INFO = GAME_VERSION_INFO;
window.SAVES_STORAGE_KEY = SAVES_STORAGE_KEY;
window.CURRENT_SAVE_VERSION = CURRENT_SAVE_VERSION;
window.migrateSaveData = migrateSaveData;
window.getSavesIndex = getSavesIndex;
window.saveSavesIndex = saveSavesIndex;
window.serializeGameState = serializeGameState;
window.createSaveMetadata = createSaveMetadata;
window.deleteSaveSlot = deleteSaveSlot;
window.generateExportDataUri = generateExportDataUri;

// Re-exposição global (Warehouse System)
window.WarehouseSystem = WarehouseSystem;
window.renderWarehousePanel = WarehouseSystem.renderWarehousePanel;
window.upgradeWarehouse = WarehouseSystem.upgradeWarehouse;
window.confirmBuildWarehouse = WarehouseSystem.confirmBuildWarehouse;
window.openAddWarehouseProductModal = WarehouseSystem.openAddWarehouseProductModal;
window.closeAddWarehouseProductModal = WarehouseSystem.closeAddWarehouseProductModal;
window.renderWarehouseAddProductList = WarehouseSystem.renderWarehouseAddProductList;
window.addWarehouseProduct = WarehouseSystem.addWarehouseProduct;
window.removeWarehouseProduct = WarehouseSystem.removeWarehouseProduct;
window.toggleWarehouseCollect = WarehouseSystem.toggleWarehouseCollect;
window.setWarehouseSafetyStock = WarehouseSystem.setWarehouseSafetyStock;
window.toggleWarehousePortRestock = WarehouseSystem.toggleWarehousePortRestock;
window.toggleWarehouseRecessionOnly = WarehouseSystem.toggleWarehouseRecessionOnly;

// Proxies reativos globais vinculados a GameState (Single Source of Truth)
const stateProxyProps = [
  'currentAppScreen', 'day', 'month', 'year', 'cash',
  'monthRevenue', 'monthCogs', 'monthFixedExpenses', 'monthMarketingExpenses',
  'monthFinancialExpenses', 'consecutiveInsolventMonths', 'insolvencyLevel2Triggered',
  'insolvencyCountdownMonths', 'gameSpeed', 'timerInterval', 'previousSpeedBeforePause',
  'playtimeSeconds', 'playerProfile', 'currentSaveSlotId', 'lastSavedStateSnapshot', 'gameSettings'
];
if (typeof window !== 'undefined') {
  for (const prop of stateProxyProps) {
    if (!(prop in window)) {
      Object.defineProperty(window, prop, {
        get() { return GameState[prop]; },
        set(val) { GameState[prop] = val; },
        configurable: true
      });
    }
  }
}

// Notifica que todos os módulos foram carregados e vinculados com sucesso
if (typeof window !== 'undefined') {
  window.__OIKO_MODULES_READY__ = true;
  window.dispatchEvent(new CustomEvent('oiko:ready'));
}
