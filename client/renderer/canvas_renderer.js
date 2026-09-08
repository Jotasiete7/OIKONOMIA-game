/**
 * canvas_renderer.js — Motor Principal de Renderização Canvas 2.5D
 * OIKONOMIA v0.8.5 (Fase 6.3 — Motor de Renderização Canvas & Isometria)
 * 
 * Responsável por:
 * - Ciclo de renderização a 60 FPS com Dirty Flag (_needsRender / scheduleRender)
 * - Medição e exibição de FPS em tempo real no rodapé de telemetria
 * - Redimensionamento adaptativo com suporte a telas Retina / HiDPI (devicePixelRatio)
 * - Traçado isométrico por profundidade (depth-sorting 0..2*N)
 * - Culling de tiles fora do campo de visão (frustum culling)
 * - Renderização de terreno, zonas urbanas, rodovias, fronteiras e overlays de calor
 * - Desenho de edifícios industriais e badges de logomarcas procedurais
 * - Destaque de cursor hover e lote selecionado com iluminação dourada (#d4b483)
 */

import { gridToScreen, drawDiamond, drawBuilding } from './iso_math.js';
import { camera } from './camera.js';
import { renderMinimap } from './minimap.js';
import SpriteManager from '../sprite_manager.js';
import { LOGO_ICONS, generateCompanyLogo, drawCanvasCompanyLogoBadge } from '../logo_generator.js';
import GameState from '../game_state.js';

let _needsRender = true;
let _lastFpsTime = performance.now();
let _framesCount = 0;
let _currentFps = 60;
let _rafId = null;

export function scheduleRender() {
  _needsRender = true;
  if (typeof window !== 'undefined') window._needsRender = true;
}

export function getCurrentFps() {
  return _currentFps;
}

