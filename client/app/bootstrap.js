// ===========================================================================
// OIKONOMIA — SISTEMA DE BOOTSTRAP & INICIALIZAÇÃO DO JOGO
// client/app/bootstrap.js
// ===========================================================================

import { AppLifecycle } from './lifecycle.js';
import { HUDSystem } from '../ui/hud.js';
import { NavigationSystem } from '../ui/navigation.js';
import { WindowManager } from '../ui/window_manager.js';
import { KeyboardSystem } from '../input/keyboard.js';
import { MouseSystem } from '../input/mouse.js';
import { MinimapSystem } from '../renderer/minimap.js';
import { CanvasRenderer } from '../renderer/canvas_renderer.js';
import { CameraController } from '../renderer/camera.js';
import { WorldGridEngine } from '../engine/world_grid.js';
import { AdvisorPanel } from '../ui/panels/advisor_panel.js';
import { DREPanel } from '../ui/panels/dre_panel.js';
import { BankingPanel } from '../ui/panels/banking_panel.js';
import { FacilityPanel } from '../ui/panels/facility_panel.js';
import { RDPanel } from '../ui/panels/rd_panel.js';
import { TechTreePanel } from '../ui/panels/tech_tree_panel.js';
import { EncyclopediaPanel } from '../ui/panels/encyclopedia_panel.js';
import { MarketingPanel } from '../ui/panels/marketing_panel.js';
import { StoreWizard } from '../ui/wizards/store_wizard.js';
import { ConstructionWizards } from '../ui/wizards/construction_wizards.js';
import { SupplierPicker } from '../ui/wizards/supplier_picker.js';
import { PriceSimulatorPanel } from '../ui/panels/price_simulator_panel.js';
import { DevDashboardPanel } from '../ui/panels/dev_dashboard_panel.js';
import TickerSystem from '../ticker_system.js';

// Inicializa variáveis globais de estado de interação de tile no window
export function initInteractionState() {
  if (typeof window === 'undefined') return;

  if (window.selectedTileX === undefined) window.selectedTileX = -1;
  if (window.selectedTileY === undefined) window.selectedTileY = -1;
  if (window.hoveredTileX === undefined) window.hoveredTileX = -1;
  if (window.hoveredTileY === undefined) window.hoveredTileY = -1;
  if (window.wasDragging === undefined) window.wasDragging = false;
  if (window.currentHeatmap === undefined) window.currentHeatmap = 'terrain';

  if (window.pendingTile === undefined) window.pendingTile = null;
  if (window.pendingStoreType === undefined) window.pendingStoreType = null;
  if (window.selectedProductsMap === undefined) window.selectedProductsMap = new Map();
  if (window.activeCategoryTab === undefined) window.activeCategoryTab = 'Alimentos';
  if (window.activeSearchQuery === undefined) window.activeSearchQuery = '';
  if (window.activeManagedTile === undefined) window.activeManagedTile = null;
  if (window.supplierTargetShelf === undefined) window.supplierTargetShelf = null;
  if (window.addProductTargetTile === undefined) window.addProductTargetTile = null;
  if (window.activeAddProductCategoryTab === undefined) window.activeAddProductCategoryTab = 'Alimentos';
  if (window.activeFactoryTile === undefined) window.activeFactoryTile = null;
  if (window._needsRender === undefined) window._needsRender = true;
}

