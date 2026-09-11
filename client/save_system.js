/**
 * save_system.js — Sistema de Persistência, Versionamento e Migração de Saves
 * OIKONOMIA v0.8.5
 */

import { AVATAR_CATALOG, COLOR_PALETTES, DIFFICULTY_PRESETS } from './game_config.js';
import { MAP_WIDTH } from './map_data.js';
import { seedRecoveredSavesIfMissing } from './recovered_saves_seed.js';

export const GAME_VERSION_INFO = {
  major: 0,
  minor: 8,
  patch: 5,
  build: '20260908.02',
  saveSchema: '0.8.2',
  get version() { return `${this.major}.${this.minor}.${this.patch}`; },
  get fullString() { return `v${this.version} (bld.${this.build})`; }
};

export const SAVES_STORAGE_KEY = 'oikonomia_save_slots_v1';
export const CURRENT_SAVE_VERSION = GAME_VERSION_INFO.saveSchema;

/**
 * Pipeline de Migração e Sanitização de Saves
 */
export function migrateSaveData(rawSave) {
  if (!rawSave || typeof rawSave !== 'object') return null;

  const migrated = { ...rawSave };
  const rawVer = String(migrated.saveVersion || '0.1.0');
  const gridSize = MAP_WIDTH || 128;

  // 1. Sanitização do Perfil da Empresa
  const prof = migrated.playerProfile || {};
  const validAvatar = AVATAR_CATALOG.some(a => a.id === prof.avatarId) ? prof.avatarId : 'human_ceo';
  const validColor = COLOR_PALETTES.some(c => c.id === prof.themeColor) ? prof.themeColor : 'emerald';
  const validDiff = DIFFICULTY_PRESETS.some(d => d.id === prof.difficulty) ? prof.difficulty : 'standard';

  migrated.playerProfile = {
    playerName: (typeof prof.playerName === 'string' && prof.playerName.trim()) ? prof.playerName.trim().slice(0, 30) : 'Arthur Vance',
    companyName: (typeof prof.companyName === 'string' && prof.companyName.trim()) ? prof.companyName.trim().slice(0, 35) : 'OikoCorp Holding',
    avatarId: validAvatar,
    themeColor: validColor,
    difficulty: validDiff,
    logoRegenSeed: Number.isInteger(prof.logoRegenSeed) ? prof.logoRegenSeed : 0
  };

  // 2. Sanitização Numérica de Finanças e Tempo
  const numCash = Number(migrated.cash);
  migrated.cash = (!isNaN(numCash) && isFinite(numCash)) ? Number(numCash.toFixed(2)) : 100000.00;

  const numDay = parseInt(migrated.day, 10);
  migrated.day = (!isNaN(numDay) && numDay >= 1 && numDay <= 31) ? numDay : 1;

  const numMonth = parseInt(migrated.month, 10);
  migrated.month = (!isNaN(numMonth) && numMonth >= 1 && numMonth <= 12) ? numMonth : 1;

  const numYear = parseInt(migrated.year, 10);
  migrated.year = (!isNaN(numYear) && numYear >= 1) ? numYear : 1;

  const numPlaytime = parseInt(migrated.playtimeSeconds, 10);
  migrated.playtimeSeconds = (!isNaN(numPlaytime) && numPlaytime >= 0) ? numPlaytime : 0;

  // 3. Sanitização de Cidades Desbloqueadas
  const rawCities = migrated.unlockedCities || {};
  migrated.unlockedCities = {
    nova_atenas: true,
    porto_real: true,
    montargis: Boolean(rawCities.montargis),
    varzea: Boolean(rawCities.varzea)
  };

  // 4. Sanitização de Marca e Marketing
  migrated.playerBrandRating = (migrated.playerBrandRating && typeof migrated.playerBrandRating === 'object')
    ? { ...migrated.playerBrandRating }
    : {};
  
  migrated.activeMarketingContracts = Array.isArray(migrated.activeMarketingContracts)
    ? migrated.activeMarketingContracts.filter(c => typeof c === 'string' && c.includes('::'))
    : [];

  // 5. Migração de P&D — rdLabs (novo em v0.8.0; saves antigos recebem {} vazio)
  if (!migrated.rdLabs || typeof migrated.rdLabs !== 'object' || Array.isArray(migrated.rdLabs)) {
    migrated.rdLabs = {};
  } else {
    const sanitized = {};
    for (const [key, proj] of Object.entries(migrated.rdLabs)) {
      if (proj && typeof proj.productId === 'string' && typeof proj.currentQR === 'number') {
        proj.status = proj.status || 'active';
        proj.monthsInvested = proj.monthsInvested || 0;
        proj.totalSpent = proj.totalSpent || 0;
        sanitized[key] = proj;
      }
    }
    migrated.rdLabs = sanitized;
  }

  // 6. Sanitização de Séries Temporais — historicalLedger
  if (Array.isArray(migrated.historicalLedger)) {
    migrated.historicalLedger = migrated.historicalLedger.slice(-24);
  } else {
    migrated.historicalLedger = [];
  }

  const rawTiles = Array.isArray(migrated.builtTiles) ? migrated.builtTiles : [];
  migrated.builtTiles = rawTiles.filter(t => {
    return t && typeof t.x === 'number' && t.x >= 0 && t.x < gridSize &&
           typeof t.y === 'number' && t.y >= 0 && t.y < gridSize &&
           (t.store || t.mine || t.farm || t.factory || t.rdCenter || t.warehouse || t.competitor);
  });

  // 7. Migração do Sistema Bancário (novo em v0.8.5; saves antigos recebem estado vazio)
  if (!migrated.banking || typeof migrated.banking !== 'object') {
    migrated.banking = { activeLoans: [], totalDebt: 0, loanHistory: [] };
  } else {
    const b = migrated.banking;
    migrated.banking = {
      activeLoans: Array.isArray(b.activeLoans) ? b.activeLoans.filter(l => l && l.id && typeof l.remainingBalance === 'number') : [],
      totalDebt:   typeof b.totalDebt === 'number' && isFinite(b.totalDebt) ? b.totalDebt : 0,
      loanHistory: Array.isArray(b.loanHistory) ? b.loanHistory : [],
    };
    // Recalcula totalDebt a partir dos loans ativos (garante consistência)
    migrated.banking.totalDebt = migrated.banking.activeLoans.reduce((s, l) => s + (l.remainingBalance || 0), 0);
  }

  // 8. Sanitização de Configurações e Áudio (novo em v0.8.4; preserva volume, mute e rádio)
  const rawSet = migrated.settings || {};
  migrated.settings = {
    autoSave: ['monthly', 'yearly', 'disabled'].includes(rawSet.autoSave) ? rawSet.autoSave : 'monthly',
    masterVolume: typeof rawSet.masterVolume === 'number' && !isNaN(rawSet.masterVolume) ? Math.max(0, Math.min(1, rawSet.masterVolume)) : 1.0,
    musicVolume: typeof rawSet.musicVolume === 'number' && !isNaN(rawSet.musicVolume) ? Math.max(0, Math.min(1, rawSet.musicVolume)) : 0.6,
    ambienceVolume: typeof rawSet.ambienceVolume === 'number' && !isNaN(rawSet.ambienceVolume) ? Math.max(0, Math.min(1, rawSet.ambienceVolume)) : 0.5,
    sfxVolume: typeof rawSet.sfxVolume === 'number' && !isNaN(rawSet.sfxVolume) ? Math.max(0, Math.min(1, rawSet.sfxVolume)) : 0.7,
    isMusicMuted: Boolean(rawSet.isMusicMuted),
    repeatMode: (rawSet.repeatMode === 'track') ? 'track' : 'playlist',
    currentBgmKey: (typeof rawSet.currentBgmKey === 'string' && rawSet.currentBgmKey) ? rawSet.currentBgmKey : 'bgm_1'
  };

  // 9. Sanitização de Tutorial (novo em v0.8.2)
  if (migrated.tutorialState && typeof migrated.tutorialState === 'object') {
    migrated.tutorialState = {
      completedSteps: (migrated.tutorialState.completedSteps && typeof migrated.tutorialState.completedSteps === 'object')
        ? { ...migrated.tutorialState.completedSteps }
        : {},
      rewardClaimed: Boolean(migrated.tutorialState.rewardClaimed),
      active: migrated.tutorialState.active !== false
    };
  }

  // 6. Sanitização de Fornecedores Quebrados (ex: armazém demolido no lote)
  if (Array.isArray(migrated.builtTiles)) {
    const existingTiles = new Set(migrated.builtTiles.map(t => `${t.x}_${t.y}`));
    migrated.builtTiles.forEach(t => {
      if (t.factory?.lines) {
        Object.values(t.factory.lines).forEach(line => {
          if (line.inputsConfig) {
            Object.entries(line.inputsConfig).forEach(([inpId, cfg]) => {
              if (cfg?.supplierId?.startsWith('warehouse_')) {
                const parts = cfg.supplierId.split('_');
                const wx = parts[1], wy = parts[2];
                if (!existingTiles.has(`${wx}_${wy}`)) {
                  // O armazém fornecedor foi demolido: reconecta à mina ou fábrica produtora direta
                  const altMine = migrated.builtTiles.find(m => m.mine && (m.mine.resourceId === inpId || m.mine.outputProdId === inpId));
                  if (altMine) {
                    cfg.type = 'internal_mine';
                    cfg.supplierId = `mine_${altMine.x}_${altMine.y}`;
                    cfg.supplierName = altMine.mine.name || 'Mina Própria';
                    cfg.facilityName = altMine.mine.name || 'Mina Própria';
                    cfg.origin = `Extração Mineral (${altMine.x}, ${altMine.y})`;
                  }
                }
              }
            });
          }
        });
      }
    });
  }

  // Mapeamento de migração de IDs legados em inglês para nomes canônicos do catálogo
  const LEGACY_PRODUCT_ID_MIGRATIONS = {
    painkiller: 'pain_reliever',
    perfume: 'luxury_perfume',
    coffee: 'ground_coffee',
    clothes: 't_shirt',
    shoes: 'athletic_shoes',
    appliances: 'refrigerator',
    jewelry: 'gold_watch',
    processed_food: 'cookies',
    cosmetics: 'sunscreen',
    medical_supplies: 'cold_pills',
    parts: 'engine',
    car: 'compact_car'
  };

  // 9. Sanitização e Garantia de Persistência do Armazém Logístico e Lojas (v0.8.5)
  if (Array.isArray(migrated.builtTiles)) {
    migrated.builtTiles.forEach(t => {
      // Migra gôndolas de lojas com chaves legadas
      if (t.store && t.store.shelves) {
        for (const [oldKey, newKey] of Object.entries(LEGACY_PRODUCT_ID_MIGRATIONS)) {
          if (t.store.shelves[oldKey]) {
            if (!t.store.shelves[newKey]) {
              t.store.shelves[newKey] = {
                ...t.store.shelves[oldKey],
                productId: newKey
              };
            }
            delete t.store.shelves[oldKey];
          }
        }
      }

      if (t.warehouse) {
        const wh = t.warehouse;
        wh.id = wh.id || `warehouse_${t.x}_${t.y}`;
        wh.name = wh.name || `CD & Silos Logísticos (${t.x}, ${t.y})`;
        
        // Inferência inteligente de nível pela capacidade caso level esteja desatualizado
        if (typeof wh.maxCapacity === 'number') {
          if (wh.maxCapacity >= 150000 && (!wh.level || wh.level < 3)) wh.level = 3;
          else if (wh.maxCapacity >= 60000 && (!wh.level || wh.level < 2)) wh.level = 2;
        }

        wh.level = Number.isInteger(wh.level) && wh.level >= 1 && wh.level <= 3 ? wh.level : 1;
        const expectedCap = wh.level === 3 ? 150000 : (wh.level === 2 ? 60000 : 25000);
        wh.maxCapacity = (typeof wh.maxCapacity === 'number' && wh.maxCapacity >= 25000) ? wh.maxCapacity : expectedCap;
        wh.dailyMaintenance = (typeof wh.dailyMaintenance === 'number' && wh.dailyMaintenance >= 60) ? wh.dailyMaintenance : (wh.level === 3 ? 120 : (wh.level === 2 ? 90 : 60));
        wh.inventory = (wh.inventory && typeof wh.inventory === 'object') ? wh.inventory : {};

        // Migração de chaves legadas do inventário do armazém
        for (const [oldKey, newKey] of Object.entries(LEGACY_PRODUCT_ID_MIGRATIONS)) {
          if (wh.inventory[oldKey]) {
            const oldItem = wh.inventory[oldKey];
            if (!wh.inventory[newKey]) {
              wh.inventory[newKey] = {
                ...oldItem,
                productId: newKey
              };
            } else {
              wh.inventory[newKey].stock = (wh.inventory[newKey].stock || 0) + (oldItem.stock || 0);
            }
            delete wh.inventory[oldKey];
          }
        }

        for (const [pId, item] of Object.entries(wh.inventory)) {
          if (item) {
            item.productId = item.productId || pId;
            item.stock = (typeof item.stock === 'number' && !isNaN(item.stock) && item.stock >= 0) ? Math.round(item.stock) : 0;
            item.avgUnitCost = (typeof item.avgUnitCost === 'number' && item.avgUnitCost >= 0) ? Number(item.avgUnitCost.toFixed(2)) : 1.0;
            item.quality = (typeof item.quality === 'number' && item.quality >= 0) ? Math.round(item.quality) : 60;
            item.maxQuota = (typeof item.maxQuota === 'number' && item.maxQuota > 0) ? item.maxQuota : wh.maxCapacity;
            item.safetyStock = (typeof item.safetyStock === 'number' && item.safetyStock >= 0) ? item.safetyStock : 1000;
            item.collectMode = item.collectMode || 'all_own';
            item.autoRestockPort = Boolean(item.autoRestockPort);
            item.buyOnRecessionOnly = Boolean(item.buyOnRecessionOnly);
          }
        }
      }
    });
  }

  migrated.saveVersion = CURRENT_SAVE_VERSION;
  migrated.migratedFromVersion = rawVer;
  return migrated;
}

