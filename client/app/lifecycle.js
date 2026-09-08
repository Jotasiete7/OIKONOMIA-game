// ===========================================================================
// OIKONOMIA — SISTEMA DE CICLO DE VIDA, MENU, NOVO JOGO & SETTINGS
// client/app/lifecycle.js
// ===========================================================================

export const CEO_FIRST_NAMES = [
  'Arthur', 'Helena', 'Valentin', 'Diana', 'Beatriz', 'Morgan', 'Kaelen', 'Lorena',
  'Marcus', 'Cecília', 'Gabriel', 'Yasmin', 'Rodrigo', 'Alistair', 'Naomi', 'Octavio',
  'Sofia', 'Leonardo', 'Victoria', 'Dante', 'Isadora', 'Henrik', 'Clarice', 'Thales',
  'Melissa', 'Xavier', 'Mirela', 'Viktor', 'Lavinia', 'Lorenzo', 'Renata', 'Mateus'
];

export const CEO_LAST_NAMES = [
  'Vance', 'Roitman', 'Voss', 'Sterling', 'Cruz', 'Castilho', 'Drake', 'Thorne',
  'Alencastro', 'Moreau', 'Sampaio', 'Hashimoto', 'Blackwood', 'Falcão', 'Lindqvist', 'Prado',
  'Rothschild', 'Valadares', 'Kensington', 'Albuquerque', 'Delacroix', 'Meireles',
  'Van Der Berg', 'Fontes', 'Brandão', 'Silveira', 'Gouveia', 'Novaes', 'Belmont', 'Cavalcante'
];

export const CORP_PREFIXES = [
  'Apex', 'Vanguard', 'Solaris', 'Titanium', 'Aura', 'Metrópole', 'Caelum', 'Orion',
  'Horizon', 'Zenith', 'Atlas', 'Quantum', 'Nova', 'Imperium', 'Vertex', 'Prime',
  'Valhalla', 'Nexus', 'Omni', 'Genesis', 'Chronos', 'Ironclad', 'Lumina', 'Astra', 'Hyperion'
];

export const CORP_ROOTS = [
  'Industrial', 'Supply & Logística', 'Capital', 'Holding', 'Manufatura', 'Varejo',
  'Agropecuária', 'Logística Global', 'Alimentos', 'Tech & Chips', 'Enterprises',
  'Commodities', 'Corporação', 'Participações', 'Distribuição', 'Mineração'
];

export const CORP_SUFFIXES = [
  'S.A.', 'Group', '& Co.', 'Holding', 'Corporation', 'Brasil', 'Internacional', 'Alliance', 'Consortium', 'Corp'
];

export const TUTORIAL_MISSIONS = [
  {
    id: 'inspect_tile',
    title: '1. Reconhecimento de Terreno',
    desc: 'Navegue pelo mapa isométrico de Nova Atenas e clique em qualquer lote com tráfego urbano.',
    check: () => (window.selectedTileX >= 0 && window.selectedTileY >= 0)
  },
  {
    id: 'open_store',
    title: '2. Primeira Loja de Varejo',
    desc: 'Inaugure seu primeiro estabelecimento comercial (Recomendado para iniciantes: Kombini de Bairro, com baixo custo fixo e retorno rápido).',
    check: () => {
      const activeSet = window.activeFacilitySet;
      if (!activeSet) return false;
      for (const t of activeSet.values()) {
        if (t.store) return true;
      }
      return false;
    }
  },
  {
    id: 'stock_goods',
    title: '3. Suprimento do Porto',
    desc: 'Abasteça ao menos 1 prateleira da sua loja com alimentos importados do Cais de Nova Atenas.',
    check: () => {
      const activeSet = window.activeFacilitySet;
      if (!activeSet) return false;
      for (const t of activeSet.values()) {
        if (t.store?.shelves && Object.values(t.store.shelves).some(sh => sh.stock > 0)) return true;
      }
      return false;
    }
  },
  {
    id: 'build_farm',
    title: '4. Insumos da Terra (Fazenda)',
    desc: 'Construa uma Fazenda Agropecuária (ex: Trigo, Milho ou Algodão) para produzir matérias-primas.',
    check: () => {
      const activeSet = window.activeFacilitySet;
      if (!activeSet) return false;
      for (const t of activeSet.values()) {
        if (t.farm) return true;
      }
      return false;
    }
  },
  {
    id: 'research_rd',
    title: '5. Inovação Científica (P&D)',
    desc: 'Inaugure um Centro de P&D (Laboratório) e inicie uma pesquisa de qualidade ou desbloqueio de patente.',
    check: () => {
      const activeSet = window.activeFacilitySet;
      const rdLabs = window.rdLabs || {};
      const unlockedProducts = window.unlockedProducts || new Set();
      const hasLab = activeSet ? Array.from(activeSet.values()).some(t => t.rdCenter) : false;
      const hasProject = Object.values(rdLabs).some(p => p.status === 'active' || p.status === 'completed');
      return hasLab && (hasProject || unlockedProducts.size > 24);
    }
  },
  {
    id: 'build_factory',
    title: '6. Complexo Fabril Integrado',
    desc: 'Construa uma Fábrica e instale sua primeira linha de produção para transformar insumos em produtos.',
    check: () => {
      const activeSet = window.activeFacilitySet;
      if (!activeSet) return false;
      for (const t of activeSet.values()) {
        if (t.factory && Object.keys(t.factory.lines || {}).length > 0) return true;
      }
      return false;
    }
  },
  {
    id: 'monthly_profit',
    title: '7. Lucro Operacional Positivo',
    desc: 'Feche um mês completo com balanço financeiro no azul para resgatar a bonificação.',
    check: () => Boolean(window.GameState?.hasRecordedPositiveMonth)
  }
];

