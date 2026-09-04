/**
 * audio.js — Motor de Áudio & Micro Rádio Avançado de OIKONOMIA
 * 
 * Recursos:
 * 1. Micro Rádio OikoFM: Pular, Voltar, Repetir (Faixa/Playlist), Mute e Ticker de Faixa.
 * 2. Suporte nativo à biblioteca de áudio completa (BGM 1 a 7, Ambience low traffic, SFX).
 * 3. Paisagens Sonoras Ambientes (Ambience Loops) em camadas contextuais.
 * 4. Efeitos Sonoros (SFX) híbridos com Fallback Procedural via Web Audio API.
 * 5. Desbloqueio seguro de autoplay (User Gesture Unlock).
 */

const SoundEngine = {
  // Web Audio Context & Gain Nodes
  audioCtx: null,
  masterGain: null,
  sfxGain: null,
  musicGain: null,
  ambienceGain: null,
  isUnlocked: false,

  // Registros de Faixas BGM
  bgmTracks: {
    bgm_1: 'assets/audio/bgm/bgm-01.mp3',
    bgm_2: 'assets/audio/bgm/bgm-02.mp3',
    bgm_3: 'assets/audio/bgm/bgm-03.mp3',
    bgm_4: 'assets/audio/bgm/bgm-04.mp3',
    bgm_5: 'assets/audio/bgm/bgm-05.mp3',
    bgm_6: 'assets/audio/bgm/bgm-06.mp3',
    bgm_7: 'assets/audio/bgm/bgm-07.mp3',
    // Aliases semânticos
    menu: 'assets/audio/bgm/bgm-01.mp3',
    daytime_01: 'assets/audio/bgm/bgm-01.mp3',
    daytime_02: 'assets/audio/bgm/bgm-02.mp3',
    prosperity: 'assets/audio/bgm/bgm-04.mp3',
    crisis: 'assets/audio/bgm/bgm-06.mp3'
  },

  trackTitles: {
    bgm_1: 'BGM 1 — Lounge Corporativo',
    bgm_2: 'BGM 2 — Foco & Planejamento',
    bgm_3: 'BGM 3 — Manhã Produtiva',
    bgm_4: 'BGM 4 — Prosperidade',
    bgm_5: 'BGM 5 — Estratégia de Mercado',
    bgm_6: 'BGM 6 — Tensão & Negócios',
    bgm_7: 'BGM 7 — Visão Global',
    menu: 'BGM 1 — Lounge Corporativo',
    daytime_01: 'BGM 1 — Lounge Corporativo',
    daytime_02: 'BGM 2 — Foco & Planejamento',
    prosperity: 'BGM 4 — Prosperidade',
    crisis: 'BGM 6 — Tensão & Negócios'
  },

  playlist: ['bgm_1', 'bgm_2', 'bgm_3', 'bgm_4', 'bgm_5', 'bgm_6', 'bgm_7'],
  currentBgmKey: 'bgm_1',
  currentBgmElement: null,
  isBgmPaused: false,
  isMusicMuted: false,
  repeatMode: 'playlist', // 'playlist' (avança) ou 'track' (repete mesma música)
  radioListeners: [],

  // Registros de Ambience
  ambienceTracks: {
    city: 'assets/audio/ambience/ambience-low-traffic.mp3',
    commercial: 'assets/audio/ambience/commercial-hub-loop.mp3',
    industrial: 'assets/audio/ambience/industrial-zone-loop.mp3',
    rural: 'assets/audio/ambience/rural-farm-loop.mp3',
    seaport: 'assets/audio/ambience/seaport-loop.mp3'
  },
  activeAmbienceLoops: {},

  // Registros de SFX
  sfxFailedPaths: new Set(),

  // Inicialização e AudioContext
  init() {
    this.setupUnlockListeners();
  },

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.setupGainNodes();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  },

  setupGainNodes() {
    if (!this.audioCtx) return;
    try {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);

      this.sfxGain = this.audioCtx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.audioCtx.createGain();
      this.musicGain.connect(this.masterGain);

      this.ambienceGain = this.audioCtx.createGain();
      this.ambienceGain.connect(this.masterGain);

      this.syncVolumesFromSettings();
    } catch (e) {
      console.warn('[SoundEngine] Erro ao configurar nós de ganho:', e);
    }
  },

  setupUnlockListeners() {
    if (this.isUnlocked) return;
    const unlock = () => {
      this.isUnlocked = true;
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      if (this.currentBgmElement && this.currentBgmElement.paused && !this.isBgmPaused) {
        this.currentBgmElement.play().catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
  },

  // Observador de UI do Micro Rádio
  onRadioChange(callback) {
    if (typeof callback === 'function') {
      this.radioListeners.push(callback);
    }
  },

  notifyRadioChange() {
    const state = this.getRadioState();
    this.radioListeners.forEach(cb => {
      try { cb(state); } catch (e) {}
    });
  },

  getRadioState() {
    const key = this.currentBgmKey || 'bgm_1';
    return {
      trackKey: key,
      title: this.trackTitles[key] || key,
      isPlaying: !this.isBgmPaused && Boolean(this.currentBgmElement && !this.currentBgmElement.paused),
      isPaused: this.isBgmPaused,
      isMuted: this.isMusicMuted,
      repeatMode: this.repeatMode // 'playlist' | 'track'
    };
  },

  // Controles de Volume
  getSettings() {
    if (typeof gameSettings !== 'undefined' && gameSettings) {
      return gameSettings;
    }
    return {
      masterVolume: 1.0,
      musicVolume: 0.6,
      ambienceVolume: 0.5,
      sfxVolume: 0.7
    };
  },

  syncVolumesFromSettings() {
    const s = this.getSettings();
    this.setMasterVolume(s.masterVolume !== undefined ? s.masterVolume : 1.0);
    this.setMusicVolume(s.musicVolume !== undefined ? s.musicVolume : 0.6);
    this.setAmbienceVolume(s.ambienceVolume !== undefined ? s.ambienceVolume : 0.5);
    this.setSfxVolume(s.sfxVolume !== undefined ? s.sfxVolume : 0.7);
  },

  setMasterVolume(vol) {
    const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(v, this.audioCtx.currentTime);
    }
    this.updateBgmOutputVolume();
    this.updateAmbienceOutputVolumes();
  },

  setMusicVolume(vol) {
    const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setValueAtTime(v, this.audioCtx.currentTime);
    }
    this.updateBgmOutputVolume();
    this.notifyRadioChange();
  },

  updateBgmOutputVolume() {
    if (this.currentBgmElement) {
      if (this.isMusicMuted) {
        this.currentBgmElement.volume = 0;
        return;
      }
      const s = this.getSettings();
      const mus = s.musicVolume !== undefined ? s.musicVolume : 0.6;
      const m = s.masterVolume !== undefined ? s.masterVolume : 1.0;
      this.currentBgmElement.volume = Math.max(0, Math.min(1, mus * m));
    }
  },

  setAmbienceVolume(vol) {
    const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    if (this.ambienceGain && this.audioCtx) {
      this.ambienceGain.gain.setValueAtTime(v, this.audioCtx.currentTime);
    }
    this.updateAmbienceOutputVolumes();
  },

  updateAmbienceOutputVolumes() {
    const s = this.getSettings();
    const amb = s.ambienceVolume !== undefined ? s.ambienceVolume : 0.5;
    const m = s.masterVolume !== undefined ? s.masterVolume : 1.0;
    Object.values(this.activeAmbienceLoops).forEach(item => {
      if (item && item.audio) {
        const base = item.baseVolume || 1.0;
        item.audio.volume = Math.max(0, Math.min(1, amb * m * base));
      }
    });
  },

  setSfxVolume(vol) {
    const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    if (this.sfxGain && this.audioCtx) {
      this.sfxGain.gain.setValueAtTime(v, this.audioCtx.currentTime);
    }
  },

  getEffectiveVolume() {
    const s = this.getSettings();
    const sfx = s.sfxVolume !== undefined ? parseFloat(s.sfxVolume) : 0.7;
    const master = s.masterVolume !== undefined ? parseFloat(s.masterVolume) : 1.0;
    return (!isNaN(sfx) && sfx >= 0 ? Math.min(1, sfx) : 0.7) * (!isNaN(master) && master >= 0 ? Math.min(1, master) : 1.0);
  },

  // -------------------------------------------------------------
  // SISTEMA BGM & MICRO RÁDIO (Pula, Volta, Repeat, Mute)
  // -------------------------------------------------------------
  playBgm(trackKey, crossfadeSec = 2.0) {
    const canonicalKey = this.bgmTracks[trackKey] ? trackKey : 'bgm_1';
    const path = this.bgmTracks[canonicalKey];
    if (!path) return;

    if (this.currentBgmKey === canonicalKey && this.currentBgmElement && !this.currentBgmElement.paused) {
      return;
    }

    this.currentBgmKey = canonicalKey;
    this.isBgmPaused = false;

    const nextAudio = new Audio();
    nextAudio.src = path;
    nextAudio.loop = (this.repeatMode === 'track');
    nextAudio.preload = 'auto';

    const s = this.getSettings();
    const targetVolume = this.isMusicMuted ? 0 :
      (s.musicVolume !== undefined ? s.musicVolume : 0.6) * (s.masterVolume !== undefined ? s.masterVolume : 1.0);

    // Fade out do áudio anterior
    const prevAudio = this.currentBgmElement;
    if (prevAudio && !prevAudio.paused) {
      let fadeOutSteps = 20;
      let stepTime = (crossfadeSec * 1000) / fadeOutSteps;
      let curVol = prevAudio.volume;
      let volStep = curVol / fadeOutSteps;

      const fadeOutInterval = setInterval(() => {
        curVol = Math.max(0, curVol - volStep);
        prevAudio.volume = curVol;
        if (curVol <= 0.01) {
          clearInterval(fadeOutInterval);
          prevAudio.pause();
          prevAudio.removeAttribute('src');
          prevAudio.load();
        }
      }, stepTime);
    }

    // Fade in do novo áudio
    nextAudio.volume = 0;
    this.currentBgmElement = nextAudio;

    const playPromise = nextAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        let fadeInSteps = 20;
        let stepTime = (crossfadeSec * 1000) / fadeInSteps;
        let curVol = 0;
        let volStep = targetVolume / fadeInSteps;

        const fadeInInterval = setInterval(() => {
          curVol = Math.min(targetVolume, curVol + volStep);
          if (nextAudio) nextAudio.volume = curVol;
          if (curVol >= targetVolume - 0.01) {
            clearInterval(fadeInInterval);
            if (nextAudio) nextAudio.volume = targetVolume;
          }
        }, stepTime);

        this.notifyRadioChange();
      }).catch(() => {
        this.notifyRadioChange();
      });
    }

    // Fim da faixa: se modo for 'track', o loop do áudio repete; se 'playlist', avança
    nextAudio.onended = () => {
      if (this.repeatMode === 'track') {
        nextAudio.currentTime = 0;
        nextAudio.play().catch(() => {});
      } else {
        this.playNextTrack();
      }
    };

    nextAudio.onerror = () => {
      console.warn(`[SoundEngine] Aviso: Faixa '${path}' não pôde ser reproduzida.`);
    };

    this.notifyRadioChange();
  },

  playNextTrack() {
    if (!this.playlist || this.playlist.length === 0) return;
    let nextIdx = 0;
    const curIdx = this.playlist.indexOf(this.currentBgmKey);
    if (curIdx !== -1) {
      nextIdx = (curIdx + 1) % this.playlist.length;
    }
    this.playBgm(this.playlist[nextIdx], 1.5);
  },

  playPrevTrack() {
    if (!this.playlist || this.playlist.length === 0) return;
    let prevIdx = 0;
    const curIdx = this.playlist.indexOf(this.currentBgmKey);
    if (curIdx !== -1) {
      prevIdx = (curIdx - 1 + this.playlist.length) % this.playlist.length;
    } else {
      prevIdx = this.playlist.length - 1;
    }
    this.playBgm(this.playlist[prevIdx], 1.5);
  },

  pauseBgm() {
    this.isBgmPaused = true;
    if (this.currentBgmElement) {
      this.currentBgmElement.pause();
    }
    this.notifyRadioChange();
  },

  resumeBgm() {
    this.isBgmPaused = false;
    if (this.currentBgmElement && this.currentBgmElement.paused) {
      this.currentBgmElement.play().catch(() => {});
    } else if (!this.currentBgmElement) {
      this.playBgm(this.currentBgmKey || this.playlist[0] || 'bgm_1');
    }
    this.notifyRadioChange();
  },

  toggleBgm() {
    if (this.isBgmPaused || !this.currentBgmElement || this.currentBgmElement.paused) {
      this.resumeBgm();
      return true;
    } else {
      this.pauseBgm();
      return false;
    }
  },

  toggleRepeatMode() {
    this.repeatMode = (this.repeatMode === 'playlist') ? 'track' : 'playlist';
    if (this.currentBgmElement) {
      this.currentBgmElement.loop = (this.repeatMode === 'track');
    }
    this.notifyRadioChange();
    return this.repeatMode;
  },

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    this.updateBgmOutputVolume();
    this.notifyRadioChange();
    return this.isMusicMuted;
  },

  // -------------------------------------------------------------
  // SISTEMA AMBIENCE (Loops Contínuos & Camadas Dinâmicas)
  // -------------------------------------------------------------
  playAmbience(type = 'city', baseVolume = 0.5) {
    const path = this.ambienceTracks[type] || type;
    if (!path) return;

    if (this.activeAmbienceLoops[type]) {
      return;
    }

    const audio = new Audio();
    audio.src = path;
    audio.loop = true;
    audio.preload = 'auto';

    const s = this.getSettings();
    const effectiveVol = (s.ambienceVolume !== undefined ? s.ambienceVolume : 0.5) * 
                         (s.masterVolume !== undefined ? s.masterVolume : 1.0) * baseVolume;

    audio.volume = Math.max(0, Math.min(1, effectiveVol));

    this.activeAmbienceLoops[type] = {
      audio: audio,
      baseVolume: baseVolume
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    audio.onerror = () => {
      delete this.activeAmbienceLoops[type];
    };
  },

  stopAmbience(type) {
    if (type && this.activeAmbienceLoops[type]) {
      const item = this.activeAmbienceLoops[type];
      if (item.audio) {
        item.audio.pause();
        item.audio.removeAttribute('src');
      }
      delete this.activeAmbienceLoops[type];
    } else if (!type) {
      Object.keys(this.activeAmbienceLoops).forEach(t => this.stopAmbience(t));
    }
  },

  setAmbienceFocus(type, intensity = 1.0) {
    if (this.activeAmbienceLoops[type]) {
      const item = this.activeAmbienceLoops[type];
      item.baseVolume = Math.max(0, Math.min(1, intensity));
      const s = this.getSettings();
      const effectiveVol = (s.ambienceVolume !== undefined ? s.ambienceVolume : 0.5) * 
                           (s.masterVolume !== undefined ? s.masterVolume : 1.0) * item.baseVolume;
      if (item.audio) {
        item.audio.volume = Math.max(0, Math.min(1, effectiveVol));
      }
    } else if (intensity > 0.1) {
      this.playAmbience(type, intensity);
    }
  },

  // -------------------------------------------------------------
  // SISTEMA SFX (Híbrido: Sample de Áudio Real com Fallback Procedural)
  // -------------------------------------------------------------
  playSfxFile(path, fallbackFn) {
    if (this.sfxFailedPaths.has(path)) {
      if (fallbackFn) fallbackFn();
      return;
    }

    try {
      const s = this.getSettings();
      const sfxVol = s.sfxVolume !== undefined ? s.sfxVolume : 0.7;
      const masterVol = s.masterVolume !== undefined ? s.masterVolume : 1.0;
      const vol = Math.max(0, Math.min(1, sfxVol * masterVol));

      if (vol <= 0) return;

      const audio = new Audio(path);
      audio.volume = vol;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          this.sfxFailedPaths.add(path);
          if (fallbackFn) fallbackFn();
        });
      }
    } catch (e) {
      this.sfxFailedPaths.add(path);
      if (fallbackFn) fallbackFn();
    }
  },

  // Efeitos Sonoros Mapeados
  playClick() {
    this.playSfxFile('assets/audio/sfx/ui/click.mp3', () => {
      this.playBeep(440, 'sine', 0.03, 0.04);
    });
  },

  playModalOpen() {
    this.playSfxFile('assets/audio/sfx/ui/modal-open.mp3', () => {
      this.playBeep(520, 'sine', 0.06, 0.04);
    });
  },

  playStampContract() {
    this.playSfxFile('assets/audio/sfx/ui/stamp-contract.mp3', () => {
      this.playBeep(180, 'triangle', 0.12, 0.08);
    });
  },

  playCashRegister() {
    this.playSfxFile('assets/audio/sfx/economy/cash-register-low.mp3', () => {
      this.playBeep(880, 'triangle', 0.06, 0.07);
      setTimeout(() => this.playBeep(1174.66, 'triangle', 0.10, 0.09), 50);
    });
  },

  playCoinClink() {
    this.playSfxFile('assets/audio/sfx/economy/coin-clink.mp3', () => {
      this.playBeep(1200, 'sine', 0.04, 0.05);
      setTimeout(() => this.playBeep(1400, 'sine', 0.05, 0.05), 35);
    });
  },

  playLoanPayout() {
    this.playSfxFile('assets/audio/sfx/economy/loan-payout.mp3', () => {
      this.playSuccessChime();
    });
  },

  playBuild() {
    this.playSfxFile('assets/audio/sfx/building/hammer1.mp3', () => {
      this.playBeep(320, 'square', 0.06, 0.06);
      setTimeout(() => this.playBeep(480, 'square', 0.09, 0.07), 60);
    });
  },

  playDemolish() {
    this.playSfxFile('assets/audio/sfx/building/demolish.mp3', () => {
      this.playBeep(180, 'sawtooth', 0.15, 0.08);
    });
  },

  playUpgrade() {
    this.playSfxFile('assets/audio/sfx/building/upgrade.mp3', () => {
      this.playBeep(600, 'triangle', 0.08, 0.06);
      setTimeout(() => this.playBeep(800, 'triangle', 0.1, 0.07), 60);
    });
  },

  playYearCelebration() {
    this.playSfxFile('assets/audio/sfx/events/great-win.mp3', () => {
      this.playBeep(440, 'triangle', 0.1, 0.08);
      setTimeout(() => this.playBeep(554.37, 'triangle', 0.1, 0.09), 80);
      setTimeout(() => this.playBeep(659.25, 'triangle', 0.12, 0.1), 160);
      setTimeout(() => this.playBeep(880.00, 'triangle', 0.25, 0.12), 240);
    });
  },

  playSuccessChime() {
    this.playSfxFile('assets/audio/sfx/events/win-01.mp3', () => {
      this.playBeep(523.25, 'triangle', 0.08, 0.08);
      setTimeout(() => this.playBeep(659.25, 'triangle', 0.08, 0.08), 70);
      setTimeout(() => this.playBeep(783.99, 'triangle', 0.12, 0.1), 140);
    });
  },

  playCrisisBlues() {
    this.playSfxFile('assets/audio/sfx/apreensivo-blues-sfx.mp3', () => {
      this.playWarning();
    });
  },

  playWarning() {
    this.playSfxFile('assets/audio/sfx/events/warning-alert.mp3', () => {
      this.playBeep(330, 'sawtooth', 0.15, 0.08);
      setTimeout(() => this.playBeep(290, 'sawtooth', 0.2, 0.09), 140);
    });
  },

  playNewsFlash() {
    this.playSfxFile('assets/audio/sfx/events/news-flash.mp3', () => {
      this.playBeep(880, 'sine', 0.03, 0.04);
      setTimeout(() => this.playBeep(1100, 'sine', 0.04, 0.04), 40);
    });
  },

  // Sintetizador procedural puro (Web Audio API)
  playBeep(freq = 440, type = 'sine', duration = 0.08, gainVal = 0.05) {
    try {
      const vol = this.getEffectiveVolume();
      if (vol <= 0) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal * vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  suspend() {
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend();
    }
    if (this.currentBgmElement && !this.currentBgmElement.paused) {
      this.currentBgmElement.pause();
    }
    Object.values(this.activeAmbienceLoops).forEach(item => {
      if (item && item.audio && !item.audio.paused) {
        item.audio.pause();
      }
    });
  }
};

// Retrocompatibilidade para chamadas de escopo global
function getAudioContext() { return SoundEngine.getAudioContext(); }
function playBeep(freq, type, duration, gainVal) { SoundEngine.playBeep(freq, type, duration, gainVal); }
function playSuccessChime() { SoundEngine.playSuccessChime(); }
function playYearCelebration() { SoundEngine.playYearCelebration(); }
function playClick() { SoundEngine.playClick(); }
function playCashRegister() { SoundEngine.playCashRegister(); }

if (typeof window !== 'undefined') {
  SoundEngine.init();
}

export default SoundEngine;
export {
  SoundEngine,
  getAudioContext,
  playBeep,
  playSuccessChime,
  playYearCelebration,
  playClick,
  playCashRegister
};