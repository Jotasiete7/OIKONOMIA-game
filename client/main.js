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
import AdvisorSystem from './advisor_system.js';
import SimulationGuard from './simulation_guard.js';
import ProductionGraph from './production_graph.js';

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
  reconcileSavesIndex,
  serializeGameState,
  createSaveMetadata,
  deleteSaveSlot,
  generateExportDataUri,
  saveSlotWithBackup,
  loadSlotWithFallback
} from './save_system.js';

// --- Sistema de Armazém Logístico & CDs ---
import * as WarehouseSystem from './warehouse_system.js';

// --- Sistema de Telemetria, Captura Visual & Flight Recorder (Supabase) ---
import TelemetrySystem, {
  initTelemetryEngine,
  trackPlayerAction,
  captureOptimizedScreenshot,
  analyzeGameBalance,
  buildTelemetryPayload,
  dispatchReport,
  downloadReportJson,
  copyReportToClipboard,
  isSupabaseConfigured
} from './telemetry_system.js';
import { TELEMETRY_CONFIG } from './telemetry_config.js';

// --- Fase 6.1: UI Shell, Window Manager & Navegação ---
import WindowManager, { bringWindowToFront, makeDraggable, initAllDraggableWindows } from './ui/window_manager.js';
import NavigationSystem, {
  toggleCitiesDropdown,
  closeCitiesDropdown,
  toggleLensesDropdown,
  closeLensesDropdown,
  toggleMoreOptionsMenu,
  closeMoreOptionsMenu,
  jumpToCity,
  focusOnTile,
  setHeatmap
} from './ui/navigation.js';
import ModalManager, {
  openModal,
  closeModal,
  toggleModal,
  isModalOpen,
  openDiaryModal,
  closeDiaryModal,
  toggleDiaryModal,
  closeAllInGameModals,
  handleGlobalEscape
} from './ui/modal_manager.js';

// --- Fase 6.2: HUD Executivo & Ticker ---
import HUDSystem, { setSpeed, updateHUD, updateAdvisorHUDChip } from './ui/hud.js';
import TickerUI from './ui/ticker.js';

// --- Fase 6.3: Motor de Renderização Canvas & Isometria ---
import IsoMath, { gridToScreen, screenToGrid, drawDiamond, drawBuilding } from './renderer/iso_math.js';
import CameraController, { camera, changeZoom, focusOnTile as cameraFocusOnTile, jumpToCity as cameraJumpToCity, resetCamera } from './renderer/camera.js';
import MinimapSystem, { renderMinimap, initMinimapEvents } from './renderer/minimap.js';
import CanvasRenderer, { renderMap, resizeCanvas, scheduleRender, startRenderLoop, stopRenderLoop, getCurrentFps } from './renderer/canvas_renderer.js';

// --- Fase 6.4: Controladores dos Painéis Modais Especializados ---
import BankingPanel from './ui/panels/banking_panel.js';
import AdvisorPanel from './ui/panels/advisor_panel.js';
import DREPanel from './ui/panels/dre_panel.js';
import TechTreePanel from './ui/panels/tech_tree_panel.js';
import RDPanel from './ui/panels/rd_panel.js';
import EncyclopediaPanel from './ui/panels/encyclopedia_panel.js';
import FacilityPanel from './ui/panels/facility_panel.js';

// --- Fase 6.5: Input & Ciclo de Vida do Jogo ---
import { KeyboardSystem } from './input/keyboard.js';
import { MouseSystem } from './input/mouse.js';
import { AppLifecycle } from './app/lifecycle.js';

// --- Fase 7.0 A: Assistentes de Construção, Gôndolas & Fornecedores ---
import { ConstructionWizards, StoreWizard, SupplierPicker } from './ui/wizards/index.js';