export const SETTINGS_STORAGE_KEY = 'oikonomia_settings_v1';

export class LifecycleManager {
  constructor() {
    this.currentAppScreen = 'BOOT';
    this.previousSpeedBeforePause = 1;
    this.selectedWizAvatarId = 'human_ceo';
    this.selectedWizColorId = 'emerald';
    this.selectedWizDifficultyId = 'standard';
    this.selectedWizLogoSeed = 0;
    this.currentSaveLoadMode = 'load';
    this.tutorialState = (typeof window !== 'undefined' && window.tutorialState)
      ? window.tutorialState
      : {
          completedSteps: {},
          rewardClaimed: false,
          active: true
        };
    if (typeof window !== 'undefined') {
      window.tutorialState = this.tutorialState;
    }
  }

  // ===========================================================================
  // 1. MENU PRINCIPAL & TELA DE CARREGAMENTO
  // ===========================================================================
  rotateLoadingTip() {
    const el = document.getElementById('loading-tip-text');
    if (!el) return;
    const tips = window.ECONOMIC_TIPS || [
      "Diversifique suas linhas de receita para amortecer ciclos de recessão.",
      "Lojas de conveniência oferecem giro rápido de caixa nos estágios iniciais."
    ];
    el.style.opacity = '0';
    setTimeout(() => {
      const tip = tips[Math.floor(Math.random() * tips.length)];
      el.textContent = tip;
      el.style.opacity = '1';
    }, 200);
  }

  showMainMenu() {
    this.currentAppScreen = 'MAIN_MENU';
    if (typeof window !== 'undefined') window.currentAppScreen = 'MAIN_MENU';

    const menu = document.getElementById('main-menu-screen');
    if (menu) menu.classList.remove('hidden');
    this.renderSavesCountInMenu();

    const getSavesFn = window.getSavesIndex || (() => []);
    const saves = getSavesFn();
    const btnContinue = document.getElementById('btn-menu-continue');
    if (btnContinue) {
      btnContinue.disabled = (saves.length === 0);
    }

    if (window.SoundEngine) {
      const s = window.SoundEngine.getSettings ? window.SoundEngine.getSettings() : {};
      const isMuted = Boolean(window.SoundEngine.isMusicMuted || s.isMusicMuted || s.musicVolume === 0);
      if (!isMuted) {
        window.SoundEngine.playBgm('menu');
      } else {
        window.SoundEngine.pauseBgm();
      }
      if (typeof window.SoundEngine.stopAmbience === 'function') {
        window.SoundEngine.stopAmbience();
      }
    }
  }

  hideMainMenu() {
    const menu = document.getElementById('main-menu-screen');
    if (menu) menu.classList.add('hidden');

    if (window.SoundEngine) {
      const s = window.SoundEngine.getSettings ? window.SoundEngine.getSettings() : {};
      const isMuted = Boolean(window.SoundEngine.isMusicMuted || s.isMusicMuted || s.musicVolume === 0);
      if (!isMuted) {
        window.SoundEngine.playBgm(s.currentBgmKey || 'daytime_01');
      } else {
        window.SoundEngine.pauseBgm();
      }
      if (s.ambienceVolume === undefined || s.ambienceVolume > 0) {
        if (typeof window.SoundEngine.playAmbience === 'function') {
          window.SoundEngine.playAmbience('city', 0.4);
        }
      }
    }
  }

  continueLastGame() {
    const getSavesFn = window.getSavesIndex || (() => []);
    const saves = getSavesFn();
    if (saves.length > 0) {
      if (typeof window.loadGameById === 'function') {
        window.loadGameById(saves[0].id);
      }
    } else {
      this.openNewGameWizard();
    }
  }

  // ===========================================================================
  // 2. MENU DE PAUSA & CONTROLES DE ÁUDIO RÁPIDOS
  // ===========================================================================
  togglePauseMenu() {
    const screen = window.currentAppScreen || this.currentAppScreen;
    if (screen === 'MAIN_MENU' || screen === 'BOOT') return;

    if (screen === 'PAUSED') {
      this.resumeGame();
    } else {
      this.pauseGameAndShowMenu();
    }
  }

  pauseGameAndShowMenu() {
    const gameSpeed = typeof window.gameSpeed !== 'undefined' ? window.gameSpeed : (window.GameState?.gameSpeed || 1);
    this.previousSpeedBeforePause = gameSpeed || 1;
    window.previousSpeedBeforePause = this.previousSpeedBeforePause;

    const setSpeedFn = window.HUDSystem?.setSpeed || window.setSpeed;
    if (typeof setSpeedFn === 'function') setSpeedFn(0);

    this.currentAppScreen = 'PAUSED';
    window.currentAppScreen = 'PAUSED';

    const modal = document.getElementById('pause-menu-modal');
    if (modal) modal.classList.remove('hidden');
    this.updatePlayerProfileHUD();
    this.syncPauseMenuVolumes();
  }

