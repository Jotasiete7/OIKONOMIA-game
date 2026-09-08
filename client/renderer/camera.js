/**
 * camera.js — Gerenciador de Câmera, Viewport e Foco Isométrico
 * OIKONOMIA v0.8.5 (Fase 6.3 — Motor de Renderização Canvas & Isometria)
 * 
 * Responsável por:
 * - Estado reativo da câmera isométrica (panX, panY, zoom)
 * - Centralização suave em coordenadas do grid (focusOnTile)
 * - Teleporte para cidades / capitais (jumpToCity, resetCamera)
 * - Controle de zoom suave ancorado em ponto de pivô (changeZoom)
 */

export const camera = {
  panX: 0,
  panY: 0,
  zoom: 0.85,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0
};

export function changeZoom(d, pivotX = null, pivotY = null, canvas = null) {
  const oldZoom = camera.zoom;
  const newZoom = Math.min(2.4, Math.max(0.35, oldZoom + d));
  if (newZoom === oldZoom) return;

  const cv = canvas || (typeof document !== 'undefined' ? document.getElementById('iso-canvas') : null);
  const r = cv ? cv.getBoundingClientRect() : { width: 800, height: 600 };
  const px = pivotX !== null ? pivotX : (r.width / 2);
  const py = pivotY !== null ? pivotY : (r.height / 2);

  const scaleRatio = newZoom / oldZoom;
  camera.panX = px - (px - camera.panX) * scaleRatio;
  camera.panY = py - (py - camera.panY) * scaleRatio;
  camera.zoom = newZoom;

  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  }
}

export function focusOnTile(gx, gy, canvas = null) {
  if (typeof gx !== 'number' || typeof gy !== 'number') return;
  const cv = canvas || (typeof document !== 'undefined' ? document.getElementById('iso-canvas') : null);
  if (!cv) return;
  const r = cv.getBoundingClientRect();
  const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
  const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;

  camera.panX = (r.width / 2) - (gx - gy) * (tW / 2) * camera.zoom;
  camera.panY = (r.height / 2) - (gx + gy) * (tH / 2) * camera.zoom;

  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  }
  if (typeof window !== 'undefined' && typeof window.renderMinimap === 'function') {
    window.renderMinimap();
  }
}

export function jumpToCity(cityId, canvas = null) {
  const cv = canvas || (typeof document !== 'undefined' ? document.getElementById('iso-canvas') : null);
  const r = cv ? cv.getBoundingClientRect() : { width: 800, height: 600 };
  const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
  const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;

  let targetX = 40, targetY = 42;
  if (cityId === 'porto_real') { targetX = 86; targetY = 38; }
  else if (cityId === 'montargis') { targetX = 42; targetY = 86; }
  else if (cityId === 'varzea') { targetX = 88; targetY = 84; }

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  camera.zoom = screenWidth < 1400 ? 0.8 : 1.0;
  camera.panX = (r.width / 2) - (targetX - targetY) * (tW / 2) * camera.zoom;
  camera.panY = (r.height / 2) - (targetX + targetY) * (tH / 2) * camera.zoom;

  const cityNameMap = {
    'nova_atenas': '🏛️ Atenas',
    'porto_real': '🚢 P. Real',
    'montargis': '🏭 Montargis',
    'varzea': '🌾 Várzea'
  };
  const cityLabel = typeof document !== 'undefined' ? document.getElementById('current-city-label') : null;
  if (cityLabel && cityNameMap[cityId]) {
    cityLabel.textContent = cityNameMap[cityId];
  }

  const cityBtnMap = {
    'nova_atenas': 'btn-jump-atenas',
    'porto_real': 'btn-jump-porto',
    'montargis': 'btn-jump-montargis',
    'varzea': 'btn-jump-varzea'
  };
  if (typeof document !== 'undefined') {
    for (const [cId, btnId] of Object.entries(cityBtnMap)) {
      const b = document.getElementById(btnId);
      if (!b) continue;
      if (cId === cityId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    }
  }

  if (typeof window !== 'undefined' && typeof window.closeCitiesDropdown === 'function') {
    window.closeCitiesDropdown();
  }

  if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
    window.scheduleRender();
  }
}

export function resetCamera(canvas = null) {
  jumpToCity('nova_atenas', canvas);
}

export const CameraController = {
  camera,
  changeZoom,
  focusOnTile,
  jumpToCity,
  resetCamera
};

if (typeof window !== 'undefined') {
  window.camera = camera;
  window.CameraController = CameraController;
  window.changeZoom = changeZoom;
  window.focusOnTile = focusOnTile;
  window.resetCamera = resetCamera;
}

export default CameraController;