// Inicializa captura de erros do Flight Recorder o mais cedo possível
initTelemetryEngine();

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
window.AdvisorSystem = AdvisorSystem;
window.SimulationGuard = SimulationGuard;
window.ProductionGraph = ProductionGraph;

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
if (typeof window !== 'undefined') {
  if (window.GameState && window.GameState !== GameState) {
    Object.assign(GameState, window.GameState);
    window.GameState = GameState;
  } else {
    window.GameState = GameState;
  }
} else {
  window.GameState = GameState;
}
window.createInitialGameState = createInitialGameState;
window.GAME_VERSION_INFO = GAME_VERSION_INFO;
window.SAVES_STORAGE_KEY = SAVES_STORAGE_KEY;
window.CURRENT_SAVE_VERSION = CURRENT_SAVE_VERSION;
window.migrateSaveData = migrateSaveData;
window.getSavesIndex = getSavesIndex;
window.saveSavesIndex = saveSavesIndex;
window.reconcileSavesIndex = reconcileSavesIndex;
window._saveSystem = { getSavesIndex, saveSavesIndex, reconcileSavesIndex, migrateSaveData, saveSlotWithBackup, loadSlotWithFallback };
window.serializeGameState = serializeGameState;
window.createSaveMetadata = createSaveMetadata;
window.deleteSaveSlot = deleteSaveSlot;
window.generateExportDataUri = generateExportDataUri;
window.saveSlotWithBackup = saveSlotWithBackup;
window.loadSlotWithFallback = loadSlotWithFallback;

// Re-exposição global (Warehouse System)
window.WarehouseSystem = WarehouseSystem;
window.WAREHOUSE_HUB_PRESETS = WarehouseSystem.WAREHOUSE_HUB_PRESETS;
window.renderWarehousePanel = WarehouseSystem.renderWarehousePanel;
window.openWarehouseModal = WarehouseSystem.openWarehouseModal;
window.closeWarehouseModal = WarehouseSystem.closeWarehouseModal;
window.renameWarehouse = WarehouseSystem.renameWarehouse;
window.switchWarehouseTab = WarehouseSystem.switchWarehouseTab;
window.syncOwnProductionProducts = WarehouseSystem.syncOwnProductionProducts;
window.setWarehouseProductMaxQuota = WarehouseSystem.setWarehouseProductMaxQuota;
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
window.toggleWarehouseCardExpand = WarehouseSystem.toggleWarehouseCardExpand;
window.toggleAllWarehouseCards = WarehouseSystem.toggleAllWarehouseCards;
window.applyWarehouseHubPreset = WarehouseSystem.applyWarehouseHubPreset;
window.setWarehouseCategoryFilter = WarehouseSystem.setWarehouseCategoryFilter;
window.setWarehouseFilterCategory = WarehouseSystem.setWarehouseFilterCategory;
window.onWarehouseSearchInput = WarehouseSystem.onWarehouseSearchInput;
window.clearWarehouseSearch = WarehouseSystem.clearWarehouseSearch;
window.migrateWarehouseLegacyKeys = WarehouseSystem.migrateWarehouseLegacyKeys;
window.toggleWarehouseAddSelect = WarehouseSystem.toggleWarehouseAddSelect;
window.toggleSelectAllFilteredAddProducts = WarehouseSystem.toggleSelectAllFilteredAddProducts;
window.allocateSelectedWarehouseProducts = WarehouseSystem.allocateSelectedWarehouseProducts;

// Re-exposição global (Telemetry & Bug Reporter Flight Recorder)
window.TelemetrySystem = TelemetrySystem;
window.TELEMETRY_CONFIG = TELEMETRY_CONFIG;
window.trackPlayerAction = trackPlayerAction;
window.captureOptimizedScreenshot = captureOptimizedScreenshot;
window.analyzeGameBalance = analyzeGameBalance;
window.buildTelemetryPayload = buildTelemetryPayload;
window.dispatchReport = dispatchReport;
window.downloadReportJson = downloadReportJson;
window.copyReportToClipboard = copyReportToClipboard;
window.isSupabaseConfigured = isSupabaseConfigured;

// Re-exposição global (Fase 6.1 — UI Shell, Window Manager & Navegação)
window.WindowManager = WindowManager;
window.bringWindowToFront = bringWindowToFront;
window.makeDraggable = makeDraggable;
window.initAllDraggableWindows = initAllDraggableWindows;

