/**
 * iso_math.js — Projeções Isométricas & Primitivas Geométricas
 * OIKONOMIA v0.8.5 (Fase 6.3 — Motor de Renderização Canvas & Isometria)
 * 
 * Responsável por:
 * - Projeção de coordenadas da grade (gx, gy) para a tela (sx, sy)
 * - Projeção inversa de coordenadas do cursor (mx, my) para a grade (gx, gy)
 * - Renderização do losango isométrico base (drawDiamond)
 * - Renderização do prisma 3D para edifícios (drawBuilding)
 */

export function gridToScreen(gx, gy, camera = null, tileW = null, tileH = null) {
  const cam = camera || (typeof window !== 'undefined' ? window.camera : { panX: 0, panY: 0, zoom: 1 });
  const tW = tileW ?? ((typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64);
  const tH = tileH ?? ((typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32);

  return {
    sx: (gx - gy) * (tW / 2) * cam.zoom + cam.panX,
    sy: (gx + gy) * (tH / 2) * cam.zoom + cam.panY
  };
}

export function screenToGrid(mx, my, camera = null, tileW = null, tileH = null) {
  const cam = camera || (typeof window !== 'undefined' ? window.camera : { panX: 0, panY: 0, zoom: 1 });
  const tW = tileW ?? ((typeof window !== 'undefined' && window.TILE_W) ? window.TILE_W : 64);
  const tH = tileH ?? ((typeof window !== 'undefined' && window.TILE_H) ? window.TILE_H : 32);

  const relX = (mx - cam.panX) / ((tW / 2) * cam.zoom);
  const relY = (my - cam.panY) / ((tH / 2) * cam.zoom);

  return {
    gx: Math.floor((relY + relX) / 2),
    gy: Math.floor((relY - relX) / 2)
  };
}

export function drawDiamond(ctx, sx, sy, w, h, fill, stroke = '#09111e') {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + w / 2, sy + h / 2);
  ctx.lineTo(sx, sy + h);
  ctx.lineTo(sx - w / 2, sy + h / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
}

export function drawBuilding(ctx, sx, sy, w, h, hPx, topC, leftC, rightC) {
  const tsy = sy - hPx;

  // Face lateral esquerda
  ctx.beginPath();
  ctx.moveTo(sx - w / 2, sy + h / 2);
  ctx.lineTo(sx, sy + h);
  ctx.lineTo(sx, tsy + h);
  ctx.lineTo(sx - w / 2, tsy + h / 2);
  ctx.closePath();
  ctx.fillStyle = leftC;
  ctx.fill();

  // Face lateral direita
  ctx.beginPath();
  ctx.moveTo(sx, sy + h);
  ctx.lineTo(sx + w / 2, sy + h / 2);
  ctx.lineTo(sx + w / 2, tsy + h / 2);
  ctx.lineTo(sx, tsy + h);
  ctx.closePath();
  ctx.fillStyle = rightC;
  ctx.fill();

  // Face do topo
  ctx.beginPath();
  ctx.moveTo(sx, tsy);
  ctx.lineTo(sx + w / 2, tsy + h / 2);
  ctx.lineTo(sx, tsy + h);
  ctx.lineTo(sx - w / 2, tsy + h / 2);
  ctx.closePath();
  ctx.fillStyle = topC;
  ctx.fill();
  ctx.strokeStyle = '#010c14';
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

export const IsoMath = {
  gridToScreen,
  screenToGrid,
  drawDiamond,
  drawBuilding
};

if (typeof window !== 'undefined') {
  window.IsoMath = IsoMath;
  window.gridToScreen = gridToScreen;
  window.screenToGrid = screenToGrid;
  window.drawDiamond = (sx, sy, w, h, fill, stroke) => {
    const c = (typeof window.ctx !== 'undefined') ? window.ctx : (document.getElementById('iso-canvas')?.getContext('2d'));
    if (c) drawDiamond(c, sx, sy, w, h, fill, stroke);
  };
  window.drawBuilding = (sx, sy, w, h, hPx, topC, leftC, rightC) => {
    const c = (typeof window.ctx !== 'undefined') ? window.ctx : (document.getElementById('iso-canvas')?.getContext('2d'));
    if (c) drawBuilding(c, sx, sy, w, h, hPx, topC, leftC, rightC);
  };
}

export default IsoMath;