/**
 * Reconcilia o índice de saves com quaisquer chaves oiko_save_ presentes no localStorage
 */
export function reconcileSavesIndex() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const rawIndex = localStorage.getItem(SAVES_STORAGE_KEY);
    let index = rawIndex ? JSON.parse(rawIndex) : [];
    if (!Array.isArray(index)) index = [];

    const existingIds = new Set(index.map(s => s.id));
    let modified = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('oiko_save_')) {
        const slotId = key.replace('oiko_save_', '');
        if (!existingIds.has(slotId)) {
          try {
            const rawSave = localStorage.getItem(key);
            const data = JSON.parse(rawSave);
            if (data && data.playerProfile) {
              index.push({
                id: slotId,
                companyName: data.playerProfile.companyName || 'Empresa',
                playerName: data.playerProfile.playerName || 'Jogador',
                avatarId: data.playerProfile.avatarId || 'human_ceo',
                themeColor: data.playerProfile.themeColor || 'emerald',
                cash: typeof data.cash === 'number' ? data.cash : 100000,
                gameDate: `${String(data.day || 1).padStart(2,'0')}/${String(data.month || 1).padStart(2,'0')} · Ano ${data.year || 1}`,
                dateISO: data.timestamp || new Date().toISOString(),
                builtCount: Array.isArray(data.builtTiles) ? data.builtTiles.length : 0
              });
              existingIds.add(slotId);
              modified = true;
            }
          } catch (err) {}
        }
      }
    }

    if (modified) {
      index.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
      localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(index));
    }
    return index;
  } catch (e) {
    console.error('Erro ao reconciliar índice de saves:', e);
    return [];
  }
}