window.NavigationSystem = NavigationSystem;
window.toggleCitiesDropdown = toggleCitiesDropdown;
window.closeCitiesDropdown = closeCitiesDropdown;
window.toggleLensesDropdown = toggleLensesDropdown;
window.closeLensesDropdown = closeLensesDropdown;
window.toggleMoreOptionsMenu = toggleMoreOptionsMenu;
window.closeMoreOptionsMenu = closeMoreOptionsMenu;
window.jumpToCity = jumpToCity;
window.focusOnTile = focusOnTile;
window.setHeatmap = setHeatmap;

window.ModalManager = ModalManager;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleModal = toggleModal;
window.isModalOpen = isModalOpen;
window.openDiaryModal = openDiaryModal;
window.closeDiaryModal = closeDiaryModal;
window.toggleDiaryModal = toggleDiaryModal;
window.closeAllInGameModals = closeAllInGameModals;
window.handleGlobalEscape = handleGlobalEscape;

// Re-exposição global (Fase 6.2 — TopBar & HUD Executivo)
window.HUDSystem = HUDSystem;
window.setSpeed = setSpeed;
window.updateHUD = updateHUD;
window.updateUI = updateHUD;
window.updateAdvisorHUDChip = updateAdvisorHUDChip;
window.TickerUI = TickerUI;

// Re-exposição global (Fase 6.3 — Motor Gráfico Canvas & Isometria)
window.IsoMath = IsoMath;
window.gridToScreen = gridToScreen;
window.screenToGrid = screenToGrid;
window.drawDiamond = drawDiamond;
window.drawBuilding = drawBuilding;

window.camera = camera;
window.CameraController = CameraController;
window.changeZoom = changeZoom;
window.resetCamera = resetCamera;

window.MinimapSystem = MinimapSystem;
window.renderMinimap = renderMinimap;
window.initMinimapEvents = initMinimapEvents;

window.CanvasRenderer = CanvasRenderer;
window.renderMap = renderMap;
window.resizeCanvas = resizeCanvas;
window.scheduleRender = scheduleRender;
window.startRenderLoop = startRenderLoop;
window.stopRenderLoop = stopRenderLoop;
window.getCurrentFps = getCurrentFps;

// Re-exposição global (Fase 6.4 — Controladores dos Painéis Modais Especializados)
window.BankingPanel = BankingPanel;
window.AdvisorPanel = AdvisorPanel;
window.DREPanel = DREPanel;
window.TechTreePanel = TechTreePanel;
window.RDPanel = RDPanel;
window.EncyclopediaPanel = EncyclopediaPanel;
window.FacilityPanel = FacilityPanel;

// Re-exposição global (Fase 6.5 — Input & Ciclo de Vida do Jogo)
window.KeyboardSystem = KeyboardSystem;
window.toggleTheaterMode = () => KeyboardSystem.toggleTheaterMode();

window.MouseSystem = MouseSystem;