// Vincula todas as funções de painéis e wizards no escopo de window para compatibilidade 100% com onclick inline
export function bindGlobalPanelMethods() {
  if (typeof window === 'undefined') return;

  // Diretoria Executiva (AdvisorPanel)
  window.toggleExecutiveBoardModal = () => AdvisorPanel.toggleExecutiveBoardModal();
  window.openExecutiveBoardModal = () => AdvisorPanel.openExecutiveBoardModal();
  window.closeExecutiveBoardModal = () => AdvisorPanel.closeExecutiveBoardModal();
  window.refreshExecutiveBoard = () => AdvisorPanel.refreshExecutiveBoard();
  window.setAdvisorVerbosity = (mode) => AdvisorPanel.setAdvisorVerbosity(mode);
  window.setAdvisorActiveTab = (tab) => AdvisorPanel.setAdvisorActiveTab(tab);
  window.dismissAdvisorAlert = (id) => AdvisorPanel.dismissAdvisorAlert(id);
  window.snoozeAdvisorAlert = (id, m) => AdvisorPanel.snoozeAdvisorAlert(id, m);
  window.executeAdvisorDeepLink = (action) => AdvisorPanel.executeAdvisorDeepLink(action);
  window.renderExecutiveBoardModal = () => AdvisorPanel.renderExecutiveBoardModal();

  // DRE & Finanças Corporativas (DREPanel)
  window.syncDREValues = (g, c, r, m, n, f, nw) => DREPanel.syncDREValues(g, c, r, m, n, f, nw);
  window.openFacilityDREModal = () => DREPanel.openFacilityDREModal();
  window.closeFacilityDREModal = () => DREPanel.closeFacilityDREModal();
  window.toggleDREModal = () => DREPanel.toggleDREModal();
  window.calculateCorporateNetWorth = () => DREPanel.calculateCorporateNetWorth();
  window.renderFacilityDRETable = () => DREPanel.renderFacilityDRETable();
  window.openInsolvencyModal = (nwObj) => DREPanel.openInsolvencyModal(nwObj);
  window.closeInsolvencyModal = () => DREPanel.closeInsolvencyModal();
  window.showBankruptcyModal = (nwObj) => DREPanel.showBankruptcyModal(nwObj);

  // Sistema Bancário (BankingPanel)
  window.calcAverageQRAllResearched = () => BankingPanel.calcAverageQRAllResearched();
  window.calcAverageBrandRating = () => BankingPanel.calcAverageBrandRating();
  window.calcBankingCreditScore = () => BankingPanel.calcBankingCreditScore();
  window.processBankingInstallments = () => BankingPanel.processBankingInstallments();
  window.openBankModal = () => BankingPanel.openBankModal();
  window.closeBankModal = () => BankingPanel.closeBankModal();
  window.updateBankHUDBadge = () => BankingPanel.updateBankHUDBadge();
  window.renderBankTab = (tabId) => BankingPanel.renderBankTab(tabId);

  // Inspetor de Tile & Controles de Instalação (FacilityPanel)
  window.renderTileInspector = (tile) => FacilityPanel.renderTileInspector(tile);
  window.calculateFacilityValue = (tile) => FacilityPanel.calculateFacilityValue(tile);
  window.renderFacilityFooterActions = (tile, extraBtn) => FacilityPanel.renderFacilityFooterActions(tile, extraBtn);
  window.openFacilityConfirmModal = (opts) => FacilityPanel.openFacilityConfirmModal(opts);
  window.closeFacilityConfirmModal = () => FacilityPanel.closeFacilityConfirmModal();
  window.sellFacility = (x, y) => FacilityPanel.sellFacility(x, y);
  window.demolishFacility = (x, y) => FacilityPanel.demolishFacility(x, y);
  window.openFloatingFacilityWindow = (tile) => FacilityPanel.openFloatingFacilityWindow(tile);
  window.closeFloatingFacilityWindow = () => FacilityPanel.closeFloatingFacilityWindow();
  window.renderFacilityPanel = (tile) => FacilityPanel.renderFacilityPanel(tile);
  window.renderIdlePanel = () => FacilityPanel.renderIdlePanel();
  window.renderEmptyLotPanel = (tile) => FacilityPanel.renderEmptyLotPanel(tile);
  window.renderMinePanel = (tile) => FacilityPanel.renderMinePanel(tile);
  window.renderFarmPanel = (tile) => FacilityPanel.renderFarmPanel(tile);
  window.renderFactoryPanel = (tile) => FacilityPanel.renderFactoryPanel(tile);
  window.setFactoryFacade = (x, y, skin) => FacilityPanel.setFactoryFacade(x, y, skin);
  window.renderStorePanel = (tile) => FacilityPanel.renderStorePanel(tile);
  window.renderRDCenterPanel = (tile) => FacilityPanel.renderRDCenterPanel(tile);
  window.toggleRDPatentsExpanded = () => FacilityPanel.toggleRDPatentsExpanded();
  window.showCustomConfirmModal = (opts) => FacilityPanel.showCustomConfirmModal(opts);
  window.closeCustomConfirmModal = (c) => FacilityPanel.closeCustomConfirmModal(c);
  window.executeCustomConfirmModal = () => FacilityPanel.executeCustomConfirmModal();
  window.checkWorkingCapitalSafety = (cost, onProceed, name) => FacilityPanel.checkWorkingCapitalSafety(cost, onProceed, name);
  window.confirmBuildRDCenter = (x, y) => FacilityPanel.confirmBuildRDCenter(x, y);

  // Pesquisa & Desenvolvimento (RDPanel)
  window.openRDCenterModal = () => RDPanel.openRDCenterModal();
  window.closeRDCenterModal = () => RDPanel.closeRDCenterModal();
  window.getBuiltRDCentersCount = () => RDPanel.getBuiltRDCentersCount();
  window.getRDTotalLabCapacity = () => RDPanel.getRDTotalLabCapacity();
  window.getRDUsedLabSlots = () => RDPanel.getRDUsedLabSlots();
  window.getProductBestRDQuality = (id) => RDPanel.getProductBestRDQuality(id);
  window.setRDProjectsFilter = (f) => RDPanel.setRDProjectsFilter(f);
  window.renderRDProjectsList = () => RDPanel.renderRDProjectsList();
  window.switchRDTab = (tab) => RDPanel.switchRDTab(tab);
  window.renderRDMarketList = () => RDPanel.renderRDMarketList();
  window.buyCompetitorTech = (c, p, q, cost) => RDPanel.buyCompetitorTech(c, p, q, cost);
  window.setRDLabsCount = (n) => RDPanel.setRDLabsCount(n);
  window.setRDWizardFilter = (t, v) => RDPanel.setRDWizardFilter(t, v);
  window.onRDWizardSearchInput = (v) => RDPanel.onRDWizardSearchInput(v);
  window.clearRDWizardSearch = () => RDPanel.clearRDWizardSearch();
  window.selectRDWizardProduct = (id) => RDPanel.selectRDWizardProduct(id);
  window.renderRDWizardProductList = () => RDPanel.renderRDWizardProductList();
  window.onRDProductSelectChange = (id) => RDPanel.onRDProductSelectChange(id);
  window.openRDNewProjectModal = (cat, prodId) => RDPanel.openRDNewProjectModal(cat, prodId);
  window.closeRDNewProjectModal = () => RDPanel.closeRDNewProjectModal();
  window.updateRDWizardPreview = () => RDPanel.updateRDWizardPreview();
  window.getRDCurrentQR = (id) => RDPanel.getRDCurrentQR(id);
  window.startRDProject = () => RDPanel.startRDProject();
  window.pauseRDProject = (id) => RDPanel.pauseRDProject(id);
  window.resumeRDProject = (id) => RDPanel.resumeRDProject(id);
  window.cancelRDProject = (id) => RDPanel.cancelRDProject(id);
  window.adjustRDBudget = (id, delta) => RDPanel.adjustRDBudget(id, delta);
  window.processRDProgress = () => RDPanel.processRDProgress();
  window.updateAllFactoryLinesQR = (id, qr) => RDPanel.updateAllFactoryLinesQR(id, qr);
  window.propagateQualityRD = (id, qr) => RDPanel.propagateQualityRD(id, qr);
  window.updateRDChip = () => RDPanel.updateRDChip();

  // Árvore Tecnológica (TechTreePanel)
  window.openTechTreeModal = (cat, tier, root) => TechTreePanel.openTechTreeModal(cat, tier, root);
  window.closeTechTreeModal = () => TechTreePanel.closeTechTreeModal();
  window.focusTechLineage = (id) => TechTreePanel.focusTechLineage(id);
  window.clearTechLineage = () => TechTreePanel.clearTechLineage();
  window.setTechLineageFilter = (f) => TechTreePanel.setTechLineageFilter(f);
  window.filterTechTree = (tier) => TechTreePanel.filterTechTree(tier);
  window.renderTechTree = (target) => TechTreePanel.renderTechTree(target);
  window.researchProductTech = (id) => TechTreePanel.researchProductTech(id);
  window.isProductUnlocked = (id) => TechTreePanel.isProductUnlocked(id);

  // Enciclopédia Interativa (EncyclopediaPanel)
  window.encyclopediaState = EncyclopediaPanel.state;
  window.openEncyclopediaModal = (tab, id) => EncyclopediaPanel.openEncyclopediaModal(tab, id);
  window.closeEncyclopediaModal = () => EncyclopediaPanel.closeEncyclopediaModal();
  window.toggleEncyclopediaModal = () => EncyclopediaPanel.toggleEncyclopediaModal();
  window.navigateEncyclopedia = (t, id) => EncyclopediaPanel.navigateEncyclopedia(t, id);
  window.encyclopediaHistoryBack = () => EncyclopediaPanel.encyclopediaHistoryBack();
  window.encyclopediaHistoryForward = () => EncyclopediaPanel.encyclopediaHistoryForward();
  window.updateEncyclopediaHistoryButtons = () => EncyclopediaPanel.updateEncyclopediaHistoryButtons();
  window.switchEncyclopediaTab = (tab) => EncyclopediaPanel.switchEncyclopediaTab(tab);
  window.updateEncyclopediaTabButtons = () => EncyclopediaPanel.updateEncyclopediaTabButtons();
  window.onEncyclopediaSearch = (q) => EncyclopediaPanel.onEncyclopediaSearch(q);
  window.clearEncyclopediaSearch = () => EncyclopediaPanel.clearEncyclopediaSearch();
  window.renderEncyclopediaContent = () => EncyclopediaPanel.renderEncyclopediaContent();
  window.renderEncyclopediaProductsView = () => EncyclopediaPanel.renderEncyclopediaProductsView();
  window.setEncyclopediaCategoryFilter = (c) => EncyclopediaPanel.setEncyclopediaCategoryFilter(c);
  window.setEncyclopediaTierFilter = (t) => EncyclopediaPanel.setEncyclopediaTierFilter(t);
  window.renderEncyclopediaFactoriesView = () => EncyclopediaPanel.renderEncyclopediaFactoriesView();
  window.renderEncyclopediaStoresView = () => EncyclopediaPanel.renderEncyclopediaStoresView();
  window.renderEncyclopediaResourcesView = () => EncyclopediaPanel.renderEncyclopediaResourcesView();
  window.renderEncyclopediaCitiesView = () => EncyclopediaPanel.renderEncyclopediaCitiesView();
  window.renderEncyclopediaCalculatorView = () => EncyclopediaPanel.renderEncyclopediaCalculatorView();
  window.updateEncyclopediaCalcProduct = (p) => EncyclopediaPanel.updateEncyclopediaCalcProduct(p);
  window.updateEncyclopediaCalcAmount = (a) => EncyclopediaPanel.updateEncyclopediaCalcAmount(a);
  window.renderEncyclopediaConceptsView = () => EncyclopediaPanel.renderEncyclopediaConceptsView();

  // Central de Marketing (MarketingPanel)
  window.openMarketingCentralModal = (filterOutletId) => MarketingPanel.openMarketingCentralModal(filterOutletId);
  window.toggleMarketingContract = (outletId, prodId) => MarketingPanel.toggleMarketingContract(outletId, prodId);
  window.closeMarketingModal = () => MarketingPanel.closeMarketingModal();
  window.toggleMarketingModal = (filterOutletId) => MarketingPanel.toggleMarketingModal(filterOutletId);
  window.getTotalMonthlyMarketingBudget = () => MarketingPanel.getTotalMonthlyMarketingBudget();

  // Fornecedores & Lojas (SupplierPicker & StoreWizard)
  window.getSupplierOffersForProduct = (prodId, storeTile) => SupplierPicker.getSupplierOffersForProduct(prodId, storeTile);
  window.hasNicheLicense = (typeId) => StoreWizard.hasNicheLicense(typeId);
  window.getNicheLicenseCost = (typeId) => StoreWizard.getNicheLicenseCost(typeId);
  window.updateStepIndicator = (step) => StoreWizard.updateStepIndicator(step);
  window.renderStoreTypeCards = () => StoreWizard.renderStoreTypeCards();
  window.updateCostSummary = () => StoreWizard.updateCostSummary();
  window.filterProductSelectorSearch = (query) => StoreWizard.filterProductSelectorSearch(query);
  window.renderProductSelector = (container) => StoreWizard.renderProductSelector(container);

  // Resize listener
  window.addEventListener('resize', () => {
    if (typeof window.resizeCanvas === 'function') window.resizeCanvas();
    if (typeof window.scheduleRender === 'function') window.scheduleRender();
  });
}

