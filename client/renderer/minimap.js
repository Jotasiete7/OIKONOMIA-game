/**
 * minimap.js — Radar Cartográfico & Minimapa Interativo
 * OIKONOMIA v0.8.5 (Fase 6.3 — Motor de Renderização Canvas & Isometria)
 * 
 * Responsável por:
 * - Desenho vetorial de 128x128 tiles no canvas do minimapa
 * - Indicadores visuais de relevo, corpos d'água, infraestrutura e prédios
 * - Marcadores geográficos das 4 cidades e seus status de bloqueio
 * - Retângulo indicador da viewport atual da câmera
 * - Teletransporte instantâneo por clique no radar
 */

import { screenToGrid } from './iso_math.js';

export function renderMinimap() {
  const mmCanvas = document.getElementById('minimap-canvas');
  if (!mmCanvas) return;
  const mmCtx = mmCanvas.getContext('2d');
  const mmW = mmCanvas.width;
  const mmH = mmCanvas.height;

  mmCtx.clearRect(0, 0, mmW, mmH);

  const gridSize = (typeof window !== 'undefined' && window.GRID_SIZE) ? window.GRID_SIZE : 128;
  const worldGrid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : null;
  const unlockedCities = (typeof window !== 'undefined' && window.unlockedCities) ? window.unlockedCities : {};
  const canvas = document.getElementById('iso-canvas');

  if (!worldGrid || worldGrid.length === 0) return;

  const step = gridSize / mmW;
  for (let mx = 0; mx < mmW; mx++) {
    for (let my = 0; my < mmH; my++) {
      const gx = Math.min(gridSize - 1, Math.floor(mx * step));
      const gy = Math.min(gridSize - 1, Math.floor(my * step));
      const tile = worldGrid[gx] && worldGrid[gx][gy];
      if (!tile) continue;

      let c = '#0f291e';
      if (tile.isWater) {
        c = tile.gidWater === 1 ? '#031e33' : '#073252';
      } else if (tile.gidTerrain === 3) {
        c = '#8c7847';
      } else if (tile.gidTerrain === 5) {
        c = '#194226';
      } else if (tile.gidTerrain === 6) {
        c = '#3b3a2a';
      } else if (tile.gidTerrain === 7) {
        c = '#3a3a42';
      }

      if (tile.isRoad) c = '#94a3b8';
      if (tile.isPort) c = '#f59e0b';
      if (tile.store) c = '#10b981';
      if (tile.factory) c = '#ea580c';
      if (tile.farm) c = '#eab308';
      if (tile.mine) c = '#0284c7';
      if (tile.rdCenter) c = '#a855f7';
      if (tile.warehouse) c = '#38bdf8';
      if (tile.city && tile.city.isLocked) c = '#0f172a';
      else if (tile.districtId === 'downtown') c = '#ef4444';

      mmCtx.fillStyle = c;
      mmCtx.fillRect(mx, my, 1, 1);
    }
  }

  // Marcadores das 4 Cidades no Minimap
  mmCtx.fillStyle = '#ffffff';
  mmCtx.font = 'bold 7px monospace';
  mmCtx.fillText('🏛️ Atenas', (38 / step) - 10, (38 / step) - 2);
  mmCtx.fillText('🚢 P. Real', (94 / step) - 12, (38 / step) - 2);
  mmCtx.fillText(unlockedCities.montargis ? '🏭 Montargis' : '🔒 Montargis', (38 / step) - 14, (88 / step) - 2);
  mmCtx.fillText(unlockedCities.varzea ? '🌾 Várzea' : '🔒 Várzea', (88 / step) - 10, (88 / step) - 2);

  // Caixa da Câmera Atual no Minimap
  if (canvas && canvas.width > 0 && canvas.height > 0) {
    const camCenter = screenToGrid(canvas.width / 2, canvas.height / 2);
    const camMmX = Math.max(0, Math.min(mmW - 14, (camCenter.gx / step) - 7));
    const camMmY = Math.max(0, Math.min(mmH - 14, (camCenter.gy / step) - 7));
    mmCtx.strokeStyle = '#38bdf8';
    mmCtx.lineWidth = 1.5;
    mmCtx.strokeRect(camMmX, camMmY, 14, 14);
  }
}

export function initMinimapEvents() {
  const mmCanvas = document.getElementById('minimap-canvas');
  if (!mmCanvas) return;

  mmCanvas.addEventListener('click', (e) => {
    const canvas = document.getElementById('iso-canvas');
    if (!canvas) return;

    const camera = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
    if (!camera) return;

    const rect = mmCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const gridSize = (typeof window !== 'undefined' && window.GRID_SIZE) ? window.GRID_SIZE : 128;
    const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
    const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;

    const step = gridSize / mmCanvas.width;
    const targetGx = Math.max(0, Math.min(gridSize - 1, Math.floor(clickX * step)));
    const targetGy = Math.max(0, Math.min(gridSize - 1, Math.floor(clickY * step)));

    const targetSx = (targetGx - targetGy) * (tW / 2) * camera.zoom;
    const targetSy = (targetGx + targetGy) * (tH / 2) * camera.zoom;
    camera.panX = (canvas.width / 2) - targetSx;
    camera.panY = (canvas.height / 2) - targetSy;

    if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
      window.scheduleRender();
    }
  });
}

export const MinimapSystem = {
  renderMinimap,
  initMinimapEvents
};

if (typeof window !== 'undefined') {
  window.MinimapSystem = MinimapSystem;
  window.renderMinimap = renderMinimap;
}

export default MinimapSystem;