window.AppLifecycle = AppLifecycle;
window.showMainMenu = () => AppLifecycle.showMainMenu();
window.hideMainMenu = () => AppLifecycle.hideMainMenu();
window.continueLastGame = () => AppLifecycle.continueLastGame();
window.togglePauseMenu = () => AppLifecycle.togglePauseMenu();
window.pauseGameAndShowMenu = () => AppLifecycle.pauseGameAndShowMenu();
window.resumeGame = () => AppLifecycle.resumeGame();
window.syncPauseMenuVolumes = () => AppLifecycle.syncPauseMenuVolumes();
window.syncVolumeFromPause = (c, v) => AppLifecycle.syncVolumeFromPause(c, v);
window.promptExitToMainMenu = () => AppLifecycle.promptExitToMainMenu();
window.closeConfirmExitModal = () => AppLifecycle.closeConfirmExitModal();
window.saveAndExitToMainMenu = () => AppLifecycle.saveAndExitToMainMenu();
window.exitToMainMenuWithoutSaving = () => AppLifecycle.exitToMainMenuWithoutSaving();
window.openNewGameWizard = () => AppLifecycle.openNewGameWizard();
window.closeNewGameWizard = () => AppLifecycle.closeNewGameWizard();
window.randomizePlayerName = () => AppLifecycle.randomizePlayerName();
window.randomizeCompanyName = () => AppLifecycle.randomizeCompanyName();
window.regenerateWizLogo = () => AppLifecycle.regenerateWizLogo();
window.selectWizAvatar = (id) => AppLifecycle.selectWizAvatar(id);
window.selectWizColor = (id) => AppLifecycle.selectWizColor(id);
window.selectWizDifficulty = (id) => AppLifecycle.selectWizDifficulty(id);
window.startNewGameFromWizard = () => AppLifecycle.startNewGameFromWizard();
window.toggleTutorialWidget = () => AppLifecycle.toggleTutorialWidget();
window.checkTutorialProgress = () => AppLifecycle.checkTutorialProgress();
window.renderTutorialGuide = () => AppLifecycle.renderTutorialGuide();
window.claimTutorialReward = () => AppLifecycle.claimTutorialReward();
window.loadGameSettings = () => AppLifecycle.loadGameSettings();
window.saveGameSettings = () => AppLifecycle.saveGameSettings();
window.openSettingsModal = () => AppLifecycle.openSettingsModal();
window.closeSettingsModal = () => AppLifecycle.closeSettingsModal();
window.toggleBgmPlayPause = () => AppLifecycle.toggleBgmPlayPause();
window.skipBgmTrack = () => AppLifecycle.skipBgmTrack();
window.updateBgmStatusUI = () => AppLifecycle.updateBgmStatusUI();
window.initMicroRadio = () => AppLifecycle.initMicroRadio();
window.updateRadioUI = (s) => AppLifecycle.updateRadioUI(s);
window.openSaveLoadModal = (m) => AppLifecycle.openSaveLoadModal(m);
window.closeSaveLoadModal = () => AppLifecycle.closeSaveLoadModal();
window.renderSavesList = () => AppLifecycle.renderSavesList();
window.renderSavesCountInMenu = () => AppLifecycle.renderSavesCountInMenu();
window.updatePlayerProfileHUD = () => AppLifecycle.updatePlayerProfileHUD();

// Re-exposição global (Fase 7.0 A — Wizards de Construção, Lojas & Fornecedores)
window.ConstructionWizards = ConstructionWizards;
window.openMineModal = (tile) => ConstructionWizards.openMineModal(tile);
window.confirmBuildMine = (mineId) => ConstructionWizards.confirmBuildMine(mineId);
window.confirmBuildMineDirect = (x, y, mineId) => ConstructionWizards.confirmBuildMineDirect(x, y, mineId);
window.closeMineModal = () => ConstructionWizards.closeMineModal();

window.openFarmModal = (tile) => ConstructionWizards.openFarmModal(tile);
window.renderFarmTypesList = (s) => ConstructionWizards.renderFarmTypesList(s);
window.filterFarmTypes = (q) => ConstructionWizards.filterFarmTypes(q);
window.confirmBuildFarm = (id) => ConstructionWizards.confirmBuildFarm(id);
window.closeFarmModal = () => ConstructionWizards.closeFarmModal();

window.openFactoryModal = (tile) => ConstructionWizards.openFactoryModal(tile);
window.confirmBuildFactory = () => ConstructionWizards.confirmBuildFactory();
window.closeFactoryModal = () => ConstructionWizards.closeFactoryModal();
window.openFactoryRecipeModal = (x, y) => ConstructionWizards.openFactoryRecipeModal(x, y);
window.setFactoryRecipeCategoryFilter = (cat) => ConstructionWizards.setFactoryRecipeCategoryFilter(cat);
window.unlockFactoryRecipeInPlace = (r, p, c) => ConstructionWizards.unlockFactoryRecipeInPlace(r, p, c);
window.renderFactoryRecipesList = () => ConstructionWizards.renderFactoryRecipesList();
window.confirmActivateFactoryRecipe = (id) => ConstructionWizards.confirmActivateFactoryRecipe(id);
window.removeFactoryLine = (x, y, k) => ConstructionWizards.removeFactoryLine(x, y, k);
window.closeFactoryRecipeModal = () => ConstructionWizards.closeFactoryRecipeModal();
window.recalculateFactoryLineEconomics = (l, t) => ConstructionWizards.recalculateFactoryLineEconomics(l, t);
window.getDefaultSupplierForInput = (i, t) => ConstructionWizards.getDefaultSupplierForInput(i, t);