// Inicialização assíncrona de dados mestres
export async function initMasterData() {
  if (typeof window === 'undefined') return;
  const catalog = window.PRODUCT_CATALOG || {};
  const brandRating = window.playerBrandRating || (window.GameState && window.GameState.playerBrandRating) || {};
  Object.keys(catalog).forEach(id => {
    if (!brandRating[id]) brandRating[id] = 20;
  });
}

let _engineBooted = false;

// Sequência principal de boot da engine
export async function bootEngine(force = false) {
  if (typeof window === 'undefined') return;
  if (_engineBooted && !force) return;
  _engineBooted = true;

  // Aguarda os módulos ES estarem prontos (evita race condition no Vite)
  if (!window.__OIKO_MODULES_READY__) {
    await new Promise(resolve => {
      if (window.__OIKO_MODULES_READY__) return resolve();
      const onReady = () => {
        window.removeEventListener('oiko:ready', onReady);
        resolve();
      };
      window.addEventListener('oiko:ready', onReady);
      let elapsed = 0;
      const poll = setInterval(() => {
        elapsed += 50;
        if (window.__OIKO_MODULES_READY__ || (window.PRODUCT_CATALOG && Object.keys(window.PRODUCT_CATALOG).length > 0) || elapsed >= 10000) {
          clearInterval(poll);
          window.removeEventListener('oiko:ready', onReady);
          resolve();
        }
      }, 50);
    });
  }

  // Inicializa estado de interação e bindings
  initInteractionState();
  bindGlobalPanelMethods();

  if (typeof AppLifecycle?.loadGameSettings === 'function') AppLifecycle.loadGameSettings();
  await initMasterData();

  // Garante grid gerado
  if ((!window.worldGrid || window.worldGrid.length === 0) && typeof WorldGridEngine?.initWorldGrid === 'function') {
    WorldGridEngine.initWorldGrid();
  }

  if (typeof CanvasRenderer?.resizeCanvas === 'function') CanvasRenderer.resizeCanvas();
  if (typeof CameraController?.resetCamera === 'function') CameraController.resetCamera();
  if (typeof FacilityPanel?.renderTileInspector === 'function') FacilityPanel.renderTileInspector(null);
  if (typeof FacilityPanel?.renderIdlePanel === 'function') FacilityPanel.renderIdlePanel();
  if (typeof AppLifecycle?.updatePlayerProfileHUD === 'function') AppLifecycle.updatePlayerProfileHUD();
  if (typeof HUDSystem?.updateHUD === 'function') HUDSystem.updateHUD();
  if (typeof WindowManager?.initAllDraggableWindows === 'function') WindowManager.initAllDraggableWindows();
  if (typeof AppLifecycle?.initMicroRadio === 'function') AppLifecycle.initMicroRadio();

  if (TickerSystem && typeof TickerSystem.init === 'function') {
    TickerSystem.init('ticker-track');
  }

  if (KeyboardSystem && typeof KeyboardSystem.init === 'function') {
    KeyboardSystem.init();
  }
  if (MouseSystem && typeof MouseSystem.init === 'function') {
    MouseSystem.init();
  }
  if (MinimapSystem && typeof MinimapSystem.initMinimapEvents === 'function') {
    MinimapSystem.initMinimapEvents();
  }

  if (typeof AppLifecycle?.startBootSequence === 'function') {
    AppLifecycle.startBootSequence();
  }

  // Ticker de tempo real jogado (Playtime persistente)
  setInterval(() => {
    if (window.currentAppScreen === 'PLAYING' && window.gameSpeed > 0) {
      window.playtimeSeconds = (window.playtimeSeconds || 0) + 1;
      if (window.GameState) window.GameState.playtimeSeconds = window.playtimeSeconds;
    }
  }, 1000);
}

if (typeof window !== 'undefined') {
  window.bootEngine = bootEngine;
  window.initMasterData = initMasterData;
  initInteractionState();
  bindGlobalPanelMethods();
}

export default {
  initInteractionState,
  bindGlobalPanelMethods,
  initMasterData,
  bootEngine
};
