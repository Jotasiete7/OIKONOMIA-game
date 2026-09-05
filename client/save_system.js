/**
 * save_system.js — Sistema de Persistência, Versionamento e Migração de Saves
 * OIKONOMIA v0.8.4
 */

import { AVATAR_CATALOG, COLOR_PALETTES, DIFFICULTY_PRESETS } from './game_config.js';
import { MAP_WIDTH } from './map_data.js';

export const GAME_VERSION_INFO = {
  major: 0,
  minor: 8,
  patch: 4,
  build: '20260905.01',
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
  migrated.day = (!isNaN(numDay) && numDay >= 1 && numDay <= 30) ? numDay : 1;

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

  migrated.saveVersion = CURRENT_SAVE_VERSION;
  migrated.migratedFromVersion = rawVer;
  return migrated;
}

/**
 * Lê o índice de metadados dos slots de save do localStorage
 */
export function getSavesIndex() {
  try {
    const raw = localStorage.getItem(SAVES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
      : { activeLoans: [], totalDebt: 0, loanHistory: [] }
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