window.StoreWizard = StoreWizard;
window.openStoreWizard = (tile) => StoreWizard.openStoreWizard(tile);
window.openStoreModal = (tile) => StoreWizard.openStoreWizard(tile);
window.selectStoreType = (id) => StoreWizard.selectStoreType(id);
window.advanceToStep2 = () => StoreWizard.advanceToStep2();
window.backToStep1 = () => StoreWizard.backToStep1();
window.filterProductSelectorSearch = (q) => StoreWizard.filterProductSelectorSearch(q);
window.renderProductSelector = () => StoreWizard.renderProductSelector();
window.setCategoryTab = (cat) => StoreWizard.setCategoryTab(cat);
window.toggleProductInWizard = (id) => StoreWizard.toggleProductInWizard(id);
window.confirmOpenStore = () => StoreWizard.confirmOpenStore();
window.closeStoreWizard = () => StoreWizard.closeStoreWizard();

window.openAddProductModal = (x, y) => StoreWizard.openAddProductModal(x, y);
window.setAddProductCategoryTab = (cat) => StoreWizard.setAddProductCategoryTab(cat);
window.renderAddProductModalList = () => StoreWizard.renderAddProductModalList();
window.confirmAddNewProductToStore = (id) => StoreWizard.confirmAddNewProductToStore(id);
window.closeAddProductModal = () => StoreWizard.closeAddProductModal();
window.removeProductFromStore = (x, y, id) => StoreWizard.removeProductFromStore(x, y, id);
window.updateShelfPrice = (x, y, id, v) => StoreWizard.updateShelfPrice(x, y, id, v);
window.updateShelfRestock = (x, y, id, v) => StoreWizard.updateShelfRestock(x, y, id, v);
window.buyInstantStock = (x, y, id, q) => StoreWizard.buyInstantStock(x, y, id, q);

window.SupplierPicker = SupplierPicker;
window.renderSupplierOptionCard = (o, c, f) => SupplierPicker.renderSupplierOptionCard(o, c, f);
window.openSupplierModal = (x, y, id) => SupplierPicker.openSupplierModal(x, y, id);
window.applySupplierChange = (id) => SupplierPicker.applySupplierChange(id);
window.closeSupplierModal = () => SupplierPicker.closeSupplierModal();
window.openFactoryInputSupplierModal = (x, y, l, i) => SupplierPicker.openFactoryInputSupplierModal(x, y, l, i);
window.applyFactoryInputSupplierChange = (id) => SupplierPicker.applyFactoryInputSupplierChange(id);
window.openFarmFeedSupplierModal = (x, y) => SupplierPicker.openFarmFeedSupplierModal(x, y);
window.applyFarmFeedSupplierChange = (s, g) => SupplierPicker.applyFarmFeedSupplierChange(s, g);
window.disconnectFarmFeed = (x, y) => SupplierPicker.disconnectFarmFeed(x, y);
window.openPortModal = (port) => SupplierPicker.openPortModal(port);
window.closePortModal = () => SupplierPicker.closePortModal();

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
    try {
      Object.defineProperty(window, prop, {
        get() { return (window.GameState || GameState)[prop]; },
        set(val) {
          if (window.GameState) window.GameState[prop] = val;
          GameState[prop] = val;
        },
        configurable: true
      });
    } catch (e) {}
  }
}

// Notifica que todos os módulos foram carregados e vinculados com sucesso
if (typeof window !== 'undefined') {
  window.__OIKO_MODULES_READY__ = true;
  window.dispatchEvent(new CustomEvent('oiko:ready'));
}
