/**
 * minimap.js — Radar Cartográfico & Minimapa Tático Interativo
 * OIKONOMIA v0.8.5 (Fase 6.3 — Motor de Renderização Canvas & Isometria)
 * 
 * Responsável por:
 * - Cache offscreen em buffer ImageData do terreno e prédios (~0.02ms/frame vs 16.384 fillRects)
 * - Filtragem bilinear e antialiasing na exibição ampliada (elimina efeito Moiré)
 * - Paleta executiva Obsidian & Ouro refinada
 * - Frustum dinâmico da câmera baseado em zoom e viewport real (projeção isométrica dos 4 cantos)
 * - Rótulos vetoriais e pins das 4 cidades com status de bloqueio
 * - Teletransporte instantâneo e preciso por clique no radar (com escala DPI-aware)
 */

import { screenToGrid } from './iso_math.js';
import { camera as globalCamera } from './camera.js';

// Cache Offscreen do Terreno
let _terrainCanvas = null;
let _terrainCtx = null;
let _terrainDirty = true;
let _lastUnlockedHash = '';
let _lastOverlayState = '';

// Paleta Obsidian & Ouro (RGB 0-255)
const PALETTE_RGB = {
  // Águas (Ardósia oceânica profunda)
  waterDeep: [6, 19, 37],        // #061325
  waterShallow: [10, 34, 56],    // #0a2238

  // Terrenos e Relevo
  terrainPlain: [13, 31, 23],    // #0d1f17 (Base florestal/planície escura)
  terrainSand: [66, 53, 28],     // #42351c (gidTerrain === 3: areia árida)
  terrainFertile: [22, 56, 33],  // #163821 (gidTerrain === 5: solo fértil verde-oliva)
  terrainHills: [41, 40, 30],    // #29281e (gidTerrain === 6: colinas acinzentadas)
  terrainMountain: [36, 38, 46], // #24262e (gidTerrain === 7: rocha montanhosa)

  // Infraestrutura & Recursos
  road: [82, 96, 113],           // #526071 (Malha viária em ardósia metálica)
  port: [201, 168, 106],         // #c9a86a (Doca / Porto em Ouro Oikonomia)

  // Instalações Industriais & Comerciais (Tons Executivos Dessaturados)
  store: [16, 185, 129],         // #10b981 (Varejo esmeralda)
  factory: [194, 65, 12],        // #c2410c (Manufatura cobre/ferrugem)
  farm: [217, 119, 6],           // #d97706 (Agropecuária âmbar dourado)
  mine: [2, 132, 199],           // #0284c7 (Mineração safira profunda)
  rdCenter: [124, 58, 237],      // #7c3aed (P&D violeta tecnológico)
  warehouse: [56, 189, 248],     // #38bdf8 (Hub logístico / CD azul celeste)

  // Zonas Urbanas
  downtown: [153, 27, 27],       // #991b1b (Distrito Central / CBD rubi corporativo)
  lockedCity: [8, 13, 20]        // #080d14 (Neblina de guerra / Bloqueado)
};

export function invalidateMinimap() {
  _terrainDirty = true;
  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  }
}

