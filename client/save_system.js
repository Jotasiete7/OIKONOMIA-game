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
  build: '20260908.01',
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