/**
 * Lê o índice de metadados dos slots de save do localStorage
 */
export function getSavesIndex() {
  try {
    if (typeof seedRecoveredSavesIfMissing === 'function') {
      seedRecoveredSavesIfMissing();
    }
    return reconcileSavesIndex();
  } catch (e) {
    console.error('Erro ao ler índice de saves:', e);
    return [];
  }
}

/**
 * Persiste o índice de metadados dos slots no localStorage
 */
export function saveSavesIndex(index) {
  try {
    localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(index));
  } catch (e) {
    console.error('Erro ao salvar índice de saves:', e);
  }
}

/**
 * Serializa o estado atual do jogo em um snapshot puro
 */
export function serializeGameState(state, builtTiles = []) {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    timestamp: new Date().toISOString(),
    playerProfile: { ...state.playerProfile },
    cash: state.cash,
    day: state.day,
    month: state.month,
    year: state.year,
    unlockedCities: { ...state.unlockedCities },
    playerBrandRating: { ...state.playerBrandRating },
    activeMarketingContracts: Array.from(state.activeMarketingContracts || []),
    rdLabs: { ...state.rdLabs },
    unlockedProducts: Array.from(state.unlockedProducts || []),
    acquiredLicenses: Array.from(state.acquiredLicenses || []),
    historicalLedger: [...(state.historicalLedger || [])],
    tutorialState: { ...(state.tutorialState || {}) },
    builtTiles: Array.isArray(builtTiles) ? builtTiles : [],
    playtimeSeconds: state.playtimeSeconds || 0,
    banking: state.banking
      ? {
          activeLoans: (state.banking.activeLoans || []).map(l => ({ ...l })),
          totalDebt:   state.banking.totalDebt || 0,
          loanHistory: (state.banking.loanHistory || []).map(l => ({ ...l })),
        }
      : { activeLoans: [], totalDebt: 0, loanHistory: [] },
    settings: {
      autoSave: state.gameSettings?.autoSave || 'monthly',
      masterVolume: state.gameSettings?.masterVolume !== undefined ? state.gameSettings.masterVolume : 1.0,
      musicVolume: state.gameSettings?.musicVolume !== undefined ? state.gameSettings.musicVolume : 0.6,
      ambienceVolume: state.gameSettings?.ambienceVolume !== undefined ? state.gameSettings.ambienceVolume : 0.5,
      sfxVolume: state.gameSettings?.sfxVolume !== undefined ? state.gameSettings.sfxVolume : 0.7,
      isMusicMuted: Boolean(state.gameSettings?.isMusicMuted),
      repeatMode: state.gameSettings?.repeatMode || 'playlist',
      currentBgmKey: state.gameSettings?.currentBgmKey || 'bgm_1'
    }
  };
}

