/**
 * audio.js — Sintetizador Web Audio API de OIKONOMIA
 * Efeitos sonoros procedurais sem dependência de assets de áudio externos.
 */

const SoundEngine = {
  audioCtx: null,

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  getEffectiveVolume() {
    if (typeof gameSettings !== 'undefined' && gameSettings.sfxVolume !== undefined) {
      const vol = parseFloat(gameSettings.sfxVolume);
      return (!isNaN(vol) && vol >= 0) ? Math.min(1, vol) : 0.7;
    }
    return 0.7;
  },

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

  playSuccessChime() {
    this.playBeep(523.25, 'triangle', 0.08, 0.08);
    setTimeout(() => this.playBeep(659.25, 'triangle', 0.08, 0.08), 70);
    setTimeout(() => this.playBeep(783.99, 'triangle', 0.12, 0.1), 140);
  },

  playClick() {
    this.playBeep(440, 'sine', 0.03, 0.04);
  },

  playCashRegister() {
    this.playBeep(880, 'triangle', 0.06, 0.07);
    setTimeout(() => this.playBeep(1174.66, 'triangle', 0.10, 0.09), 50);
  },

  playYearCelebration() {
    this.playBeep(440, 'triangle', 0.1, 0.08);
    setTimeout(() => this.playBeep(554.37, 'triangle', 0.1, 0.09), 80);
    setTimeout(() => this.playBeep(659.25, 'triangle', 0.12, 0.1), 160);
    setTimeout(() => this.playBeep(880.00, 'triangle', 0.25, 0.12), 240);
  },

  suspend() {
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend();
    }
  }
};

// Retrocompatibilidade para chamadas globais
function getAudioContext() { return SoundEngine.getAudioContext(); }
function playBeep(freq, type, duration, gainVal) { SoundEngine.playBeep(freq, type, duration, gainVal); }
function playSuccessChime() { SoundEngine.playSuccessChime(); }
function playYearCelebration() { SoundEngine.playYearCelebration(); }

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
}