  syncPauseMenuVolumes() {
    const s = (typeof window.gameSettings !== 'undefined') ? window.gameSettings : {};
    const mVol = s.masterVolume !== undefined ? s.masterVolume : 1.0;
    const musVol = s.musicVolume !== undefined ? s.musicVolume : 0.6;
    const ambVol = s.ambienceVolume !== undefined ? s.ambienceVolume : 0.5;
    const sfxVol = s.sfxVolume !== undefined ? s.sfxVolume : 0.7;

    const mEl = document.getElementById('pause-master-volume');
    const mLbl = document.getElementById('pause-master-label');
    if (mEl) mEl.value = mVol;
    if (mLbl) mLbl.textContent = `${Math.round(mVol * 100)}%`;

    const musEl = document.getElementById('pause-music-volume');
    const musLbl = document.getElementById('pause-music-label');
    if (musEl) musEl.value = musVol;
    if (musLbl) musLbl.textContent = `${Math.round(musVol * 100)}%`;

    const ambEl = document.getElementById('pause-ambience-volume');
    const ambLbl = document.getElementById('pause-ambience-label');
    if (ambEl) ambEl.value = ambVol;
    if (ambLbl) ambLbl.textContent = `${Math.round(ambVol * 100)}%`;

    const sfxEl = document.getElementById('pause-sfx-volume');
    const sfxLbl = document.getElementById('pause-sfx-label');
    if (sfxEl) sfxEl.value = sfxVol;
    if (sfxLbl) sfxLbl.textContent = `${Math.round(sfxVol * 100)}%`;
  }

  syncVolumeFromPause(channel, value) {
    const val = parseFloat(value);
    const settings = window.gameSettings || {};

    if (channel === 'master') {
      settings.masterVolume = val;
      const el = document.getElementById('pause-master-label');
      if (el) el.textContent = `${Math.round(val * 100)}%`;
    } else if (channel === 'music') {
      settings.musicVolume = val;
      const el = document.getElementById('pause-music-label');
      if (el) el.textContent = `${Math.round(val * 100)}%`;
    } else if (channel === 'ambience') {
      settings.ambienceVolume = val;
      const el = document.getElementById('pause-ambience-label');
      if (el) el.textContent = `${Math.round(val * 100)}%`;
    } else if (channel === 'sfx') {
      settings.sfxVolume = val;
      const el = document.getElementById('pause-sfx-label');
      if (el) el.textContent = `${Math.round(val * 100)}%`;
    }

    if (window.SoundEngine && typeof window.SoundEngine.syncVolumesFromSettings === 'function') {
      window.SoundEngine.syncVolumesFromSettings();
    }

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}