/**
 * Gera os metadados de exibição de um slot de save
 */
export function createSaveMetadata(slotId, state, builtCount = 0) {
  return {
    id: slotId,
    companyName: state.playerProfile.companyName,
    playerName: state.playerProfile.playerName,
    avatarId: state.playerProfile.avatarId,
    themeColor: state.playerProfile.themeColor,
    cash: state.cash,
    gameDate: `${String(state.day).padStart(2,'0')}/${String(state.month).padStart(2,'0')} · Ano ${state.year}`,
    dateISO: new Date().toISOString(),
    builtCount: builtCount
  };
}

/**
 * Remove um slot de save do localStorage e atualiza o índice
 */
export function deleteSaveSlot(slotId) {
  try {
    localStorage.removeItem(`oiko_save_${slotId}`);
    const index = getSavesIndex().filter(s => s.id !== slotId);
    saveSavesIndex(index);
    return true;
  } catch (e) {
    console.error('Erro ao excluir save:', e);
    return false;
  }
}

/**
 * Gera Data URI para download de arquivo .oiko
 */
export function generateExportDataUri(saveData) {
  return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveData, null, 2));
}

/**
 * Salva com criação de geração anterior (Backup Generation)
 * Se já existir um save no slot, ele é promovido a backup antes de ser sobrescrito.
 */
