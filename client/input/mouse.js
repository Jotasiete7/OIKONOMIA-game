// ===========================================================================
// OIKONOMIA — SISTEMA DE CONTROLE DE MOUSE & INTERAÇÃO COM O MAPA
// client/input/mouse.js
// ===========================================================================

export class MouseController {
  constructor() {
    this.canvas = null;
    this.tooltip = null;
    this.wasDragging = false;
    this._boundMouseDown = this.handleMouseDown.bind(this);
    this._boundMouseMove = this.handleMouseMove.bind(this);
    this._boundMouseUp = this.handleMouseUp.bind(this);
    this._boundMouseLeave = this.handleMouseLeave.bind(this);
    this._boundWheel = this.handleWheel.bind(this);
    this._boundClick = this.handleClick.bind(this);
  }

  init(canvasEl, tooltipEl) {
    if (typeof window === 'undefined') return;
    this.canvas = canvasEl || document.getElementById('iso-canvas');
    this.tooltip = tooltipEl || document.getElementById('iso-tooltip') || document.getElementById('tile-tooltip');

    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', this._boundMouseDown);
    window.addEventListener('mouseup', this._boundMouseUp);
    this.canvas.addEventListener('mousemove', this._boundMouseMove);
    this.canvas.addEventListener('mouseleave', this._boundMouseLeave);
    this.canvas.addEventListener('wheel', this._boundWheel, { passive: false });
    this.canvas.addEventListener('click', this._boundClick);
  }

