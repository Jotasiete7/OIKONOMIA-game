// client/main.js — Ponto de entrada Vite (Fase 1 + 2A + 2C + 3A de Transição)
// Os window.X são temporários e serão removidos conforme cada sistema migrar
// para import direto. Não remover até o index.html ser modularizado.

// --- Fase 1: Sistemas de simulação ---
import CoreMath from './core_math.js';
import TickerSystem from './ticker_system.js';
import MacroCycleSystem from './macro_cycle_system.js';

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

// Re-exposição global (Fase 1)
window.CoreMath = CoreMath;
window.TickerSystem = TickerSystem;
window.MacroCycleSystem = MacroCycleSystem;

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