export function saveSlotWithBackup(slotId, serializedState) {
  try {
    const key = `oiko_save_${slotId}`;
    const backupKey = `oiko_save_${slotId}_backup`;
    const previousSave = localStorage.getItem(key);
    if (previousSave) {
      try {
        localStorage.setItem(backupKey, previousSave);
      } catch (e) {
        // Se a cota estiver no limite, ignora o backup secundário para não impedir o save principal
      }
    }
    localStorage.setItem(key, serializedState);
    return true;
  } catch (e) {
    console.error(`Erro ao gravar save com backup no slot "${slotId}":`, e);
    return false;
  }
}

/**
 * Carrega um slot com fallback automático para geração anterior (Save Generations).
 */
export function loadSlotWithFallback(slotId) {
  const key = `oiko_save_${slotId}`;
  const backupKey = `oiko_save_${slotId}_backup`;
  
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (e) {}

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { data: parsed, fromBackup: false };
      }
    } catch (e) {
      console.warn(`[SaveSystem] ⚠ Save principal "${slotId}" corrompido ou ilegível. Tentando backup...`);
    }
  }

  // Tentativa no snapshot de geração anterior
  try {
    const backupRaw = localStorage.getItem(backupKey);
    if (backupRaw) {
      const parsedBackup = JSON.parse(backupRaw);
      if (parsedBackup && typeof parsedBackup === 'object') {
        console.info(`[SaveSystem] ✅ Snapshot de recuperação ativado para slot "${slotId}".`);
        return { data: parsedBackup, fromBackup: true };
      }
    }
  } catch (e) {
    console.error(`[SaveSystem] Falha ao ler snapshot de backup do slot "${slotId}":`, e);
  }

  return { data: null, fromBackup: false };
}

export function extractBuiltTiles() {
  const built = [];
  const activeSet = (typeof window !== 'undefined' && window.activeFacilitySet)
    ? window.activeFacilitySet
    : (window.WorldGridEngine?.activeFacilitySet || new Map());
  for (const t of activeSet.values()) {
    if (t.store || t.mine || t.farm || t.factory || t.rdCenter || t.warehouse || t.competitor) {
      built.push({
        x: t.x, y: t.y,
        store: t.store,
        mine: t.mine,
        farm: t.farm,
        factory: t.factory,
        rdCenter: t.rdCenter,
        warehouse: t.warehouse,
        competitor: t.competitor
      });
    }
  }
  return built;
}

export function applyBuiltTiles(builtArray) {
  if (!Array.isArray(builtArray)) return;
  const activeSet = (typeof window !== 'undefined' && window.activeFacilitySet)
    ? window.activeFacilitySet
    : (window.WorldGridEngine?.activeFacilitySet || new Map());
  const grid = (typeof window !== 'undefined' && window.worldGrid)
    ? window.worldGrid
    : (window.WorldGridEngine?.worldGrid || []);
  const indexFn = (typeof window !== 'undefined' && typeof window._indexTile === 'function')
    ? window._indexTile
    : (window.WorldGridEngine?._indexTile || (() => {}));

  activeSet.clear();
  for (const b of builtArray) {
    if (grid[b.x] && grid[b.x][b.y]) {
      const t = grid[b.x][b.y];
      t.store = b.store || null;
      t.mine = b.mine || null;
      t.farm = b.farm || null;
      t.factory = b.factory || null;
      t.rdCenter = b.rdCenter || null;
      t.warehouse = b.warehouse || null;
      t.competitor = b.competitor || null;
      if (t.store) t.buildingHeight = 16;
      else if (t.mine) t.buildingHeight = 20;
      else if (t.farm) t.buildingHeight = 18;
      else if (t.factory) t.buildingHeight = 22;
      else if (t.rdCenter) t.buildingHeight = 24;
      else if (t.warehouse) t.buildingHeight = 20;
      else if (t.competitor) t.buildingHeight = 18;
      indexFn(t);
    }
  }
}