  destroy() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('mousedown', this._boundMouseDown);
    window.removeEventListener('mouseup', this._boundMouseUp);
    this.canvas.removeEventListener('mousemove', this._boundMouseMove);
    this.canvas.removeEventListener('mouseleave', this._boundMouseLeave);
    this.canvas.removeEventListener('wheel', this._boundWheel);
    this.canvas.removeEventListener('click', this._boundClick);
  }

  handleMouseDown(e) {
    if (!this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const cam = window.CameraController?.camera || window.camera;
    if (!cam) return;

    // Clique dentro do Radar Minimapa: Teletransporta a câmera imediatamente
    const mmSize = 110;
    const mmX = 12;
    const mmY = r.height - mmSize - 12;
    const gridSize = window.GRID_SIZE || 128;
    const tileW = window.TILE_W || 64;
    const tileH = window.TILE_H || 32;

    if (mx >= mmX && mx <= mmX + mmSize && my >= mmY && my <= mmY + mmSize) {
      const step = gridSize / mmSize;
      const targetGx = Math.floor((mx - mmX) * step);
      const targetGy = Math.floor((my - mmY) * step);
      cam.panX = (r.width / 2) - (targetGx - targetGy) * (tileW / 2) * (cam.zoom || 1);
      cam.panY = (r.height / 2) - (targetGx + targetGy) * (tileH / 2) * (cam.zoom || 1);
      const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
      if (typeof renderFn === 'function') renderFn();
      return;
    }

    cam.isDragging = true;
    this.wasDragging = false;
    window.wasDragging = false;
    cam.dragStartX = e.clientX - cam.panX;
    cam.dragStartY = e.clientY - cam.panY;
  }

  handleMouseUp() {
    const cam = window.CameraController?.camera || window.camera;
    if (cam) {
      cam.isDragging = false;
    }
  }

  handleMouseMove(e) {
    if (!this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const cam = window.CameraController?.camera || window.camera;
    const tooltip = this.tooltip || document.getElementById('tile-tooltip');
    const gridSize = window.GRID_SIZE || 128;

    if (cam && cam.isDragging) {
      const dx = Math.abs(e.clientX - cam.dragStartX - cam.panX);
      const dy = Math.abs(e.clientY - cam.dragStartY - cam.panY);
      if (dx > 4 || dy > 4) {
        this.wasDragging = true;
        window.wasDragging = true;
      }
      cam.panX = e.clientX - cam.dragStartX;
      cam.panY = e.clientY - cam.dragStartY;
      if (tooltip) tooltip.classList.add('hidden');
      const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
      if (typeof renderFn === 'function') renderFn();
      return;
    }

    const screenToGridFn = window.IsoMath?.screenToGrid || window.screenToGrid;
    if (typeof screenToGridFn !== 'function') return;

    const { gx, gy } = screenToGridFn(mx, my);
    const worldGrid = window.worldGrid;

    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize && worldGrid && worldGrid[gx] && worldGrid[gx][gy]) {
      window.hoveredTileX = gx;
      window.hoveredTileY = gy;
      const tile = worldGrid[gx][gy];
      const d = tile.district || {};

      if (tooltip) {
        tooltip.classList.remove('hidden');
        tooltip.style.left = `${mx + 14}px`;
        tooltip.style.top = `${my + 10}px`;

        const playerProfile = window.playerProfile || { companyName: 'OikoCorp Holding' };
        const getSvgFn = window.getCompanyLogoSvg || (() => '');
        const genLogoFn = window.generateCompanyLogo || (() => ({}));
        const logoIcons = window.LOGO_ICONS || {};
        const storeTypes = window.STORE_TYPES || [];

        if (tile.city && tile.city.isLocked) {
          tooltip.innerHTML = `
            <div class="font-bold text-slate-400 text-xs">🔒 Região Bloqueada: ${tile.city.cityName}</div>
            <div class="text-[10px] text-amber-400 mt-1">${tile.city.profile?.unlockCondition?.description || 'Bloqueado'}</div>
          `;
        } else if (tile.isPort) {
          const portLogo = { shape: 'hexagon', color: '#38bdf8', iconDef: logoIcons.anchor };
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(portLogo, 20)}
              <div>
                <div class="font-bold text-amber-300 text-xs">⚓ ${tile.portData?.name || 'Porto Comercial'}</div>
                <div class="text-[9px] text-slate-400">Terminal Marítimo Internacional</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Frete Base: $${(tile.portData?.freightRatePerTile || 0.01).toFixed(3)}/tile · Insumos Globais</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · ${tile.city?.cityName || 'Zona Portuária'}</div>
          `;
        } else if (tile.isMedia) {
          const mediaLogo = { shape: 'circle', color: '#c084fc', iconDef: logoIcons.star };
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(mediaLogo, 20)}
              <div>
                <div class="font-bold text-purple-300 text-xs">${tile.mediaData?.emoji || '📢'} ${tile.mediaData?.name || 'Emissora de Mídia'}</div>
                <div class="text-[9px] text-slate-400">Emissora de ${tile.mediaData?.type || 'Comunicação'}</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Alcance Metropolitano · Contratos de Publicidade</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · ${tile.city?.cityName || 'Metrópole'}</div>
          `;
        } else if (tile.mine) {
          const logo = genLogoFn(playerProfile.companyName, playerProfile.logoRegenSeed || 0, false);
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(logo, 20)}
              <div>
                <div class="font-bold text-sky-400 text-xs">⛏️ ${tile.mine.name}</div>
                <div class="text-[9px] text-slate-400">${playerProfile.companyName} · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Extração: ${tile.mine.dailyYield || 0} un/dia · Qualidade QR: ${tile.mine.quality || 0}</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · 💰 Aluguel $${d.landRentDaily || 0}/dia</div>
          `;
        } else if (tile.farm) {
          const logo = genLogoFn(playerProfile.companyName, playerProfile.logoRegenSeed || 0, false);
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(logo, 20)}
              <div>
                <div class="font-bold text-amber-400 text-xs">🌾 ${tile.farm.name}</div>
                <div class="text-[9px] text-slate-400">${playerProfile.companyName} · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Produção: ${tile.farm.dailyYield || 0} un/dia · Qualidade QR: ${tile.farm.quality || 0}</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · 💰 Aluguel $${d.landRentDaily || 0}/dia</div>
          `;
        } else if (tile.factory) {
          const logo = genLogoFn(playerProfile.companyName, playerProfile.logoRegenSeed || 0, false);
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(logo, 20)}
              <div>
                <div class="font-bold text-orange-400 text-xs">🏭 ${tile.factory.name}</div>
                <div class="text-[9px] text-slate-400">${playerProfile.companyName} · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Linhas Produtivas: ${Object.keys(tile.factory.lines || {}).length}/${tile.factory.maxLines || 4} ativas</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · 💰 Aluguel $${d.landRentDaily || 0}/dia</div>
          `;
        } else if (tile.rdCenter) {
          const logo = genLogoFn(playerProfile.companyName, playerProfile.logoRegenSeed || 0, false);
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(logo, 20)}
              <div>
                <div class="font-bold text-purple-300 text-xs">🔬 ${tile.rdCenter.name}</div>
                <div class="text-[9px] text-slate-400">${playerProfile.companyName} · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Centro de Pesquisa & Desenvolvimento</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · ${tile.city?.cityName || 'Metrópole'}</div>
          `;
        } else if (tile.warehouse) {
          const logo = genLogoFn(playerProfile.companyName, playerProfile.logoRegenSeed || 0, false);
          const totalStock = Object.values(tile.warehouse.inventory || {}).reduce((s, i) => s + (i.stock || 0), 0);
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
              ${getSvgFn(logo, 20)}
              <div>
                <div class="font-bold text-sky-400 text-xs">🏢 ${tile.warehouse.name}</div>
                <div class="text-[9px] text-slate-400">${playerProfile.companyName} · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-[10px] text-slate-300">Estoque: <strong>${totalStock.toLocaleString()} / ${(tile.warehouse.maxCapacity || 25000).toLocaleString()} un</strong> (Nível ${tile.warehouse.level || 1})</div>
            <div class="text-[9px] text-slate-400 mt-0.5">(${gx}, ${gy}) · 💰 Aluguel + Manutenção $${(tile.warehouse.dailyRent || 10) + (tile.warehouse.dailyMaintenance || 60)}/dia</div>
          `;
        } else if (tile.store) {
          const logo = genLogoFn(playerProfile.companyName, playerProfile.logoRegenSeed || 0, false);
          const sType = storeTypes.find(s => s.id === tile.store.storeTypeId);
          const emoji = sType ? sType.emoji : '🛒';
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1.5">
              ${getSvgFn(logo, 22)}
              <div>
                <div class="font-bold text-emerald-400 text-xs">${emoji} ${tile.store.name}</div>
                <div class="text-[11px] text-slate-300 font-medium">${playerProfile.companyName} · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-xs text-white font-semibold">Vendas: <span class="text-emerald-300">$${(tile.store.monthSales || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}/mês</span></div>
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-2 border-t border-slate-700/80 pt-1">
              <span>📍 (${gx}, ${gy})</span>
              <span>👥 ${(d.population || 0).toLocaleString()} hab</span>
              <span>🚶 Tráfego ${d.trafficIndex || 0}/100</span>
            </div>
          `;
        } else if (tile.competitor) {
          const logo = genLogoFn(tile.competitor.name, 0, true);
          tooltip.innerHTML = `
            <div class="flex items-center gap-2 mb-1.5">
              ${getSvgFn(logo, 22)}
              <div>
                <div class="font-bold text-rose-400 text-xs">🏪 ${tile.competitor.name}</div>
                <div class="text-[11px] text-rose-200 font-medium">IA Concorrente · ${d.name || ''}</div>
              </div>
            </div>
            <div class="text-xs text-slate-200 font-medium">Preços Agressivos · Grande Escala</div>
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-2 border-t border-slate-700/80 pt-1">
              <span>📍 (${gx}, ${gy})</span>
              <span>👥 ${(d.population || 0).toLocaleString()} hab</span>
              <span>🚶 Tráfego ${d.trafficIndex || 0}/100</span>
            </div>
          `;
        } else {
          tooltip.innerHTML = `
            <div class="font-bold text-amber-300 text-xs">${d.name || 'Terreno'}</div>
            <div class="text-[11px] text-slate-300">(${gx}, ${gy}) · ${d.type || 'Padrão'} · ${tile.city?.cityName || 'Zona Rural'}</div>
            <div class="text-[11px] text-slate-200 mt-1 flex items-center gap-2 border-t border-slate-700/80 pt-1">
              <span>🚶 Tráfego ${d.trafficIndex || 0}/100</span>
              <span>👥 ${(d.population || 0).toLocaleString()} hab</span>
              <span>💰 $${d.landRentDaily || 0}/dia</span>
            </div>
          `;
        }
      }
    } else {
      window.hoveredTileX = -1;
      window.hoveredTileY = -1;
      if (tooltip) tooltip.classList.add('hidden');
    }

    const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
    if (typeof renderFn === 'function') renderFn();
  }

  handleMouseLeave() {
    window.hoveredTileX = -1;
    window.hoveredTileY = -1;
    const tooltip = this.tooltip || document.getElementById('tile-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
    const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
    if (typeof renderFn === 'function') renderFn();
  }

  handleWheel(e) {
    e.preventDefault();
    if (!this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;

    const zoomFn = window.CameraController?.changeZoom || window.changeZoom;
    if (typeof zoomFn === 'function') {
      zoomFn(zoomFactor, mx, my);
    }

    const screenToGridFn = window.IsoMath?.screenToGrid || window.screenToGrid;
    const gridSize = window.GRID_SIZE || 128;
    if (typeof screenToGridFn === 'function') {
      const { gx, gy } = screenToGridFn(mx, my);
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        window.hoveredTileX = gx;
        window.hoveredTileY = gy;
      }
    }
  }

  handleClick(e) {
    if (this.wasDragging || window.wasDragging) return;
    if (!this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    // Ignora clique se foi no minimapa
    const mmSize = 110;
    const mmX = 12;
    const mmY = r.height - mmSize - 12;
    if (mx >= mmX && mx <= mmX + mmSize && my >= mmY && my <= mmY + mmSize) return;

    const screenToGridFn = window.IsoMath?.screenToGrid || window.screenToGrid;
    const gridSize = window.GRID_SIZE || 128;
    if (typeof screenToGridFn !== 'function') return;

    const { gx, gy } = screenToGridFn(mx, my);
    if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return;

    const worldGrid = window.worldGrid;
    if (!worldGrid || !worldGrid[gx] || !worldGrid[gx][gy]) return;

    window.selectedTileX = gx;
    window.selectedTileY = gy;
    const tile = worldGrid[gx][gy];

    if (tile.city && tile.city.isLocked) {
      if (typeof window.addGameLog === 'function') {
        window.addGameLog(`🔒 Região de ${tile.city.cityName || 'Metrópole'} bloqueada: ${tile.city.profile?.unlockCondition?.description || ''}`);
      }
      this._renderInspector(tile);
      const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
      if (typeof renderFn === 'function') renderFn();
      return;
    }

    if (tile.isPort) {
      if (typeof window.openPortModal === 'function') window.openPortModal(tile.portData);
    } else if (tile.isMedia) {
      if (typeof window.openMarketingCentralModal === 'function') window.openMarketingCentralModal(tile.mediaData?.id);
    } else if (tile.warehouse) {
      if (typeof window.openWarehouseModal === 'function') window.openWarehouseModal(tile);
    } else if (tile.store || tile.mine || tile.farm || tile.factory || tile.rdCenter) {
      window.activeManagedTile = tile;
      if (typeof window.renderFacilityPanel === 'function') {
        window.renderFacilityPanel(tile);
      } else if (window.FacilityPanel && typeof window.FacilityPanel.renderFacilityPanel === 'function') {
        window.FacilityPanel.renderFacilityPanel(tile);
      }
      const win = document.getElementById('floating-facility-window');
      if (win) win.classList.remove('hidden');
    } else if (!tile.isWater && !tile.isRoad) {
      window.activeManagedTile = tile;
      if (typeof window.renderEmptyLotPanel === 'function') {
        window.renderEmptyLotPanel(tile);
      } else if (window.FacilityPanel && typeof window.FacilityPanel.renderEmptyLotPanel === 'function') {
        window.FacilityPanel.renderEmptyLotPanel(tile);
      }
    } else {
      window.activeManagedTile = null;
      if (typeof window.renderIdlePanel === 'function') {
        window.renderIdlePanel();
      }
    }

    this._renderInspector(tile);
    const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
    if (typeof renderFn === 'function') renderFn();
  }

  _renderInspector(tile) {
    if (window.FacilityPanel && typeof window.FacilityPanel.renderTileInspector === 'function') {
      window.FacilityPanel.renderTileInspector(tile);
    } else if (typeof window.renderTileInspector === 'function') {
      window.renderTileInspector(tile);
    }
  }
}

export const MouseSystem = new MouseController();

if (typeof window !== 'undefined') {
  window.MouseSystem = MouseSystem;
}
