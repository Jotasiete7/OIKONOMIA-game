/**
 * ticker.js — Controlador Visual do Ticker de Notícias & Diário Corporativo
 * OIKONOMIA v0.8.5 (Fase 6.2 — TopBar & HUD)
 * 
 * Integra o TickerSystem (client/ticker_system.js) com a barra de notícias superior
 * da interface Obsidian/Terminal.
 */

import TickerSystem from '../ticker_system.js';

export function initTicker(trackId = 'ticker-track') {
  if (TickerSystem && typeof TickerSystem.init === 'function') {
    TickerSystem.init(trackId);
  }
}

export function pushTickerMessage(text, color = 'text-slate-300', meta = {}) {
  if (TickerSystem && typeof TickerSystem.pushFromLog === 'function') {
    TickerSystem.pushFromLog(text, color, meta);
  }
}

export function jumpToLatestTicker() {
  if (TickerSystem && typeof TickerSystem.jumpToLatest === 'function') {
    TickerSystem.jumpToLatest();
  }
}

export function toggleTicker(enabled) {
  if (TickerSystem && typeof TickerSystem.toggleEnabled === 'function') {
    TickerSystem.toggleEnabled(enabled);
  }
}

export function setTickerSpeed(speed) {
  if (TickerSystem && typeof TickerSystem.setSpeed === 'function') {
    TickerSystem.setSpeed(speed);
  }
}

export function isTickerEnabled() {
  if (TickerSystem && typeof TickerSystem.isEnabled === 'function') {
    return TickerSystem.isEnabled();
  }
  return true;
}

export function getTickerSpeed() {
  if (TickerSystem && typeof TickerSystem.getSpeed === 'function') {
    return TickerSystem.getSpeed();
  }
  return 55;
}

export const TickerUI = {
  initTicker,
  pushTickerMessage,
  jumpToLatestTicker,
  toggleTicker,
  setTickerSpeed,
  isEnabled: isTickerEnabled,
  getSpeed: getTickerSpeed
};

// Exposição global
if (typeof window !== 'undefined') {
  window.TickerUI = TickerUI;
}

export default TickerUI;
