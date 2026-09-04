/**
 * game_state.js — Container Central do Estado do Jogo (Single Source of Truth)
 * OIKONOMIA v0.8.4
 */

export function createInitialGameState() {
  return {
    currentAppScreen: 'BOOT', // 'BOOT', 'MAIN_MENU', 'PLAYING', 'PAUSED'
    day: 1,
    month: 1,
    year: 1,
    cash: 100000.00,
    monthRevenue: 0,
    monthCogs: 0,
    monthFixedExpenses: 0,
    monthMarketingExpenses: 0,
    monthFinancialExpenses: 0,
    consecutiveInsolventMonths: 0,
    insolvencyLevel2Triggered: false,
    insolvencyCountdownMonths: 6,
    gameSpeed: 0,
    timerInterval: null,
    previousSpeedBeforePause: 1,
    playtimeSeconds: 0,
    playerProfile: {
      playerName: 'Arthur Vance',
      companyName: 'OikoCorp Holding',
      avatarId: 'human_ceo',
      themeColor: 'emerald',
      difficulty: 'standard',
      logoRegenSeed: 0
    },
    currentSaveSlotId: null,
    lastSavedStateSnapshot: null,
    gameSettings: {
      autoSave: 'monthly',
      masterVolume: 1.0,
      musicVolume: 0.6,
      ambienceVolume: 0.5,
      sfxVolume: 0.7
    },
    playerBrandRating: {},
    activeMarketingContracts: new Set(),
    rdLabs: {},
    unlockedProducts: new Set([
      // Matérias-Primas e Agropecuária (Tier 0 - Acesso irrestrito por fazendas/minas)
      'wheat', 'corn', 'cotton', 'sugar_cane', 'cocoa', 'coffee_beans', 'grapes', 'tobacco', 'rubber',
      'cattle', 'raw_milk', 'poultry', 'pigs', 'wool', 'iron_ore', 'bauxite', 'crude_oil', 'silica',
      'timber', 'gold_ore', 'chemical_minerals', 'eggs',
      // Bens Básicos de Início (Starter Pack)
      'bread', 'milk'
    ]),
    unlockedCities: {
      nova_atenas: true,
      porto_real: true,
      montargis: false,
      varzea: false
    },
    acquiredLicenses: new Set(['kombini']),
    historicalLedger: [],
    tutorialState: {
      completedSteps: {},
      rewardClaimed: false
    }
  };
}

export const GameState = createInitialGameState();
export default GameState;