export function buildMinimapTerrainCache(worldGrid, gridSize) {
  if (!_terrainCanvas) {
    _terrainCanvas = document.createElement('canvas');
    _terrainCanvas.width = gridSize;
    _terrainCanvas.height = gridSize;
    _terrainCtx = _terrainCanvas.getContext('2d');
  }

  const imgData = _terrainCtx.createImageData(gridSize, gridSize);
  const data = imgData.data;

  for (let gx = 0; gx < gridSize; gx++) {
    const col = worldGrid[gx];
    if (!col) continue;
    for (let gy = 0; gy < gridSize; gy++) {
      const tile = col[gy];
      if (!tile) continue;

      let rgb = PALETTE_RGB.terrainPlain;

      if (tile.isWater) {
        rgb = (tile.gidWater === 1) ? PALETTE_RGB.waterDeep : PALETTE_RGB.waterShallow;
      } else if (tile.gidTerrain === 3) {
        rgb = PALETTE_RGB.terrainSand;
      } else if (tile.gidTerrain === 5) {
        rgb = PALETTE_RGB.terrainFertile;
      } else if (tile.gidTerrain === 6) {
        rgb = PALETTE_RGB.terrainHills;
      } else if (tile.gidTerrain === 7) {
        rgb = PALETTE_RGB.terrainMountain;
      }

      if (tile.isRoad) rgb = PALETTE_RGB.road;
      if (tile.isPort) rgb = PALETTE_RGB.port;
      if (tile.store) rgb = PALETTE_RGB.store;
      if (tile.factory) rgb = PALETTE_RGB.factory;
      if (tile.farm) rgb = PALETTE_RGB.farm;
      if (tile.mine) rgb = PALETTE_RGB.mine;
      if (tile.rdCenter) rgb = PALETTE_RGB.rdCenter;
      if (tile.warehouse) rgb = PALETTE_RGB.warehouse;

      if (tile.city && tile.city.isLocked) {
        rgb = PALETTE_RGB.lockedCity;
      } else if (tile.districtId === 'downtown') {
        rgb = PALETTE_RGB.downtown;
      }

      const idx = (gy * gridSize + gx) * 4;
      data[idx]     = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }

  _terrainCtx.putImageData(imgData, 0, 0);
  _terrainDirty = false;
}

export function updateCityOverlayLabels(unlockedCities) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('minimap-city-labels');
  if (!container) return;

  const stateKey = `${!!unlockedCities.montargis}_${!!unlockedCities.varzea}`;
  if (_lastOverlayState === stateKey && container.children.length === 4) return;
  _lastOverlayState = stateKey;

  const cities = [
    { id: 'nova_atenas', name: 'Atenas', icon: '🏛️', left: '29.7%', top: '29.7%', unlocked: true },
    { id: 'porto_real', name: 'P. Real', icon: '🚢', left: '68.8%', top: '29.7%', unlocked: true },
    { id: 'montargis', name: 'Montargis', icon: unlockedCities.montargis ? '🏭' : '🔒', left: '29.7%', top: '68.8%', unlocked: !!unlockedCities.montargis },
    { id: 'varzea', name: 'Várzea', icon: unlockedCities.varzea ? '🌾' : '🔒', left: '68.8%', top: '68.8%', unlocked: !!unlockedCities.varzea }
  ];

  container.innerHTML = cities.map(c => `
    <button type="button" onclick="if(typeof window.jumpToCity==='function') window.jumpToCity('${c.id}')"
      class="absolute -translate-x-1/2 -translate-y-full px-1 py-0.5 rounded bg-slate-950/90 border ${c.unlocked ? 'border-[#c9a86a]/60 text-slate-100 hover:border-[#c9a86a] hover:text-[#c9a86a]' : 'border-slate-800 text-slate-500'} text-[8px] font-mono shadow-lg transition-all cursor-pointer pointer-events-auto flex items-center gap-0.5 leading-tight select-none"
      style="left: ${c.left}; top: ${c.top};"
      title="${c.unlocked ? 'Clique para focar em ' + c.name : c.name + ' (Bloqueada)'}">
      <span>${c.icon}</span><span>${c.name}</span>
    </button>
  `).join('');
}

