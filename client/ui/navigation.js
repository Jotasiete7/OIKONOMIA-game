/**
 * navigation.js — Sistema de Navegação Geográfica & Lentes do Mapa
 * OIKONOMIA v0.8.5 (Fase 6.1 — UI Shell)
 * 
 * Responsável por:
 * - Controle dos dropdowns de navegação (Cidades, Lentes, Mais Opções)
 * - Salto de câmera entre cidades (jumpToCity)
 * - Centralização de foco em coordenadas do mapa (focusOnTile)
 * - Alternância de filtros e lentes temáticas de mapa de calor (setHeatmap)
 * - Fechamento automático de menus ao clicar fora (click-outside)
 */

import { camera } from '../renderer/camera.js';

export function toggleCitiesDropdown() {
  const menu = document.getElementById('cities-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

export function closeCitiesDropdown() {
  const menu = document.getElementById('cities-dropdown-menu');
  if (menu) menu.classList.add('hidden');
}

export function toggleLensesDropdown() {
  const menu = document.getElementById('lenses-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

export function closeLensesDropdown() {
  const menu = document.getElementById('lenses-dropdown-menu');
  if (menu) menu.classList.add('hidden');
}

export function toggleMoreOptionsMenu() {
  const menu = document.getElementById('hud-more-options-menu');
  if (menu) menu.classList.toggle('hidden');
}

export function closeMoreOptionsMenu() {
  const menu = document.getElementById('hud-more-options-menu');
  if (menu) menu.classList.add('hidden');
}

export function initDropdownClickOutside() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('click', (e) => {
    const cContainer = document.getElementById('cities-dropdown-container');
    const cMenu = document.getElementById('cities-dropdown-menu');
    if (cContainer && cMenu && !cContainer.contains(e.target)) {
      cMenu.classList.add('hidden');
    }

    const lContainer = document.getElementById('lenses-dropdown-container');
    const lMenu = document.getElementById('lenses-dropdown-menu');
    if (lContainer && lMenu && !lContainer.contains(e.target)) {
      lMenu.classList.add('hidden');
    }

    const mContainer = document.getElementById('hud-more-options-container');
    const mMenu = document.getElementById('hud-more-options-menu');
    if (mContainer && mMenu && !mContainer.contains(e.target)) {
      mMenu.classList.add('hidden');
    }
  });
}

export function jumpToCity(cityId) {
  const canvas = document.getElementById('iso-canvas');
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();

  let targetX = 40, targetY = 42;
  if (cityId === 'porto_real') { targetX = 86; targetY = 38; }
  else if (cityId === 'montargis') { targetX = 42; targetY = 86; }
  else if (cityId === 'varzea') { targetX = 88; targetY = 84; }

  const cam = (typeof window !== 'undefined' ? (window.CameraController?.camera || window.camera) : null) || camera;
  const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
  const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;

  if (cam) {
    cam.zoom = window.innerWidth < 1400 ? 0.8 : 1.0;
    cam.panX = (r.width / 2) - (targetX - targetY) * (tW / 2) * cam.zoom;
    cam.panY = (r.height / 2) - (targetX + targetY) * (tH / 2) * cam.zoom;
  }

  const cityNameMap = {
    'nova_atenas': '🏛️ Atenas',
    'porto_real': '🚢 P. Real',
    'montargis': '🏭 Montargis',
    'varzea': '🌾 Várzea'
  };
  const cityLabel = document.getElementById('current-city-label');
  if (cityLabel && cityNameMap[cityId]) {
    cityLabel.textContent = cityNameMap[cityId];
  }

  const cityBtnMap = {
    'nova_atenas': 'btn-jump-atenas',
    'porto_real': 'btn-jump-porto',
    'montargis': 'btn-jump-montargis',
    'varzea': 'btn-jump-varzea'
  };
  for (const [cId, btnId] of Object.entries(cityBtnMap)) {
    const b = document.getElementById(btnId);
    if (!b) continue;
    if (cId === cityId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  }
  closeCitiesDropdown();

  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  } else if (typeof scheduleRender === 'function') {
    scheduleRender();
  }
}

export function focusOnTile(gx, gy) {
  if (typeof gx !== 'number' || typeof gy !== 'number') return;
  const canvas = document.getElementById('iso-canvas');
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();

  const cam = (typeof window !== 'undefined' ? (window.CameraController?.camera || window.camera) : null) || camera;
  const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
  const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;

  if (cam) {
    cam.panX = (r.width / 2) - (gx - gy) * (tW / 2) * cam.zoom;
    cam.panY = (r.height / 2) - (gx + gy) * (tH / 2) * cam.zoom;
  }

  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  } else if (typeof scheduleRender === 'function') {
    scheduleRender();
  }

  if (typeof window !== 'undefined' && typeof window.renderMinimap === 'function') {
    window.renderMinimap();
  } else if (typeof renderMinimap === 'function') {
    renderMinimap();
  }
}

export function setHeatmap(mode) {
  if (typeof window !== 'undefined') {
    window.currentHeatmap = mode;
  }

  const lensMeta = {
    terrain:     { name: 'Terreno', icon: '⊙' },
    opportunity: { name: 'Oportunidade', icon: '🎯' },
    traffic:     { name: 'Tráfego', icon: '⬥' },
    pop:         { name: 'População', icon: '⬥' },
    comp:        { name: 'Varejo', icon: '⬥' },
    ports:       { name: 'Portos', icon: '⬥' },
    ind:         { name: 'Indústria', icon: '⬥' },
    media:       { name: 'Mídia', icon: '⬥' }
  };

  const meta = lensMeta[mode] || lensMeta.terrain;
  const iconEl = document.getElementById('current-lens-icon');
  const labelEl = document.getElementById('current-lens-label');
  if (iconEl) iconEl.textContent = meta.icon;
  if (labelEl) labelEl.textContent = meta.name;

  const btns = { 
    terrain: 'hm-terrain', 
    opportunity: 'hm-opportunity', 
    traffic: 'hm-traffic', 
    pop: 'hm-pop', 
    comp: 'hm-comp', 
    ports: 'hm-ports', 
    ind: 'hm-ind', 
    media: 'hm-media' 
  };
  for (const [m, id] of Object.entries(btns)) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.className = m === mode
      ? 'oiko-dropdown-item active'
      : 'oiko-dropdown-item';
  }
  closeLensesDropdown();

  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  } else if (typeof scheduleRender === 'function') {
    scheduleRender();
  }
}

export const NavigationSystem = {
  toggleCitiesDropdown,
  closeCitiesDropdown,
  toggleLensesDropdown,
  closeLensesDropdown,
  toggleMoreOptionsMenu,
  closeMoreOptionsMenu,
  initDropdownClickOutside,
  jumpToCity,
  focusOnTile,
  setHeatmap
};

// Exposição global para retrocompatibilidade
if (typeof window !== 'undefined') {
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
}

// Inicialização automática do click-outside
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdownClickOutside);
  } else {
    initDropdownClickOutside();
  }
}

export default NavigationSystem;