export function serializeCurrentGame() {
  const g = (typeof window !== 'undefined' && window.GameState) ? window.GameState : {};
  const prof = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile : (g.playerProfile || {});
  const cCash = (typeof window !== 'undefined' && window.cash !== undefined) ? window.cash : (g.cash || 0);
  const cDay = (typeof window !== 'undefined' && window.day !== undefined) ? window.day : (g.day || 1);
  const cMonth = (typeof window !== 'undefined' && window.month !== undefined) ? window.month : (g.month || 1);
  const cYear = (typeof window !== 'undefined' && window.year !== undefined) ? window.year : (g.year || 1);
  const cPlaytime = (typeof window !== 'undefined' && window.playtimeSeconds !== undefined) ? window.playtimeSeconds : (g.playtimeSeconds || 0);
  const cSettings = (typeof window !== 'undefined' && window.gameSettings) ? window.gameSettings : (g.gameSettings || {});
  const brand = (typeof window !== 'undefined' && window.playerBrandRating) ? window.playerBrandRating : (g.playerBrandRating || {});
  const mkt = (typeof window !== 'undefined' && window.activeMarketingContracts) ? window.activeMarketingContracts : (g.activeMarketingContracts || new Set());
  const rd = (typeof window !== 'undefined' && window.rdLabs) ? window.rdLabs : (g.rdLabs || {});
  const prods = (typeof window !== 'undefined' && window.unlockedProducts) ? window.unlockedProducts : (g.unlockedProducts || new Set());
  const lics = (typeof window !== 'undefined' && window.acquiredLicenses) ? window.acquiredLicenses : (g.acquiredLicenses || new Set());
  const ledger = (typeof window !== 'undefined' && window.historicalLedger) ? window.historicalLedger : (g.historicalLedger || []);
  const tut = (typeof window !== 'undefined' && window.tutorialState) ? window.tutorialState : (g.tutorialState || {});
  const cities = (typeof window !== 'undefined' && window.unlockedCities) ? window.unlockedCities : (g.unlockedCities || {});

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    timestamp: new Date().toISOString(),
    playerProfile: { ...prof },
    cash: cCash,
    day: cDay,
    month: cMonth,
    year: cYear,
    unlockedCities: { ...cities },
    playerBrandRating: { ...brand },
    activeMarketingContracts: Array.from(mkt),
    rdLabs: { ...rd },
    unlockedProducts: Array.from(prods),
    acquiredLicenses: Array.from(lics),
    historicalLedger: [...ledger],
    tutorialState: { ...tut },
    builtTiles: extractBuiltTiles(),
    playtimeSeconds: cPlaytime,
    banking: g.banking
      ? {
          activeLoans: (g.banking.activeLoans || []).map(l => ({ ...l })),
          totalDebt:   g.banking.totalDebt || 0,
          loanHistory: (g.banking.loanHistory || []).map(l => ({ ...l })),
        }
      : { activeLoans: [], totalDebt: 0, loanHistory: [] },
    settings: {
      autoSave: cSettings.autoSave || 'monthly',
      masterVolume: cSettings.masterVolume !== undefined ? cSettings.masterVolume : 1.0,
      musicVolume: cSettings.musicVolume !== undefined ? cSettings.musicVolume : 0.6,
      ambienceVolume: cSettings.ambienceVolume !== undefined ? cSettings.ambienceVolume : 0.5,
      sfxVolume: cSettings.sfxVolume !== undefined ? cSettings.sfxVolume : 0.7,
      isMusicMuted: Boolean(cSettings.isMusicMuted),
      repeatMode: cSettings.repeatMode || 'playlist',
      currentBgmKey: cSettings.currentBgmKey || 'bgm_1'
    }
  };
}

export function saveGame(customSlotId = null, isSilent = false) {
  const state = serializeCurrentGame();
  const currentSlot = (typeof window !== 'undefined' && window.currentSaveSlotId) ? window.currentSaveSlotId : null;
  const slotId = customSlotId || currentSlot || (`slot_${Date.now()}`);
  if (typeof window !== 'undefined') window.currentSaveSlotId = slotId;

  const metadata = {
    id: slotId,
    companyName: state.playerProfile.companyName,
    playerName: state.playerProfile.playerName,
    avatarId: state.playerProfile.avatarId,
    themeColor: state.playerProfile.themeColor,
    cash: state.cash,
    gameDate: `${String(state.day).padStart(2,'0')}/${String(state.month).padStart(2,'0')} · Ano ${state.year}`,
    dateISO: state.timestamp,
    builtCount: state.builtTiles.length
  };

  try {
    if (typeof window !== 'undefined' && window.SimulationGuard && typeof window.SimulationGuard.validateEconomySnapshot === 'function') {
      window.SimulationGuard.validateEconomySnapshot(state);
    }

    const serialized = JSON.stringify(state);
    saveSlotWithBackup(slotId, serialized);

    let index = getSavesIndex().filter(s => s.id !== slotId);
    index.unshift(metadata);
    saveSavesIndex(index);

    if (typeof window !== 'undefined') {
      window.lastSavedStateSnapshot = state;
      if (!isSilent && typeof window.playSuccessChime === 'function') {
        window.playSuccessChime();
      }
      if (typeof window.addLog === 'function') {
        window.addLog(`💾 JOGO SALVO: [${metadata.companyName}] registrado com sucesso.`, 'text-emerald-400 font-bold', { category: 'system' });
      }
      if (typeof window.renderSavesCountInMenu === 'function') {
        window.renderSavesCountInMenu();
      }
    }
    return true;
  } catch (e) {
    if (typeof alert === 'function') alert('Aviso: Espaço de armazenamento local cheio ou indisponível.');
    return false;
  }
}