    const setEl = document.getElementById(`setting-${channel === 'sfx' ? 'sfx' : channel}-volume`);
    const setLbl = document.getElementById(`setting-${channel === 'sfx' ? 'sfx' : channel}-label`);
    if (setEl) setEl.value = val;
    if (setLbl) setLbl.textContent = `${Math.round(val * 100)}%`;
  }

  resumeGame() {
    const modal = document.getElementById('pause-menu-modal');
    if (modal) modal.classList.add('hidden');
    this.currentAppScreen = 'PLAYING';
    window.currentAppScreen = 'PLAYING';

    const prev = window.previousSpeedBeforePause || this.previousSpeedBeforePause || 1;
    const setSpeedFn = window.HUDSystem?.setSpeed || window.setSpeed;
    if (typeof setSpeedFn === 'function') setSpeedFn(prev);
  }

  promptExitToMainMenu() {
    const confirmModal = document.getElementById('confirm-exit-modal');
    if (confirmModal) confirmModal.classList.remove('hidden');
  }

  closeConfirmExitModal() {
    const confirmModal = document.getElementById('confirm-exit-modal');
    if (confirmModal) confirmModal.classList.add('hidden');
  }

  saveAndExitToMainMenu() {
    if (typeof window.saveGame === 'function') window.saveGame();
    this.closeConfirmExitModal();
    const pauseModal = document.getElementById('pause-menu-modal');
    if (pauseModal) pauseModal.classList.add('hidden');
    this.showMainMenu();
  }

  exitToMainMenuWithoutSaving() {
    this.closeConfirmExitModal();
    const pauseModal = document.getElementById('pause-menu-modal');
    if (pauseModal) pauseModal.classList.add('hidden');
    this.showMainMenu();
  }

  // ===========================================================================
  // 3. WIZARD DE NOVA EMPRESA & PERFIL EXECUTIVO
  // ===========================================================================
  openNewGameWizard() {
    this.selectedWizAvatarId = 'human_ceo';
    this.selectedWizColorId = 'emerald';
    this.selectedWizDifficultyId = 'standard';
    this.selectedWizLogoSeed = 0;

    this.randomizePlayerName();
    this.randomizeCompanyName();
    this.renderWizAvatars();
    this.renderWizColors();
    this.renderWizDifficulties();
    this.updateWizLogoPreview();

    const modal = document.getElementById('new-game-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeNewGameWizard() {
    const modal = document.getElementById('new-game-modal');
    if (modal) modal.classList.add('hidden');
  }

  randomizePlayerName() {
    const first = CEO_FIRST_NAMES[Math.floor(Math.random() * CEO_FIRST_NAMES.length)];
    const last = CEO_LAST_NAMES[Math.floor(Math.random() * CEO_LAST_NAMES.length)];
    const input = document.getElementById('wiz-player-name');
    if (input) input.value = `${first} ${last}`;
  }

  randomizeCompanyName() {
    const p = CORP_PREFIXES[Math.floor(Math.random() * CORP_PREFIXES.length)];
    const r = CORP_ROOTS[Math.floor(Math.random() * CORP_ROOTS.length)];
    const s = CORP_SUFFIXES[Math.floor(Math.random() * CORP_SUFFIXES.length)];
    const name = Math.random() < 0.4 ? `${p} ${r}` : `${p} ${r} ${s}`;
    const input = document.getElementById('wiz-company-name');
    if (input) input.value = name;
    this.updateWizLogoPreview();
  }

  updateWizLogoPreview() {
    const cName = document.getElementById('wiz-company-name')?.value.trim() || 'OikoCorp Holding';
    const genLogoFn = window.generateCompanyLogo || (() => ({}));
    const getSvgFn = window.getCompanyLogoSvg || (() => '');
    const logo = genLogoFn(cName, this.selectedWizLogoSeed, false, this.selectedWizColorId);
    const previewEl = document.getElementById('wiz-logo-preview');

    if (previewEl) {
      previewEl.innerHTML = getSvgFn(logo, 28);
      const palettes = window.COLOR_PALETTES || [];
      const palette = palettes.find(c => c.id === this.selectedWizColorId);
      if (palette) {
        previewEl.style.borderColor = palette.hex;
      }
    }
  }

  regenerateWizLogo() {
    this.selectedWizLogoSeed = (this.selectedWizLogoSeed + 1) % 1000;
    this.updateWizLogoPreview();
    if (typeof window.playBeep === 'function') {
      window.playBeep(640, 'sine', 0.05);
    }
  }

  renderWizAvatars() {
    const container = document.getElementById('wiz-avatar-grid');
    if (!container) return;
    const avatars = window.AVATAR_CATALOG || [];

    container.innerHTML = avatars.map(av => {
      const isSel = av.id === this.selectedWizAvatarId;
      return `
        <button onclick="AppLifecycle.selectWizAvatar('${av.id}')" class="p-2 rounded-xl border text-center transition flex flex-col items-center gap-0.5 cursor-pointer relative group ${
          isSel ? 'bg-emerald-950/90 border-emerald-400 shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400' : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
        }" title="${av.name} (${av.category}) — ${av.desc}">
          <span class="text-xl block leading-none py-0.5">${av.emoji}</span>
          <span class="text-[8px] font-bold text-slate-200 truncate w-full block">${av.name.split(' ')[0]}</span>
          <span class="text-[7px] text-slate-500 block truncate w-full">${av.category}</span>
        </button>
      `;
    }).join('');
  }

  selectWizAvatar(id) {
    this.selectedWizAvatarId = id;
    this.renderWizAvatars();
    if (typeof window.playBeep === 'function') {
      window.playBeep(480, 'sine', 0.05);
    }
  }

  renderWizColors() {
    const container = document.getElementById('wiz-color-selector');
    if (!container) return;
    const palettes = window.COLOR_PALETTES || [];

    container.innerHTML = palettes.map(c => {
      const isSel = c.id === this.selectedWizColorId;
      return `
        <button onclick="AppLifecycle.selectWizColor('${c.id}')" class="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
          isSel ? 'border-white bg-slate-800 font-bold ring-1 ring-white/50' : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-600'
        }">
          <span class="w-3.5 h-3.5 rounded-full" style="background-color: ${c.hex}"></span>
          <span>${c.name}</span>
        </button>
      `;
    }).join('');
  }

  selectWizColor(id) {
    this.selectedWizColorId = id;
    window.selectedWizColorId = id;
    this.renderWizColors();
    this.updateWizLogoPreview();
    if (typeof window.playBeep === 'function') {
      window.playBeep(520, 'sine', 0.05);
    }
  }

  renderWizDifficulties() {
    const container = document.getElementById('wiz-difficulty-selector');
    if (!container) return;
    const presets = window.DIFFICULTY_PRESETS || [];

    container.innerHTML = presets.map(d => {
      const isSel = d.id === this.selectedWizDifficultyId;
      return `
        <button onclick="AppLifecycle.selectWizDifficulty('${d.id}')" class="p-3 rounded-2xl border text-left transition space-y-1 ${
          isSel ? 'bg-emerald-950/60 border-emerald-400 shadow-md' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
        }">
          <div class="flex justify-between items-center">
            <span class="font-bold text-slate-100 text-xs">${d.name}</span>
            <span class="text-[10px] text-emerald-400 font-mono">$${(d.startingCash/1000).toFixed(0)}k</span>
          </div>
          <p class="text-[10px] text-slate-400 leading-tight">${d.desc}</p>
        </button>
      `;
    }).join('');
  }

  selectWizDifficulty(id) {
    this.selectedWizDifficultyId = id;
    this.renderWizDifficulties();
    if (typeof window.playBeep === 'function') {
      window.playBeep(580, 'sine', 0.05);
    }
  }

  startNewGameFromWizard() {
    const pName = document.getElementById('wiz-player-name')?.value.trim() || 'Arthur Vance';
    const cName = document.getElementById('wiz-company-name')?.value.trim() || 'OikoCorp Holding';
    const presets = window.DIFFICULTY_PRESETS || [];
    const diff = presets.find(d => d.id === this.selectedWizDifficultyId) || presets[1] || { startingCash: 250000 };

    window.playerProfile = {
      playerName: pName,
      companyName: cName,
      avatarId: this.selectedWizAvatarId,
      themeColor: this.selectedWizColorId,
      difficulty: this.selectedWizDifficultyId,
      logoRegenSeed: this.selectedWizLogoSeed || 0
    };

    window.cash = diff.startingCash;
    window.day = 1;
    window.month = 1;
    window.year = 1;
    window.playtimeSeconds = 0;
    window.currentSaveSlotId = null;

    if (window.unlockedCities) {
      window.unlockedCities.nova_atenas = true;
      window.unlockedCities.porto_real = true;
      window.unlockedCities.montargis = false;
      window.unlockedCities.varzea = false;
    }

    if (window.activeMarketingContracts) window.activeMarketingContracts.clear();
    if (window.historicalLedger) window.historicalLedger.length = 0;

    const catalog = window.PRODUCT_CATALOG || {};
    if (window.playerBrandRating) {
      Object.keys(catalog).forEach(id => window.playerBrandRating[id] = 20);
    }
    if (window.rdLabs) {
      Object.keys(window.rdLabs).forEach(k => delete window.rdLabs[k]);
    }
    if (window.GameState) {
      window.GameState.banking = { activeLoans: [], totalDebt: 0, loanHistory: [] };
    }

    if (window.unlockedProducts) {
      window.unlockedProducts.clear();
      ['wheat', 'corn', 'cotton', 'sugar_cane', 'cocoa', 'coffee_beans', 'grapes', 'tobacco', 'rubber',
       'cattle', 'raw_milk', 'poultry', 'pigs', 'wool', 'iron_ore', 'bauxite', 'crude_oil', 'silica',
       'timber', 'gold_ore', 'chemical_minerals', 'eggs', 'bread', 'milk'].forEach(p => window.unlockedProducts.add(p));
    }

    if (typeof window.initWorldGrid === 'function') window.initWorldGrid();
    this.closeNewGameWizard();
    this.hideMainMenu();
    this.updatePlayerProfileHUD();

    if (typeof window.updateUI === 'function') window.updateUI();
    const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
    if (typeof renderFn === 'function') renderFn();

    this.currentAppScreen = 'PLAYING';
    window.currentAppScreen = 'PLAYING';

    const setSpeedFn = window.HUDSystem?.setSpeed || window.setSpeed;
    if (typeof setSpeedFn === 'function') setSpeedFn(0);

    const jumpFn = window.CameraController?.jumpToCity || window.jumpToCity;
    if (typeof jumpFn === 'function') jumpFn('nova_atenas');

    this.tutorialState = { completedSteps: {}, rewardClaimed: false, active: true };
    window.tutorialState = this.tutorialState;
    this.renderTutorialGuide();

    if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
    if (typeof window.addLog === 'function') {
      window.addLog(`🎉 NOVA EMPRESA FUNDADA: Bem-vindo ao comando de ${window.playerProfile.companyName}!`, 'text-emerald-400 font-bold');
      window.addLog('⏸️ SIMULAÇÃO PAUSADA: Analise a cidade e planeje sua estratégia. Pressione [Espaço] ou selecione a velocidade (1x a 5x) no topo para iniciar o tempo.', 'text-amber-300 font-bold');
    }

    const confirmModalFn = window.FacilityPanel?.showCustomConfirmModal || window.showCustomConfirmModal;
    if (typeof confirmModalFn === 'function') {
      confirmModalFn({
        icon: '🎓',
        title: 'Guia do Magnata (Tutorial)',
        subtitle: `Corporação: ${window.playerProfile.companyName}`,
        description: 'Deseja iniciar o <strong>Guia do Magnata Interativo</strong> (passo a passo com incentivo de <strong>+$5.000</strong> e <strong>+5 de Reputação de Marca</strong>) ou prefere jogar no <strong>Modo Livre (Sandbox)</strong>?<br><br>💡 <em>A simulação inicia pausada no Dia 1 para você estudar o mapa e planejar seus primeiros investimentos com tranquilidade.</em>',
        details: [
          { label: 'Recompensa do Tutorial', value: '+$5,000 + 5⭐ Marca Global', color: 'text-amber-400 font-bold' },
          { label: 'Estrutura', value: '7 Missões de Progressão Real', color: 'text-purple-300' },
          { label: 'Recomendação Inicial', value: 'Kombini de Bairro (Rápido Payback)', color: 'text-emerald-400 font-bold' }
        ],
        confirmText: '🎓 Iniciar Guia do Magnata',
        confirmTheme: 'amber',
        onConfirm: () => {
          this.tutorialState.active = true;
          const tutWidget = document.getElementById('tutorial-guide-widget');
          if (tutWidget) tutWidget.classList.remove('hidden');
          this.renderTutorialGuide();
          if (typeof window.addLog === 'function') {
            window.addLog('🎓 GUIA DO MAGNATA ATIVADO: Acompanhe as missões no painel flutuante à esquerda!', 'text-amber-400 font-bold');
          }
        }
      });
    }
  }

  // ===========================================================================
  // 4. TUTORIAL GUIDE (GUIA DO MAGNATA)
  // ===========================================================================
  toggleTutorialWidget() {
    const el = document.getElementById('tutorial-guide-widget');
    if (!el) return;
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) {
      this.renderTutorialGuide();
    }
  }

  checkTutorialProgress(silent = false) {
    let anyNew = false;
    for (const m of TUTORIAL_MISSIONS) {
      if (!this.tutorialState.completedSteps[m.id] && m.check()) {
        this.tutorialState.completedSteps[m.id] = true;
        anyNew = true;
        if (!silent) {
          if (typeof window.addLog === 'function') {
            window.addLog(`🎓 Missão Concluída: "${m.title}"!`, 'text-amber-400 font-bold');
          }
          if (typeof window.playSuccessChime === 'function') {
            window.playSuccessChime();
          }
        }
      }
    }
    if (anyNew) {
      this.renderTutorialGuide();
    }
  }

  renderTutorialGuide() {
    const container = document.getElementById('tutorial-steps-container');
    if (!container) return;

    const allDone = TUTORIAL_MISSIONS.every(m => this.tutorialState.completedSteps[m.id]);
    const claimBtn = document.getElementById('tutorial-claim-btn');
    if (claimBtn) {
      claimBtn.disabled = !allDone || this.tutorialState.rewardClaimed;
      claimBtn.textContent = this.tutorialState.rewardClaimed ? '✓ Resgatado' : (allDone ? '🎉 Resgatar (+$5k + 5⭐)' : 'Resgatar');
    }

    const menuBadge = document.getElementById('menu-tutorial-badge');
    const moreMenuBadge = document.getElementById('more-menu-badge');
    const hudTutBtn = document.getElementById('btn-hud-tutorial');
    const hudTutBadge = document.getElementById('hud-tutorial-badge');

    if (hudTutBtn) {
      if (allDone && this.tutorialState.rewardClaimed) {
        hudTutBtn.classList.remove('animate-pulse');
        if (hudTutBadge) {
          hudTutBadge.textContent = '✓ Concluído';
          hudTutBadge.className = 'text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono shrink-0 whitespace-nowrap';
        }
      } else if (allDone) {
        hudTutBtn.classList.add('animate-pulse');
        if (hudTutBadge) {
          hudTutBadge.textContent = '🎁 Resgatar!';
          hudTutBadge.className = 'text-[8px] bg-[#c9a86a] text-slate-950 font-bold px-1.5 py-0.5 rounded font-mono shrink-0 whitespace-nowrap';
        }
      } else {
        hudTutBtn.classList.add('animate-pulse');
        const doneCount = TUTORIAL_MISSIONS.filter(m => this.tutorialState.completedSteps[m.id]).length;
        if (hudTutBadge) {
          hudTutBadge.textContent = `${doneCount}/${TUTORIAL_MISSIONS.length}`;
          hudTutBadge.className = 'text-[8px] bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30 px-1.5 py-0.5 rounded font-mono shrink-0 whitespace-nowrap';
        }
      }
    }

    if (allDone && this.tutorialState.rewardClaimed) {
      if (menuBadge) menuBadge.classList.add('hidden');
      if (moreMenuBadge) moreMenuBadge.classList.add('hidden');
    } else {
      if (menuBadge) menuBadge.classList.remove('hidden');
      const curYear = window.year || 1;
      const curMonth = window.month || 1;
      if (curYear === 1 && curMonth <= 6) {
        if (moreMenuBadge) moreMenuBadge.classList.remove('hidden');
      } else {
        if (moreMenuBadge) moreMenuBadge.classList.add('hidden');
      }
    }

    container.innerHTML = TUTORIAL_MISSIONS.map((m) => {
      const done = Boolean(this.tutorialState.completedSteps[m.id]);
      return `
        <div class="p-2 rounded-xl border transition ${done ? 'bg-emerald-950/40 border-emerald-700/60' : 'bg-slate-950/80 border-slate-800'}">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-xs ${done ? 'text-emerald-300' : 'text-slate-200'}">${m.title}</span>
            <span class="text-xs">${done ? '✅' : '⏳'}</span>
          </div>
          <p class="text-[10px] text-slate-400 mt-0.5 leading-snug">${m.desc}</p>
        </div>
      `;
    }).join('');
  }

  claimTutorialReward() {
    if (this.tutorialState.rewardClaimed) return;
    this.tutorialState.rewardClaimed = true;
    window.cash = (window.cash || 0) + 5000;

    const catalog = window.PRODUCT_CATALOG || {};
    const brandRating = window.playerBrandRating || {};
    Object.keys(catalog).forEach(id => {
      brandRating[id] = Math.min(100, (brandRating[id] || 20) + 5);
    });

    if (typeof window.addGameLog === 'function') {
      window.addGameLog('🎓 Parabéns! Você concluiu o Guia do Magnata e recebeu +$5.000 em caixa e +5 de Reputação de Marca (Brand Rating) em todos os produtos da holding!', 'text-amber-400 font-black');
    }
    if (typeof window.playYearCelebration === 'function') {
      window.playYearCelebration();
    }
    this.renderTutorialGuide();
    if (typeof window.updateUI === 'function') window.updateUI();
  }

  // ===========================================================================
  // 5. CONFIGURAÇÕES GERAIS (ÁUDIO, AUTOSAVE & RÁDIO)
  // ===========================================================================
  loadGameSettings() {
    const settings = window.gameSettings || {};
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) Object.assign(settings, JSON.parse(raw));
    } catch (e) {}

    const autoEl = document.getElementById('setting-autosave');
    const masterEl = document.getElementById('setting-master-volume');
    const masterLbl = document.getElementById('setting-master-label');
    const musicEl = document.getElementById('setting-music-volume');
    const musicLbl = document.getElementById('setting-music-label');
    const ambEl = document.getElementById('setting-ambience-volume');
    const ambLbl = document.getElementById('setting-ambience-label');
    const sfxEl = document.getElementById('setting-sfx-volume');
    const lbl = document.getElementById('setting-sfx-label');

    if (autoEl) autoEl.value = settings.autoSave || 'monthly';

    const masterVol = settings.masterVolume !== undefined ? settings.masterVolume : 1.0;
    if (masterEl) masterEl.value = masterVol;
    if (masterLbl) masterLbl.textContent = `${Math.round(masterVol * 100)}%`;

    const musicVol = settings.musicVolume !== undefined ? settings.musicVolume : 0.6;
    if (musicEl) musicEl.value = musicVol;
    if (musicLbl) musicLbl.textContent = `${Math.round(musicVol * 100)}%`;

    const ambVol = settings.ambienceVolume !== undefined ? settings.ambienceVolume : 0.5;
    if (ambEl) ambEl.value = ambVol;
    if (ambLbl) ambLbl.textContent = `${Math.round(ambVol * 100)}%`;

    const sfxVol = settings.sfxVolume !== undefined ? settings.sfxVolume : 0.7;
    if (sfxEl) sfxEl.value = sfxVol;
    if (lbl) lbl.textContent = `${Math.round(sfxVol * 100)}%`;

    this.updateBgmStatusUI();

    if (window.SoundEngine && typeof window.SoundEngine.syncVolumesFromSettings === 'function') {
      window.SoundEngine.syncVolumesFromSettings();
    }

    const tickEl = document.getElementById('setting-ticker-enabled');
    if (tickEl && window.TickerUI && typeof window.TickerUI.isEnabled === 'function') {
      tickEl.checked = window.TickerUI.isEnabled();
    }

    const speedEl = document.getElementById('setting-ticker-speed');
    const speedLbl = document.getElementById('setting-ticker-speed-label');
    if (speedEl && window.TickerUI && typeof window.TickerUI.getSpeed === 'function') {
      const curSpeed = window.TickerUI.getSpeed();
      speedEl.value = curSpeed;
      if (speedLbl) {
        let text = 'Normal';
        if (curSpeed < 45) text = 'Lento';
        else if (curSpeed > 65) text = 'Rápido';
        speedLbl.textContent = `${text} (${curSpeed} px/s)`;
      }
    }
  }

  saveGameSettings() {
    const settings = window.gameSettings || {};
    const autoEl = document.getElementById('setting-autosave');
    const masterEl = document.getElementById('setting-master-volume');
    const masterLbl = document.getElementById('setting-master-label');
    const musicEl = document.getElementById('setting-music-volume');
    const musicLbl = document.getElementById('setting-music-label');
    const ambEl = document.getElementById('setting-ambience-volume');
    const ambLbl = document.getElementById('setting-ambience-label');
    const sfxEl = document.getElementById('setting-sfx-volume');
    const lbl = document.getElementById('setting-sfx-label');

    if (autoEl) settings.autoSave = autoEl.value;

    if (masterEl) {
      settings.masterVolume = parseFloat(masterEl.value);
      if (masterLbl) masterLbl.textContent = `${Math.round(settings.masterVolume * 100)}%`;
    }
    if (musicEl) {
      settings.musicVolume = parseFloat(musicEl.value);
      if (musicLbl) musicLbl.textContent = `${Math.round(settings.musicVolume * 100)}%`;
    }
    if (ambEl) {
      settings.ambienceVolume = parseFloat(ambEl.value);
      if (ambLbl) ambLbl.textContent = `${Math.round(settings.ambienceVolume * 100)}%`;
    }
    if (sfxEl) {
      settings.sfxVolume = parseFloat(sfxEl.value);
      if (lbl) lbl.textContent = `${Math.round(settings.sfxVolume * 100)}%`;
    }

    if (window.SoundEngine) {
      settings.isMusicMuted = Boolean(window.SoundEngine.isMusicMuted);
      settings.repeatMode = window.SoundEngine.repeatMode || 'playlist';
      settings.currentBgmKey = window.SoundEngine.currentBgmKey || 'bgm_1';
      if (typeof window.SoundEngine.syncVolumesFromSettings === 'function') {
        window.SoundEngine.syncVolumesFromSettings();
      }
    }

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  toggleBgmPlayPause() {
    if (window.SoundEngine && typeof window.SoundEngine.toggleBgm === 'function') {
      const isPlaying = window.SoundEngine.toggleBgm();
      const btn = document.getElementById('btn-toggle-bgm');
      if (btn) btn.textContent = isPlaying ? '⏸ Pausar' : '▶ Tocar';
    }
  }

  skipBgmTrack() {
    if (window.SoundEngine && typeof window.SoundEngine.playNextPlaylistTrack === 'function') {
      window.SoundEngine.playNextPlaylistTrack();
      this.updateBgmStatusUI();
    }
  }

  updateBgmStatusUI() {
    const statusEl = document.getElementById('setting-bgm-status');
    const btn = document.getElementById('btn-toggle-bgm');
    if (window.SoundEngine) {
      if (statusEl) {
        const key = window.SoundEngine.currentBgmKey || 'daytime_01';
        const labels = {
          menu: 'Tema do Menu',
          daytime_01: 'Trilha Corporativa 1',
          daytime_02: 'Trilha Corporativa 2',
          prosperity: 'Trilha Prosperidade',
          crisis: 'Trilha Tensa / Crise'
        };
        statusEl.textContent = labels[key] || key;
      }
      if (btn) {
        btn.textContent = window.SoundEngine.isBgmPaused ? '▶ Tocar' : '⏸ Pausar';
      }
    }
  }

  openSettingsModal() {
    this.loadGameSettings();
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  }

  initMicroRadio() {
    if (!window.SoundEngine || typeof window.SoundEngine.onRadioChange !== 'function') return;
    window.SoundEngine.onRadioChange(state => {
      this.updateRadioUI(state);
    });
    this.updateRadioUI(window.SoundEngine.getRadioState());
  }

  updateRadioUI(state) {
    if (!state) return;
    const titleEl = document.getElementById('radio-track-title');
    const btnPlay = document.getElementById('radio-btn-play-pause');
    const btnRepeat = document.getElementById('radio-btn-repeat');
    const btnMute = document.getElementById('radio-btn-mute');

    if (titleEl) {
      titleEl.textContent = state.title || 'OikoFM';
      titleEl.title = `${state.title} (${state.isPlaying ? 'Tocando' : (state.isPaused ? 'Pausado' : 'Aguardando')})`;
    }

    if (btnPlay) {
      btnPlay.textContent = state.isPlaying ? '⏸' : '▶';
      btnPlay.title = state.isPlaying ? 'Pausar Música (⏯)' : 'Tocar Música (⏯)';
      btnPlay.className = state.isPlaying
        ? 'px-1 py-0.5 rounded hover:bg-slate-800 text-emerald-400 font-bold cursor-pointer transition'
        : 'px-1 py-0.5 rounded hover:bg-slate-800 text-amber-400 font-bold cursor-pointer transition';
    }

    if (btnRepeat) {
      btnRepeat.textContent = (state.repeatMode === 'track') ? '🔂' : '🔁';
      btnRepeat.title = (state.repeatMode === 'track')
        ? 'Repetindo Faixa Atual (Clique para alternar para Playlist Contínua)'
        : 'Playlist Contínua (Clique para repetir faixa atual)';
      btnRepeat.className = (state.repeatMode === 'track')
        ? 'px-1 py-0.5 rounded hover:bg-slate-800 text-amber-300 font-bold cursor-pointer transition'
        : 'px-1 py-0.5 rounded hover:bg-slate-800 text-slate-400 cursor-pointer transition';
    }

    if (btnMute) {
      btnMute.textContent = state.isMuted ? '🔇' : '🔊';
      btnMute.title = state.isMuted ? 'Música Mutada (Clique para Restaurar Áudio)' : 'Música Ativa (Clique para Mutar)';
      btnMute.className = state.isMuted
        ? 'px-1 py-0.5 rounded hover:bg-slate-800 text-rose-400 font-bold animate-pulse cursor-pointer transition'
        : 'px-1 py-0.5 rounded hover:bg-slate-800 text-slate-400 cursor-pointer transition';
    }

    this.updateBgmStatusUI();
  }

  // ===========================================================================
  // 6. GERENCIADOR DE SLOTS DE SAVE / LOAD UI
  // ===========================================================================
  openSaveLoadModal(mode = 'load') {
    this.currentSaveLoadMode = mode;
    const modal = document.getElementById('save-load-modal');
    const title = document.getElementById('save-load-modal-title');
    const btnNew = document.getElementById('btn-create-new-save-slot');

    if (title) title.textContent = mode === 'save' ? '💾 Salvar Jogo nos Slots' : '📂 Carregar Jogo do Histórico';
    const screen = window.currentAppScreen || this.currentAppScreen;
    if (btnNew) btnNew.style.display = (mode === 'save' || screen === 'PAUSED' || screen === 'PLAYING') ? 'inline-flex' : 'none';

    this.renderSavesList();
    if (modal) modal.classList.remove('hidden');
  }

  closeSaveLoadModal() {
    const modal = document.getElementById('save-load-modal');
    if (modal) modal.classList.add('hidden');
  }

  renderSavesList() {
    const container = document.getElementById('saves-list-container');
    if (!container) return;

    const getSavesFn = window.getSavesIndex || (() => []);
    const saves = getSavesFn();

    if (saves.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500 space-y-2">
          <span class="text-3xl block">📭</span>
          <p>Nenhum jogo salvo encontrado no histórico local.</p>
        </div>
      `;
      return;
    }

    const avatars = window.AVATAR_CATALOG || [];
    const curSlotId = window.currentSaveSlotId;

    container.innerHTML = saves.map(s => {
      const av = avatars.find(a => a.id === s.avatarId) || avatars[0] || { emoji: '👤' };
      const dateFormatted = new Date(s.dateISO).toLocaleString('pt-BR');
      const isCurrent = s.id === curSlotId;

      return `
        <div class="p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isCurrent ? 'bg-slate-800/90 border-emerald-500/70 shadow-lg' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
        }">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow">
              ${av.emoji}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-100 text-sm">${s.companyName}</h4>
                ${isCurrent ? '<span class="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">ATUAL</span>' : ''}
              </div>
              <div class="text-[10px] text-slate-400 flex flex-wrap gap-2 mt-0.5">
                <span>👤 ${s.playerName}</span>
                <span>•</span>
                <span class="text-emerald-400 font-bold">$${(s.cash || 0).toLocaleString('en-US',{maximumFractionDigits:0})}</span>
                <span>•</span>
                <span>🗓️ ${s.gameDate}</span>
              </div>
              <span class="text-[9px] text-slate-500 block mt-1">Salvo em: ${dateFormatted} (${s.builtCount || 0} instalações)</span>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-center font-mono">
            <button onclick="loadGameById('${s.id}')" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow flex items-center gap-1">
              📂 Carregar
            </button>
            ${this.currentSaveLoadMode === 'save' ? `
              <button onclick="saveGame('${s.id}')" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs" title="Sobrescrever este slot">
                💾 Sobrescrever
              </button>
            ` : ''}
            <button onclick="deleteSaveById('${s.id}', event)" class="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700" title="Excluir save">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderSavesCountInMenu() {
    const getSavesFn = window.getSavesIndex || (() => []);
    const saves = getSavesFn();
    const countEl = document.getElementById('menu-save-count');
    if (countEl) countEl.textContent = saves.length;
  }

  // ===========================================================================
  // 7. PERFIL DO JOGADOR NO HUD
  // ===========================================================================
  updatePlayerProfileHUD() {
    const profile = window.playerProfile || {
      playerName: 'Arthur Vance',
      companyName: 'OikoCorp Holding',
      avatarId: 'human_ceo'
    };
    const avatars = window.AVATAR_CATALOG || [];
    const avatarObj = avatars.find(a => a.id === profile.avatarId) || avatars[0] || { emoji: '👔' };

    const avEl = document.getElementById('hud-player-avatar');
    const compEl = document.getElementById('hud-company-name');
    const nameEl = document.getElementById('hud-player-name');
    const logoEl = document.getElementById('hud-corp-logo-badge');

    if (avEl) avEl.textContent = avatarObj.emoji;
    if (compEl) compEl.textContent = profile.companyName;
    if (nameEl) nameEl.textContent = profile.playerName;

    if (logoEl) {
      const genLogoFn = window.generateCompanyLogo || (() => ({}));
      const getSvgFn = window.getCompanyLogoSvg || (() => '');
      const logo = genLogoFn(profile.companyName, profile.logoRegenSeed || 0, false, profile.themeColor);
      logoEl.innerHTML = getSvgFn(logo, 22);
    }

    const pauseTag = document.getElementById('pause-company-tag');
    if (pauseTag) pauseTag.textContent = `${profile.companyName} • ${profile.playerName}`;
  }
}

export const AppLifecycle = new LifecycleManager();

if (typeof window !== 'undefined') {
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
}