export function resizeCanvas() {
  const canvas = document.getElementById('iso-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  ctx.scale(dpr, dpr);
  scheduleRender();
}

export function renderMap() {
  const canvas = document.getElementById('iso-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const r = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  ctx.fillStyle = '#010d18';
  ctx.fillRect(0, 0, r.width, r.height);

  const gridSize = (typeof window !== 'undefined' && window.GRID_SIZE) ? window.GRID_SIZE : 128;
  const worldGrid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : null;
  if (!worldGrid || worldGrid.length === 0) return;

  const tW = (typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64;
  const tH = (typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32;
  const w = tW * camera.zoom;
  const h = tH * camera.zoom;

  if (typeof window !== 'undefined' && typeof window.checkCityUnlocks === 'function') {
    window.checkCityUnlocks();
  }

  const currentHeatmap = (typeof window !== 'undefined' && window.currentHeatmap) ? window.currentHeatmap : 'terrain';
  const hoveredTileX = (typeof window !== 'undefined' && window.hoveredTileX !== undefined) ? window.hoveredTileX : -1;
  const hoveredTileY = (typeof window !== 'undefined' && window.hoveredTileY !== undefined) ? window.hoveredTileY : -1;
  const selectedTileX = (typeof window !== 'undefined' && window.selectedTileX !== undefined) ? window.selectedTileX : -1;
  const selectedTileY = (typeof window !== 'undefined' && window.selectedTileY !== undefined) ? window.selectedTileY : -1;
  const playerProfile = GameState.playerProfile || (typeof window !== 'undefined' ? window.playerProfile : null) || {};

  const sm = (typeof SpriteManager !== 'undefined' && SpriteManager) ? SpriteManager : (typeof window !== 'undefined' ? window.SpriteManager : null);
  const icons = (typeof LOGO_ICONS !== 'undefined' && LOGO_ICONS) ? LOGO_ICONS : (typeof window !== 'undefined' && window.LOGO_ICONS ? window.LOGO_ICONS : {});
  const genLogo = (typeof generateCompanyLogo === 'function') ? generateCompanyLogo : (typeof window !== 'undefined' && window.generateCompanyLogo ? window.generateCompanyLogo : (() => null));
  const drawBadge = (typeof drawCanvasCompanyLogoBadge === 'function') ? drawCanvasCompanyLogoBadge : (typeof window !== 'undefined' && window.drawCanvasCompanyLogoBadge ? window.drawCanvasCompanyLogoBadge : (() => {}));

  for (let depth = 0; depth <= 2 * gridSize; depth++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const gy = depth - gx;
      if (gy < 0 || gy >= gridSize) continue;
      const tile = worldGrid[gx] && worldGrid[gx][gy];
      if (!tile) continue;

      const { sx, sy } = gridToScreen(gx, gy, camera, tW, tH);

      // Culling inteligente de tiles fora da tela para garantir 60 FPS
      if (sx < -140 || sx > r.width + 140 || sy < -140 || sy > r.height + 220) continue;

      // 1. CAMADA 01 & 02: TERRENO BASE & RELEVO
      let fill = '#0f291e'; // Grama plana
      const d = tile.districtId;
      const tTerrain = tile.gidTerrain;

      if (tile.isWater) {
        fill = tile.gidWater === 1 ? '#031e33' : '#073252';
      } else if (tile.hasSilicaDeposit) {
        fill = '#827d6d'; // Arenito de quartzo bege-mineral suave
      } else if (tile.hasIronDeposit) {
        fill = '#413732'; // Rocha ferruginosa escura
      } else if (tile.hasBauxiteDeposit) {
        fill = '#8c4b32'; // Argila laterítica avermelhada (Bauxita)
      } else if (tile.hasGoldDeposit) {
        fill = '#37373e'; // Rocha escura montanhosa com veios auríferos
      } else if (tile.hasChemicalDeposit) {
        fill = '#586964'; // Bacia evaporítica de sais minerais
      } else if (tile.hasOilDeposit) {
        fill = '#2d3034'; // Solo sedimentar petrolífero
      } else if (tTerrain === 3) {
        fill = '#8c7847'; // Praia
      } else if (tTerrain === 5) {
        fill = '#194226'; // Terra fértil agrícola
      } else if (tTerrain === 6) {
        fill = '#3b3a2a'; // Colina
      } else if (tTerrain === 7) {
        fill = '#3a3a42'; // Montanha
      }

      // 2. CAMADA 05: ZONEAMENTO DE SOLO (CENTRO / RESIDENCIAL / PORTO)
      if (!tile.isWater) {
        if (d === 'downtown') {
          fill = '#0f2744';
        } else if (d === 'northside') {
          fill = '#1a2238';
        } else if (tile.isPort) {
          fill = '#854d0e';
        }
      }

      // 3. CAMADA 04: INFRAESTRUTURA & VIAS
      if (tile.isRoad && !tile.isWater) {
        fill = '#334155';
      }

      // Renderização do Solo Base (Sprite ou Fallback Diamond)
      if (tile.city && tile.city.isLocked) {
        fill = '#0f172a';
        drawDiamond(ctx, sx, sy, w, h, fill);
      } else {
        let drawn = false;
        if (sm && typeof sm.draw === 'function') {
          if (tile.isRoad) {
            const roadKey = sm.getRoadSprite(gx, gy, worldGrid, tile.isWater);
            drawn = sm.draw(ctx, roadKey, sx, sy, w, h, () => drawDiamond(ctx, sx, sy, w, h, fill));
          } else {
            const terrainKey = sm.getTerrainSprite(tile);
            drawn = sm.draw(ctx, terrainKey, sx, sy, w, h, () => drawDiamond(ctx, sx, sy, w, h, fill));
          }
        }
        if (!drawn) {
          drawDiamond(ctx, sx, sy, w, h, fill);
        }
      }

      // Demarcação Nítida de Limites Municipais (Fronteiras Pontilhadas)
      const nextCityX = worldGrid[gx + 1]?.[gy]?.city?.cityId;
      const nextCityY = worldGrid[gx]?.[gy + 1]?.city?.cityId;
      const thisCity = tile.city?.cityId;

      if (thisCity && nextCityX && nextCityX !== thisCity) {
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = Math.max(1, 1.3 * camera.zoom);
        ctx.beginPath();
        ctx.moveTo(sx + w / 2, sy + h / 2);
        ctx.lineTo(sx, sy + h);
        ctx.stroke();
        ctx.restore();
      }
      if (thisCity && nextCityY && nextCityY !== thisCity) {
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = Math.max(1, 1.3 * camera.zoom);
        ctx.beginPath();
        ctx.moveTo(sx - w / 2, sy + h / 2);
        ctx.lineTo(sx, sy + h);
        ctx.stroke();
        ctx.restore();
      }

      // Lentes de Heatmap (sobreposição translúcida)
      if (tile.city && !tile.city.isLocked && currentHeatmap !== 'terrain') {
        let heatFill = null;
        if (currentHeatmap === 'opportunity') {
          if (!tile.isWater && !tile.isRoad) {
            const popScore = Math.min(1, (tile.district?.population || 0) / 16000);
            const trafficScore = (tile.district?.trafficIndex || 30) / 100;
            let compPenalty = 0;
            if (tile.competitor) compPenalty += 0.45;
            if (tile.store) compPenalty += 0.25;

            const oppIndex = Math.max(0, Math.min(1, (popScore * 0.5 + trafficScore * 0.5) - compPenalty));
            if (oppIndex > 0.60) heatFill = 'rgba(16, 185, 129, 0.72)'; // Alto Potencial / Verde Esmeralda
            else if (oppIndex > 0.35) heatFill = 'rgba(245, 158, 11, 0.65)'; // Médio Potencial / Âmbar
            else if (oppIndex > 0.15) heatFill = 'rgba(59, 130, 246, 0.45)'; // Baixo Potencial / Azul
            else heatFill = 'rgba(30, 41, 59, 0.35)'; // Saturado / Escuro
          }
        } else if (currentHeatmap === 'traffic' && tile.district?.trafficIndex > 0) {
          const t = tile.district.trafficIndex / 100;
          heatFill = `rgba(239, 68, 68, ${Math.min(0.85, 0.2 + t * 0.65)})`;
        } else if (currentHeatmap === 'pop' && tile.district?.population > 0) {
          const t = Math.min(1, tile.district.population / 18000);
          heatFill = `rgba(59, 130, 246, ${Math.min(0.85, 0.2 + t * 0.65)})`;
        } else if (currentHeatmap === 'comp') {
          if (tile.store) heatFill = 'rgba(16, 185, 129, 0.65)';
          else if (tile.competitor) heatFill = 'rgba(244, 63, 94, 0.65)';
        } else if (currentHeatmap === 'ports') {
          if (tile.isPort) heatFill = 'rgba(245, 158, 11, 0.65)';
        } else if (currentHeatmap === 'ind') {
          if (tile.mine || tile.hasIronDeposit || tile.hasOilDeposit || tile.hasSilicaDeposit || tile.hasBauxiteDeposit || tile.hasGoldDeposit || tile.hasChemicalDeposit) {
            heatFill = 'rgba(2, 132, 199, 0.65)';
          } else if (tile.farm || tile.isFertile) {
            heatFill = 'rgba(234, 179, 8, 0.65)';
          } else if (tile.factory) {
            heatFill = 'rgba(234, 88, 12, 0.65)';
          }
        } else if (currentHeatmap === 'media') {
          if (tile.isMedia) heatFill = 'rgba(192, 132, 252, 0.65)';
        }
        if (heatFill) {
          drawDiamond(ctx, sx, sy, w, h, heatFill, null);
        }
      }

      // Renderização de Edifícios & Estruturas (Sprites 2.5D ou Fallback 3D)
      let heightVal = tile.buildingHeight || 0;
      if (tile.factory) heightVal = 22;
      else if (tile.mine) heightVal = 20;
      else if (tile.farm) heightVal = 18;
      else if (tile.store) heightVal = 16;
      else if (tile.rdCenter) heightVal = 24;
      else if (tile.warehouse) heightVal = 20;
      else if (tile.competitor) heightVal = 18;
      else if (tile.isPort) heightVal = 16;
      else if (tile.isMedia) heightVal = 20;

      const hPx = heightVal * camera.zoom;
      if (tile.city && !tile.city.isLocked) {
        let topC = '#38bdf8', leftC = '#0284c7', rightC = '#0369a1';
        let spriteKey = null;

        if (tile.store) {
          topC = '#10b981'; leftC = '#059669'; rightC = '#047857';
          spriteKey = sm ? sm.getStoreSprite(tile.store.storeTypeId) : null;
        } else if (tile.mine) {
          topC = '#38bdf8'; leftC = '#0284c7'; rightC = '#0369a1';
          spriteKey = sm ? sm.getMineSprite(tile.mine.mineTypeId) : null;
        } else if (tile.farm) {
          topC = '#eab308'; leftC = '#ca8a04'; rightC = '#a16207';
          spriteKey = sm ? sm.getFarmSprite(tile.farm.farmTypeId) : null;
        } else if (tile.factory) {
          topC = '#ea580c'; leftC = '#c2410c'; rightC = '#9a3412';
          spriteKey = sm ? sm.getFactorySprite(tile.factory.lines || tile.factory.activeLines, tile.factory.customSkin) : 'industrial/factory_default';
        } else if (tile.rdCenter) {
          topC = '#c084fc'; leftC = '#9333ea'; rightC = '#7e22ce';
          spriteKey = sm ? sm.getRDSprite() : 'pesquisa/rd_center';
        } else if (tile.warehouse) {
          topC = '#38bdf8'; leftC = '#0284c7'; rightC = '#0369a1';
          spriteKey = sm ? sm.getWarehouseSprite(tile.warehouse.level) : 'logistica/warehouse_lvl1';
        } else if (tile.competitor) {
          topC = '#f43f5e'; leftC = '#e11d48'; rightC = '#be123c';
          spriteKey = 'lojas/competitor';
        } else if (tile.isPort) {
          topC = '#fbbf24'; leftC = '#d97706'; rightC = '#b45309';
          spriteKey = (gx + gy) % 2 === 0 ? 'portuario/seaport_1' : 'portuario/seaport_2';
        } else if (tile.isMedia) {
          topC = '#c084fc'; leftC = '#9333ea'; rightC = '#7e22ce';
          spriteKey = tile.mediaData && tile.mediaData.type === 'Televisão' ? 'logistica_midia/media_tv' : 'logistica_midia/media_radio';
        } else if ((tile.districtId === 'downtown' || tile.districtId === 'northside') && !tile.isWater && !tile.isRoad && hPx > 0) {
          spriteKey = sm ? sm.getUrbanSprite(tile.districtId, gx, gy) : null;
        }

        if (spriteKey) {
          const fallback = () => { if (hPx > 0) drawBuilding(ctx, sx, sy, w, h, hPx, topC, leftC, rightC); };
          if (sm && typeof sm.draw === 'function') {
            sm.draw(ctx, spriteKey, sx, sy, w, h, fallback);
          } else {
            fallback();
          }
        } else if (hPx > 0) {
          drawBuilding(ctx, sx, sy, w, h, hPx, topC, leftC, rightC);
        }

        // Badges Procedurais de Logo de Empresa
        let facilityLogo = null;
        if (tile.competitor) {
          facilityLogo = genLogo(tile.competitor.name || 'Megamart Varejo', 0, true);
        } else if (tile.store || tile.mine || tile.farm || tile.factory || tile.rdCenter || tile.warehouse) {
          facilityLogo = genLogo(playerProfile.companyName || 'OikoCorp Holding', playerProfile.logoRegenSeed || 0, false, playerProfile?.themeColor);
        } else if (tile.isPort) {
          facilityLogo = { shape: 'hexagon', color: '#38bdf8', iconDef: icons.anchor || null };
        } else if (tile.isMedia) {
          facilityLogo = { shape: 'circle', color: '#c084fc', iconDef: icons.star || null };
        }

        if (facilityLogo) {
          const isPlayer = !!(tile.store || tile.mine || tile.farm || tile.factory || tile.rdCenter || tile.warehouse);
          const badgeRadius = isPlayer ? 9.5 : 7.5;
          const badgeY = sy - (hPx || 16 * camera.zoom) - (isPlayer ? 10 : 8) * camera.zoom;
          drawBadge(ctx, facilityLogo, sx, badgeY, badgeRadius, camera.zoom);
        }
      }

      // Realce de Hover (cursor)
      if (gx === hoveredTileX && gy === hoveredTileY) {
        drawDiamond(ctx, sx, sy, w, h, 'rgba(255,255,255,0.14)', '#38bdf8');
      }

      // Destaque Dourado Sofisticado do Lote Selecionado por Clique (#d4b483)
      if (gx === selectedTileX && gy === selectedTileY) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + w / 2, sy + h / 2);
        ctx.lineTo(sx, sy + h);
        ctx.lineTo(sx - w / 2, sy + h / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(212, 180, 131, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#d4b483';
        ctx.lineWidth = Math.max(1.8, 2.2 * camera.zoom);
        ctx.shadowColor = 'rgba(212, 180, 131, 0.6)';
        ctx.shadowBlur = 6 * camera.zoom;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

export function _rafLoop(now = performance.now()) {
  _framesCount++;
  if (now - _lastFpsTime >= 500) {
    _currentFps = Math.max(1, Math.round((_framesCount * 1000) / (now - _lastFpsTime)));
    _framesCount = 0;
    _lastFpsTime = now;
    const fpsEl = document.getElementById('telemetry-fps');
    if (fpsEl) {
      fpsEl.textContent = `⚡ ${_currentFps} FPS`;
      fpsEl.className = _currentFps >= 50 ? 'text-emerald-400 font-bold' : (_currentFps >= 30 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold');
    }
  }

  if (_needsRender) {
    try {
      renderMap();
      renderMinimap();
      _needsRender = false;
      if (typeof window !== 'undefined') window._needsRender = false;
    } catch (e) {
      console.warn('[Renderer] Erro durante o frame de renderização:', e);
    }
  }
  _rafId = requestAnimationFrame(_rafLoop);
}

export function startRenderLoop() {
  if (!_rafId) {
    _rafId = requestAnimationFrame(_rafLoop);
  }
}

export function stopRenderLoop() {
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}

export const CanvasRenderer = {
  renderMap,
  renderMinimap,
  resizeCanvas,
  scheduleRender,
  startRenderLoop,
  stopRenderLoop,
  getCurrentFps
};

if (typeof window !== 'undefined') {
  window.CanvasRenderer = CanvasRenderer;
  window.renderMap = renderMap;
  window.scheduleRender = scheduleRender;
  window.resizeCanvas = resizeCanvas;
  window._needsRender = true;
}

export default CanvasRenderer;