export function saveGameInNewSlot() {
  const newId = `slot_${Date.now()}`;
  if (saveGame(newId)) {
    if (typeof window !== 'undefined' && typeof window.renderSavesList === 'function') {
      window.renderSavesList();
    }
  }
}

export function quickSaveGame() {
  if (saveGame()) {
    const badge = document.getElementById('quicksave-status-badge');
    if (badge) {
      badge.textContent = 'Salvo agora!';
      badge.className = 'text-[10px] text-emerald-400 font-bold';
      setTimeout(() => { if (badge) badge.textContent = ''; }, 3000);
    }
  }
}

export function loadGameFromData(rawSaveData) {
  const saveData = migrateSaveData(rawSaveData);
  if (!saveData) {
    if (typeof alert === 'function') alert('Arquivo de save inválido ou incompatível.');
    return false;
  }

  const g = (typeof window !== 'undefined' && window.GameState) ? window.GameState : {};
  g.playerProfile = { ...saveData.playerProfile };
  g.cash = saveData.cash;
  g.day = saveData.day;
  g.month = saveData.month;
  g.year = saveData.year;
  g.playtimeSeconds = saveData.playtimeSeconds;

  if (typeof window !== 'undefined') {
    window.cash = saveData.cash;
    window.day = saveData.day;
    window.month = saveData.month;
    window.year = saveData.year;
    window.playerProfile = { ...saveData.playerProfile };
    window.playtimeSeconds = saveData.playtimeSeconds;
    if (window.unlockedCities) Object.assign(window.unlockedCities, saveData.unlockedCities);
    if (window.playerBrandRating) {
      Object.keys(window.playerBrandRating).forEach(k => delete window.playerBrandRating[k]);
      Object.assign(window.playerBrandRating, saveData.playerBrandRating);
    }
    if (window.activeMarketingContracts) {
      window.activeMarketingContracts.clear();
      (saveData.activeMarketingContracts || []).forEach(c => window.activeMarketingContracts.add(c));
    }
    if (window.rdLabs) {
      Object.keys(window.rdLabs).forEach(k => delete window.rdLabs[k]);
      if (saveData.rdLabs && typeof saveData.rdLabs === 'object') {
        Object.assign(window.rdLabs, saveData.rdLabs);
      }
    }
    if (window.unlockedProducts) {
      window.unlockedProducts.clear();
      if (saveData.unlockedProducts && Array.isArray(saveData.unlockedProducts)) {
        saveData.unlockedProducts.forEach(p => window.unlockedProducts.add(p));
      }
    }
    if (window.acquiredLicenses) {
      window.acquiredLicenses.clear();
      window.acquiredLicenses.add('kombini');
      if (saveData.acquiredLicenses && Array.isArray(saveData.acquiredLicenses)) {
        saveData.acquiredLicenses.forEach(l => window.acquiredLicenses.add(l));
      }
    }
    if (window.historicalLedger && Array.isArray(saveData.historicalLedger)) {
      window.historicalLedger.length = 0;
      window.historicalLedger.push(...saveData.historicalLedger);
    }
  }

  // Restaurar estado bancário
  if (saveData.banking && typeof saveData.banking === 'object') {
    g.banking = {
      activeLoans: Array.isArray(saveData.banking.activeLoans) ? saveData.banking.activeLoans.map(l => ({ ...l })) : [],
      totalDebt: typeof saveData.banking.totalDebt === 'number' ? saveData.banking.totalDebt : 0,
      loanHistory: Array.isArray(saveData.banking.loanHistory) ? saveData.banking.loanHistory.map(l => ({ ...l })) : [],
    };
    g.banking.totalDebt = g.banking.activeLoans.reduce((s, l) => s + (l.remainingBalance || 0), 0);
  } else {
    g.banking = { activeLoans: [], totalDebt: 0, loanHistory: [] };
  }

  if (typeof window !== 'undefined') {
    if (window.AppLifecycle && typeof window.AppLifecycle.renderTutorialGuide === 'function') {
      window.AppLifecycle.renderTutorialGuide();
    } else if (typeof window.renderTutorialGuide === 'function') {
      window.renderTutorialGuide();
    }

    if (typeof window.initWorldGrid === 'function') window.initWorldGrid();
    applyBuiltTiles(saveData.builtTiles);

    if (typeof window.updatePlayerProfileHUD === 'function') window.updatePlayerProfileHUD();
    if (typeof window.checkCityUnlocks === 'function') window.checkCityUnlocks();
    if (typeof window.updateUI === 'function') window.updateUI();

    if (saveData.settings && typeof saveData.settings === 'object') {
      if (window.gameSettings) Object.assign(window.gameSettings, saveData.settings);
      try {
        localStorage.setItem('oikonomia_settings_v1', JSON.stringify(saveData.settings));
      } catch (e) {}
      if (window.SoundEngine && typeof window.SoundEngine.syncVolumesFromSettings === 'function') {
        window.SoundEngine.syncVolumesFromSettings();
      }
      if (typeof window.syncPauseMenuVolumes === 'function') window.syncPauseMenuVolumes();
    }

    window.currentAppScreen = 'PLAYING';
    if (typeof window.hideMainMenu === 'function') window.hideMainMenu();
    if (typeof window.closeAllInGameModals === 'function') window.closeAllInGameModals();
    if (typeof window.setSpeed === 'function') window.setSpeed(1);
    if (typeof window.updateUI === 'function') window.updateUI();
    if (typeof window.jumpToCity === 'function') window.jumpToCity('nova_atenas');

    const verInfo = saveData.migratedFromVersion && saveData.migratedFromVersion !== CURRENT_SAVE_VERSION
      ? ` (migrado de v${saveData.migratedFromVersion})`
      : '';
    if (typeof window.addLog === 'function') {
      window.addLog(`📂 SAVE CARREGADO: Empresa [${saveData.playerProfile.companyName}] iniciada${verInfo}.`, 'text-sky-300 font-bold', { category: 'system' });
    }
  }

  return true;
}