export function renderMinimap() {
  const mmCanvas = document.getElementById('minimap-canvas');
  if (!mmCanvas) return;
  const mmCtx = mmCanvas.getContext('2d');
  const mmW = mmCanvas.width;
  const mmH = mmCanvas.height;

  const gridSize = (typeof window !== 'undefined' && window.GRID_SIZE) ? window.GRID_SIZE : 128;
  const worldGrid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : null;
  const unlockedCities = (typeof window !== 'undefined' && window.unlockedCities) ? window.unlockedCities : {};
  const canvas = document.getElementById('iso-canvas');

  if (!worldGrid || worldGrid.length === 0) return;

  // 1. Gera ou atualiza o cache offscreen se necessário (0.02ms após cacheado)
  const currentUnlockHash = `${!!unlockedCities.montargis}_${!!unlockedCities.varzea}`;
  if (_terrainDirty || !_terrainCanvas || _lastUnlockedHash !== currentUnlockHash) {
    _lastUnlockedHash = currentUnlockHash;
    buildMinimapTerrainCache(worldGrid, gridSize);
  }

  // 2. Renderiza o mapa com filtragem bilinear (elimina aliasing e moiré)
  mmCtx.clearRect(0, 0, mmW, mmH);
  mmCtx.imageSmoothingEnabled = true;
  mmCtx.imageSmoothingQuality = 'high';
  mmCtx.drawImage(_terrainCanvas, 0, 0, mmW, mmH);

  // 3. Marcadores de Cidades no Canvas (Pins luminosos)
  const cityPins = [
    { name: 'Atenas', gx: 38, gy: 38, unlocked: true },
    { name: 'P. Real', gx: 88, gy: 38, unlocked: true },
    { name: 'Montargis', gx: 38, gy: 88, unlocked: !!unlockedCities.montargis },
    { name: 'Várzea', gx: 88, gy: 88, unlocked: !!unlockedCities.varzea }
  ];

  for (const cp of cityPins) {
    const px = (cp.gx / gridSize) * mmW;
    const py = (cp.gy / gridSize) * mmH;
    mmCtx.beginPath();
    mmCtx.arc(px, py, cp.unlocked ? 2.5 : 1.5, 0, Math.PI * 2);
    mmCtx.fillStyle = cp.unlocked ? '#c9a86a' : '#64748b';
    mmCtx.fill();
    if (cp.unlocked) {
      mmCtx.beginPath();
      mmCtx.arc(px, py, 4.5, 0, Math.PI * 2);
      mmCtx.strokeStyle = 'rgba(201, 168, 106, 0.35)';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
    }
  }

  // 4. Frustum Real da Câmera (Projeção Isométrica dos 4 cantos da tela)
  if (canvas) {
    const r = canvas.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      const cam = (typeof window !== 'undefined' ? (window.CameraController?.camera || window.camera) : null) || globalCamera;
      if (cam) {
        const p1 = screenToGrid(0, 0, cam);
        const p2 = screenToGrid(r.width, 0, cam);
        const p3 = screenToGrid(r.width, r.height, cam);
        const p4 = screenToGrid(0, r.height, cam);

        const toMm = (pt) => ({
          x: (pt.gx / gridSize) * mmW,
          y: (pt.gy / gridSize) * mmH
        });

        const m1 = toMm(p1);
        const m2 = toMm(p2);
        const m3 = toMm(p3);
        const m4 = toMm(p4);

        mmCtx.save();
        mmCtx.beginPath();
        mmCtx.rect(0, 0, mmW, mmH);
        mmCtx.clip();

        mmCtx.beginPath();
        mmCtx.moveTo(m1.x, m1.y);
        mmCtx.lineTo(m2.x, m2.y);
        mmCtx.lineTo(m3.x, m3.y);
        mmCtx.lineTo(m4.x, m4.y);
        mmCtx.closePath();

        mmCtx.strokeStyle = '#38bdf8';
        mmCtx.lineWidth = 1.5;
        mmCtx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        mmCtx.fill();
        mmCtx.stroke();

        // Ponto central de foco da câmera
        const camCenter = screenToGrid(r.width / 2, r.height / 2, cam);
        const mc = toMm(camCenter);
        if (mc.x >= 0 && mc.x <= mmW && mc.y >= 0 && mc.y <= mmH) {
          mmCtx.fillStyle = '#f8fafc';
          mmCtx.fillRect(mc.x - 1, mc.y - 1, 2, 2);
        }

        mmCtx.restore();
      }
    }
  }

  // 5. Atualiza Badges HTML com tipografia nativa e atalhos de clique
  updateCityOverlayLabels(unlockedCities);
}

export function initMinimapEvents() {
  const mmCanvas = document.getElementById('minimap-canvas');
  if (!mmCanvas) return;

  mmCanvas.addEventListener('click', (e) => {
    const canvas = document.getElementById('iso-canvas');
    if (!canvas) return;

    const cam = (typeof window !== 'undefined' ? (window.CameraController?.camera || window.camera) : null) || globalCamera;
    if (!cam) return;

    const r = canvas.getBoundingClientRect();
    const rect = mmCanvas.getBoundingClientRect();
    const scaleX = mmCanvas.width / (rect.width || 1);
    const scaleY = mmCanvas.height / (rect.height || 1);

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const gridSize = (typeof window !== 'undefined' && window.GRID_SIZE) ? window.GRID_SIZE : 128;
    const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
    const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;

    const targetGx = Math.max(0, Math.min(gridSize - 1, Math.floor(clickX * (gridSize / mmCanvas.width))));
    const targetGy = Math.max(0, Math.min(gridSize - 1, Math.floor(clickY * (gridSize / mmCanvas.height))));

    const targetSx = (targetGx - targetGy) * (tW / 2) * cam.zoom;
    const targetSy = (targetGx + targetGy) * (tH / 2) * cam.zoom;
    cam.panX = (r.width / 2) - targetSx;
    cam.panY = (r.height / 2) - targetSy;

    if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
      window.scheduleRender();
    }
  });
}

export const MinimapSystem = {
  renderMinimap,
  initMinimapEvents,
  invalidateMinimap,
  buildMinimapTerrainCache,
  updateCityOverlayLabels
};

if (typeof window !== 'undefined') {
  window.MinimapSystem = MinimapSystem;
  window.renderMinimap = renderMinimap;
  window.invalidateMinimap = invalidateMinimap;
}

export default MinimapSystem;