export function loadGameById(slotId) {
  try {
    const loadRes = loadSlotWithFallback(slotId);
    const state = loadRes.data;
    const isBackup = loadRes.fromBackup;

    if (!state) {
      if (typeof alert === 'function') alert('Save não encontrado ou arquivo corrompido.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.currentSaveSlotId = slotId;
      if (typeof window.closeSaveLoadModal === 'function') window.closeSaveLoadModal();
    }
    loadGameFromData(state);

    if (isBackup && typeof window !== 'undefined' && typeof window.addLog === 'function') {
      window.addLog(`⚠ AVISO: Save corrompido recuperado com sucesso da geração anterior (Backup)!`, 'text-amber-300 font-bold', { category: 'system' });
    }
  } catch (e) {
    if (typeof alert === 'function') alert('Erro ao carregar o arquivo salvo.');
  }
}

export function deleteSaveById(slotId, e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (typeof confirm === 'function' && !confirm('Tem certeza que deseja excluir permanentemente este save?')) return;

  deleteSaveSlot(slotId);
  try {
    localStorage.removeItem(`oiko_save_${slotId}_backup`);
  } catch (err) {}

  if (typeof window !== 'undefined') {
    if (window.currentSaveSlotId === slotId) window.currentSaveSlotId = null;
    if (typeof window.renderSavesList === 'function') window.renderSavesList();
    if (typeof window.renderSavesCountInMenu === 'function') window.renderSavesCountInMenu();
  }
}

export function exportSaveFile() {
  const state = serializeCurrentGame();
  const dataStr = generateExportDataUri(state);
  const downloadAnchor = document.createElement('a');
  const d = state.day, m = state.month, y = state.year;
  const dateStr = `${y}_M${String(m).padStart(2,'0')}_D${String(d).padStart(2,'0')}`;
  const safeName = (state.playerProfile?.companyName || 'OikoCorp').replace(/[^a-z0-9_-]/gi, '_');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `Oikonomia_${safeName}_${dateStr}.oiko`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
    window.addLog(`📦 BACKUP EXPORTADO: Arquivo .oiko salvo no seu computador.`, 'text-amber-300', { category: 'system' });
  }
}

export function handleImportSaveFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const state = JSON.parse(e.target.result);
      if (loadGameFromData(state)) {
        saveGame();
      }
    } catch (err) {
      if (typeof alert === 'function') alert('Arquivo de save corrompido ou formato não suportado.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

export function checkAutoSave() {
  const settings = (typeof window !== 'undefined' && window.gameSettings) ? window.gameSettings : {};
  const month = (typeof window !== 'undefined' && window.month) ? window.month : 1;
  if (settings.autoSave === 'disabled') return;
  if (settings.autoSave === 'yearly' && month !== 12) return;
  saveGame(null, true);
}

if (typeof window !== 'undefined') {
  const saveSys = {
    getSavesIndex,
    saveSavesIndex,
    reconcileSavesIndex,
    migrateSaveData,
    saveSlotWithBackup,
    loadSlotWithFallback,
    extractBuiltTiles,
    applyBuiltTiles,
    serializeCurrentGame,
    saveGame,
    saveGameInNewSlot,
    quickSaveGame,
    loadGameFromData,
    loadGameById,
    deleteSaveById,
    exportSaveFile,
    handleImportSaveFile,
    checkAutoSave
  };
  window._saveSystem = saveSys;
  window.SaveSystem = saveSys;
  window.extractBuiltTiles = extractBuiltTiles;
  window.applyBuiltTiles = applyBuiltTiles;
  window.serializeCurrentGame = serializeCurrentGame;
  window.saveGame = saveGame;
  window.saveGameInNewSlot = saveGameInNewSlot;
  window.quickSaveGame = quickSaveGame;
  window.loadGameFromData = loadGameFromData;
  window.loadGameById = loadGameById;
  window.deleteSaveById = deleteSaveById;
  window.exportSaveFile = exportSaveFile;
  window.handleImportSaveFile = handleImportSaveFile;
  window.checkAutoSave = checkAutoSave;
}

