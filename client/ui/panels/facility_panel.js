/**
 * OIKONOMIA - Specialized Facility Panel & Inspector Controller
 * client/ui/panels/facility_panel.js
 *
 * Handles:
 * - Floating facility window open/close and state management
 * - Tile inspector in telemetry bar
 * - Detailed management panels for each facility type:
 *   - Retail Stores (shelves, pricing, restock, markup, supplier routing)
 *   - Manufacturing Plants / Factories (lines, inputs, skins/facades, finished stock)
 *   - Agricultural Farms (crops, livestock, feed nutrition monitoring & autonomy)
 *   - Natural Extractive Mines (timber, silica, iron, bauxite, oil, gold, chemicals)
 *   - R&D Complexes (bench assignments, active projects, patent showcase)
 *   - Empty lots with natural deposit vocation & construction action grid
 * - Universal styled confirmation modals & working capital liquidity protection
 */

export const FacilityPanel = {
  isRDPatentsExpanded: false,
  pendingConfirmCallback: null,
  pendingFacilityAction: null,

  openFloatingFacilityWindow(tile) {
    if (!tile) return;
    if (typeof window !== 'undefined') window.activeManagedTile = tile;
    this.renderFacilityPanel(tile);
    const win = document.getElementById('floating-facility-window');
    if (win) {
      win.classList.remove('hidden');
      if (typeof window.SoundEngine !== 'undefined' && typeof window.SoundEngine.playModalOpen === 'function') {
        window.SoundEngine.playModalOpen();
      }
    }
  },

  closeFloatingFacilityWindow() {
    const win = document.getElementById('floating-facility-window');
    if (win) win.classList.add('hidden');
    if (typeof window !== 'undefined') window.activeManagedTile = null;
  },

  renderFacilityPanel(tile) {
    if (!tile) { this.renderIdlePanel(); return; }
    if (tile.store) this.renderStorePanel(tile);
    else if (tile.mine) this.renderMinePanel(tile);
    else if (tile.farm) this.renderFarmPanel(tile);
    else if (tile.factory) this.renderFactoryPanel(tile);
    else if (tile.rdCenter) this.renderRDCenterPanel(tile);
    else if (tile.warehouse && typeof window.renderWarehousePanel === 'function') window.renderWarehousePanel(tile);
    else if (!tile.isWater && !tile.isRoad) this.renderEmptyLotPanel(tile);
    else this.renderIdlePanel();
  },

  renderIdlePanel() {
    const iconEl = document.getElementById('facility-icon');
    if (iconEl) iconEl.innerHTML = '🏢';
    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = '🏢 Selecione uma instalação no mapa';
    const subEl = document.getElementById('facility-subtitle');
    if (subEl) subEl.textContent = 'Clique na sua loja, mina, fazenda ou fábrica para gerir.';
    const rentBadge = document.getElementById('facility-rent-badge');
    if (rentBadge) rentBadge.classList.add('hidden');
    const actRow = document.getElementById('facility-action-row');
    if (actRow) actRow.classList.add('hidden');
    const content = document.getElementById('facility-content-panel');
    if (content) content.innerHTML = `<p class="text-[11px] text-slate-500 font-mono text-center py-3">Nenhuma instalação selecionada.</p>`;
  },

  renderTileInspector(tile) {
    const tileInfoEl = document.getElementById('telemetry-tile-info');
    const distInfoEl = document.getElementById('telemetry-district-info');
    const actionsEl = document.getElementById('telemetry-actions');

    if (!tile) {
      if (tileInfoEl) tileInfoEl.innerHTML = '📍 <span>Lote (-- , --) · Clique em um lote</span>';
      if (distInfoEl) distInfoEl.textContent = '| Terreno Padrão';
      if (actionsEl) actionsEl.innerHTML = '';
      return;
    }

    const d = tile.district || { name: 'Distrito Central' };
    const isLocked = tile.city ? tile.city.isLocked : false;
    const cityName = tile.city ? (tile.city.cityName || tile.city.name || 'Metrópole') : 'Zona Rural';

    if (tileInfoEl) {
      const typeName = tile.store?.name || tile.mine?.name || tile.farm?.name || tile.factory?.name || tile.rdCenter?.name || tile.warehouse?.name || (tile.isPort ? 'Porto Marítimo' : (tile.isWater ? 'Oceano' : (isLocked ? '🔒 Bloqueado' : (tile.isRoad ? 'Rodovia' : 'Terreno Livre'))));
      tileInfoEl.innerHTML = `📍 <span class="text-amber-300">Lote (${tile.x}, ${tile.y})</span> <span class="text-slate-300">· ${typeName}</span>`;
    }
    if (distInfoEl) {
      distInfoEl.textContent = `| ${cityName} (${d.name})`;
    }

    if (actionsEl) {
      let buttonsHtml = '';
      if (isLocked) {
        buttonsHtml = '<span class="text-rose-400 font-bold text-[9px] bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">🔒 Região Bloqueada</span>';
      } else if (tile.store) {
        buttonsHtml = `<button onclick="openFloatingFacilityWindow(worldGrid[${tile.x}][${tile.y}])" class="bg-teal-700 hover:bg-teal-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">🛒 Gerir Loja</button>`;
      } else if (tile.mine) {
        const res = tile.mine.resourceId || '';
        const isTimber = res === 'timber';
        const isSilica = res === 'silica';
        const isOil = res === 'crude_oil';
        const isBauxite = res === 'bauxite';
        const isGold = res === 'gold_ore';
        const isChem = res === 'chemical_minerals';
        const mineLabel = isTimber ? '🪵 Gerir Serraria' : (isSilica ? '🏖️ Gerir Jazida' : (isOil ? '🛢️ Gerir Poço' : (isBauxite ? '🪨 Gerir Bauxita' : (isGold ? '🥇 Gerir Ouro' : (isChem ? '🧪 Gerir Químicos' : '⛏️ Gerir Mina')))));
        const mineClass = isTimber ? 'bg-amber-800 hover:bg-amber-700' : (isSilica ? 'bg-stone-700 hover:bg-stone-600' : (isOil ? 'bg-slate-800 hover:bg-slate-700' : (isGold ? 'bg-yellow-800 hover:bg-yellow-700' : (isBauxite ? 'bg-orange-800 hover:bg-orange-700' : (isChem ? 'bg-teal-800 hover:bg-teal-700' : 'bg-sky-700 hover:bg-sky-600')))));
        buttonsHtml = `<button onclick="openFloatingFacilityWindow(worldGrid[${tile.x}][${tile.y}])" class="${mineClass} text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">${mineLabel}</button>`;
      } else if (tile.farm) {
        buttonsHtml = `<button onclick="openFloatingFacilityWindow(worldGrid[${tile.x}][${tile.y}])" class="bg-amber-700 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">🌾 Gerir Fazenda</button>`;
      } else if (tile.factory) {
        buttonsHtml = `<button onclick="openFloatingFacilityWindow(worldGrid[${tile.x}][${tile.y}])" class="bg-orange-700 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">🏭 Gerir Fábrica</button>`;
      } else if (tile.rdCenter) {
        buttonsHtml = `<button onclick="openFloatingFacilityWindow(worldGrid[${tile.x}][${tile.y}])" class="bg-purple-700 hover:bg-purple-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">🔬 Gerir P&D</button>`;
      } else if (tile.warehouse) {
        buttonsHtml = `<button onclick="openWarehouseModal(worldGrid[${tile.x}][${tile.y}])" class="bg-sky-700 hover:bg-sky-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">🏢 Gerir Armazém</button>`;
      } else if (tile.isPort) {
        buttonsHtml = `<button onclick="openPortModal(worldGrid[${tile.x}][${tile.y}].portData)" class="bg-yellow-700 hover:bg-yellow-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">⚓ Ver Cargas</button>`;
      } else if (tile.isMedia) {
        buttonsHtml = `<button onclick="openMarketingCentralModal(worldGrid[${tile.x}][${tile.y}].mediaData.id)" class="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer">📢 Contratar Mídia</button>`;
      } else if (!tile.isWater && !tile.isRoad) {
        buttonsHtml = `
          <span class="text-slate-600">|</span>
          <div class="inline-flex items-center gap-1">
            <span class="text-[9px] text-slate-400 font-bold hidden sm:inline">Construir:</span>
            ${tile.hasTimberDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_timber')" class="bg-amber-800 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Serraria e Silvicultura Florestal ($28.000)">🪵 +Serraria</button>` : ''}
            ${tile.hasSilicaDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_silica')" class="bg-stone-700 hover:bg-stone-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Jazida de Sílica & Quartzo Industrial ($30.000)">🏖️ +Jazida Sílica</button>` : ''}
            ${tile.hasIronDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_iron')" class="bg-sky-700 hover:bg-sky-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Mina de Ferro ($40.000)">⛏️ +Mina Ferro</button>` : ''}
            ${tile.hasBauxiteDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_bauxite')" class="bg-orange-800 hover:bg-orange-700 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Mina de Bauxita / Alumínio ($42.000)">🪨 +Mina Bauxita</button>` : ''}
            ${tile.hasChemicalDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_chemicals')" class="bg-teal-800 hover:bg-teal-700 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Depósito de Minerais Químicos ($38.000)">🧪 +Depósito Químico</button>` : ''}
            ${tile.hasOilDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_oil')" class="bg-slate-800 hover:bg-slate-700 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Campo Petrolífero / Poço ($65.000)">🛢️ +Poço Petróleo</button>` : ''}
            ${tile.hasGoldDeposit ? `<button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_gold')" class="bg-yellow-700 hover:bg-yellow-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Instalar Mina de Ouro Nobre ($90.000)">🥇 +Mina Ouro</button>` : ''}
            <button onclick="openStoreModal(worldGrid[${tile.x}][${tile.y}])" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Inaugurar Estabelecimento Comercial">🏪 +Loja</button>
            <button onclick="openFactoryModal(worldGrid[${tile.x}][${tile.y}])" class="bg-orange-700 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Construir Parque Fabril">🏭 +Fábrica</button>
            <button onclick="openFarmModal(worldGrid[${tile.x}][${tile.y}])" class="bg-amber-700 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Iniciar Fazenda Agropecuária">🌾 +Fazenda</button>
            <button onclick="confirmBuildWarehouse(${tile.x}, ${tile.y})" class="bg-sky-700 hover:bg-sky-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Construir Centro de Distribuição & Armazém ($35.000)">🏢 +Armazém</button>
            <button onclick="confirmBuildRDCenter(${tile.x}, ${tile.y})" class="bg-purple-700 hover:bg-purple-600 text-white font-bold px-2 py-0.5 rounded text-[9px] shadow cursor-pointer flex items-center gap-0.5" title="Construir Centro de Pesquisa & Desenvolvimento ($80.000)">🔬 +P&D</button>
          </div>
        `;
      }
      actionsEl.innerHTML = buttonsHtml;
    }
  },

  renderEmptyLotPanel(tile) {
    const d = tile.district || { name: 'Distrito Central', landRentDaily: 10, trafficIndex: 50, population: 5000 };
    const cityName = tile.city ? (tile.city.cityName || tile.city.name || 'Metrópole') : 'Zona Rural';
    const cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);

    const iconEl = document.getElementById('facility-icon');
    if (iconEl) iconEl.innerHTML = '📍';
    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = `🏢 Lote Disponível (${tile.x}, ${tile.y})`;
    const subEl = document.getElementById('facility-subtitle');
    if (subEl) subEl.textContent = `${cityName} · ${d.name}`;

    const badge = document.getElementById('facility-rent-badge');
    if (badge) {
      badge.textContent = `-$${d.landRentDaily}/dia`;
      badge.classList.remove('hidden');
    }

    const actionRow = document.getElementById('facility-action-row');
    if (actionRow) actionRow.classList.add('hidden');

    const hasTimber = !!tile.hasTimberDeposit;
    const hasSilica = !!tile.hasSilicaDeposit;
    const hasIron = !!tile.hasIronDeposit;
    const hasBauxite = !!tile.hasBauxiteDeposit;
    const hasChemical = !!tile.hasChemicalDeposit;
    const hasOil = !!tile.hasOilDeposit;
    const hasGold = !!tile.hasGoldDeposit;
    const hasResource = hasTimber || hasSilica || hasIron || hasBauxite || hasChemical || hasOil || hasGold;
    const depositName = hasTimber 
      ? 'Reserva Florestal (Madeira / Toras)' 
      : (hasSilica ? 'Jazida de Sílica & Quartzo Industrial' 
      : (hasIron ? 'Minério de Ferro' 
      : (hasBauxite ? 'Jazida de Bauxita (Alumínio)'
      : (hasChemical ? 'Depósito de Minerais Químicos'
      : (hasOil ? 'Campo Petrolífero / Petróleo Bruto'
      : (hasGold ? 'Veio de Minério de Ouro Nobre' : null))))));

    let naturalResourceCard = '';
    if (hasTimber) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-amber-950/90 to-emerald-950/80 p-3.5 rounded-xl border-2 border-amber-600/90 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-amber-950 border border-amber-500/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_timber.png" class="w-full h-full object-contain" onerror="this.outerHTML='🪵'">
              </div>
              <div>
                <div class="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                  <span>🪵</span> Instalar Serraria & Silvicultura
                </div>
                <div class="text-[11px] text-amber-300/80 mt-0.5">Manejo & Extração de Madeira / Toras</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$28.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">650 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-amber-800/40 font-mono">
            🌲 <strong>Reserva Florestal:</strong> Extraia toras nativas brutas para abastecer indústrias de chapas estruturais (<code class="text-amber-300">lumber</code>), celulose/papel e marcenarias de móveis nobres.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_timber')" ${cash < 28000 ? 'disabled' : ''} class="w-full bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🪵</span>
            <span>Construir Serraria & Silvicultura ($28.000)</span>
          </button>
        </div>
      `;
    } else if (hasSilica) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-stone-950 to-slate-900 p-3.5 rounded-xl border-2 border-stone-500 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-stone-900 border border-stone-400 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_silica.png" class="w-full h-full object-contain" onerror="this.outerHTML='🏖️'">
              </div>
              <div>
                <div class="font-bold text-stone-100 text-sm flex items-center gap-1.5">
                  <span>🏖️</span> Instalar Jazida de Sílica & Areia
                </div>
                <div class="text-[11px] text-stone-300 mt-0.5">Extração & Lavagem de Quartzo Continental</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$30.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">800 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-stone-700 font-mono">
            💎 <strong>Bacia Continental de Quartzo:</strong> Areia de sílica de alta pureza (SiO₂ > 99%), isenta de sal marinho e conchas, essencial para fundição de Vidro Plano (<code class="text-sky-300">glass</code>) e chips semicondutores (<code class="text-sky-300">chips</code>).
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_silica')" ${cash < 30000 ? 'disabled' : ''} class="w-full bg-gradient-to-r from-stone-600 to-slate-600 hover:from-stone-500 hover:to-slate-500 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🏖️</span>
            <span>Construir Jazida de Sílica & Areia ($30.000)</span>
          </button>
        </div>
      `;
    } else if (hasIron) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-sky-950/90 to-slate-900/80 p-3.5 rounded-xl border-2 border-sky-600/90 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-slate-900 border border-sky-500/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_iron.png" class="w-full h-full object-contain" onerror="this.outerHTML='⛏️'">
              </div>
              <div>
                <div class="font-bold text-sky-200 text-sm flex items-center gap-1.5">
                  <span>⛏️</span> Instalar Mina de Minério de Ferro
                </div>
                <div class="text-[11px] text-sky-300/80 mt-0.5">Extração Contínua de Ferro Siderúrgico</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$40.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">600 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-sky-800/40 font-mono">
            ⛏️ <strong>Minério de Ferro Bruto:</strong> Minério de alta densidade (hematita e magnetita), essencial para usinas de chapas de aço (<code class="text-sky-300">steel_sheets</code>), vigas estruturais e máquinas pesadas.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_iron')" ${cash < 40000 ? 'disabled' : ''} class="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>⛏️</span>
            <span>Construir Mina de Ferro ($40.000)</span>
          </button>
        </div>
      `;
    } else if (hasBauxite) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-orange-950/90 to-amber-950/80 p-3.5 rounded-xl border-2 border-orange-600/90 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-orange-950 border border-orange-500/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_bauxite.png" class="w-full h-full object-contain" onerror="this.outerHTML='🪨'">
              </div>
              <div>
                <div class="font-bold text-orange-200 text-sm flex items-center gap-1.5">
                  <span>🪨</span> Instalar Mina de Bauxita
                </div>
                <div class="text-[11px] text-orange-300/80 mt-0.5">Extração de Minério de Alumínio</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$42.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">500 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-orange-800/40 font-mono">
            🪨 <strong>Jazida de Bauxita:</strong> Solo laterítico rico em óxido de alumínio (Al₂O₃), refinado em chapas de alumínio estrutural leve (<code class="text-orange-300">aluminum_sheets</code>) para latinhas, eletrônicos e fuselagem.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_bauxite')" ${cash < 42000 ? 'disabled' : ''} class="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🪨</span>
            <span>Construir Mina de Bauxita ($42.000)</span>
          </button>
        </div>
      `;
    } else if (hasChemical) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-teal-950/90 to-cyan-950/80 p-3.5 rounded-xl border-2 border-teal-600/90 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-teal-950 border border-teal-500/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_chemicals.png" class="w-full h-full object-contain" onerror="this.outerHTML='🧪'">
              </div>
              <div>
                <div class="font-bold text-teal-200 text-sm flex items-center gap-1.5">
                  <span>🧪</span> Instalar Depósito de Minerais Químicos
                </div>
                <div class="text-[11px] text-teal-300/80 mt-0.5">Extração & Refino de Sais Minerais</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$38.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">550 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-teal-800/40 font-mono">
            🧪 <strong>Bacia de Sais Químicos:</strong> Minerais e compostos inorgânicos de alta pureza, indispensáveis para remédios, fertilizantes agrícolas, tintas industriais e reagentes poliméricos.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_chemicals')" ${cash < 38000 ? 'disabled' : ''} class="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🧪</span>
            <span>Construir Depósito de Minerais Químicos ($38.000)</span>
          </button>
        </div>
      `;
    } else if (hasOil) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-slate-950/90 to-zinc-950/80 p-3.5 rounded-xl border-2 border-slate-600/90 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-slate-900 border border-slate-500/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_oil.png" class="w-full h-full object-contain" onerror="this.outerHTML='🛢️'">
              </div>
              <div>
                <div class="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <span>🛢️</span> Instalar Campo Petrolífero / Poço
                </div>
                <div class="text-[11px] text-slate-300/80 mt-0.5">Extração Contínua de Petróleo Bruto</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$65.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">700 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800 font-mono">
            🛢️ <strong>Bacia Petrolífera Continental:</strong> Poços e bombas de cavidades em terra firme para extração de óleo cru, alimentando refinarias de plástico (<code class="text-sky-300">plastic</code>) e polímeros industriais.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_oil')" ${cash < 65000 ? 'disabled' : ''} class="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🛢️</span>
            <span>Construir Poço de Petróleo ($65.000)</span>
          </button>
        </div>
      `;
    } else if (hasGold) {
      naturalResourceCard = `
        <div class="bg-gradient-to-r from-yellow-950/90 to-amber-950/80 p-3.5 rounded-xl border-2 border-yellow-500/90 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-yellow-950 border border-yellow-400/80 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_gold.png" class="w-full h-full object-contain" onerror="this.outerHTML='🥇'">
              </div>
              <div>
                <div class="font-bold text-yellow-200 text-sm flex items-center gap-1.5">
                  <span>🥇</span> Instalar Mina de Ouro Nobre
                </div>
                <div class="text-[11px] text-yellow-300/80 mt-0.5">Lavra de Minério Aurífero de Alto Teor</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$90.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">150 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-yellow-800/40 font-mono">
            🥇 <strong>Veio Nobre de Montanha:</strong> Minério de ouro de alta pureza incrustado em rochas profundas, indispensável para alta joalheria de luxo e componentes eletrônicos finos.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_gold')" ${cash < 90000 ? 'disabled' : ''} class="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🥇</span>
            <span>Construir Mina de Ouro Nobre ($90.000)</span>
          </button>
        </div>
      `;
    }

    const standardActionsHtml = `
      <div class="grid grid-cols-1 gap-2">
        <button onclick="openStoreModal(worldGrid[${tile.x}][${tile.y}])" class="bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/80 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 border border-emerald-700/60 p-0.5 flex items-center justify-center shrink-0">
              <img src="assets/lojas/supermarket.png" class="w-full h-full object-contain" onerror="this.outerHTML='🏪'">
            </div>
            <div>
              <div class="font-bold text-emerald-300 flex items-center gap-1 text-xs">Inaugurar Estabelecimento Comercial</div>
              <div class="text-[10px] text-slate-400">Venda no varejo (alimentos, eletrônicos, vestuário, conveniência...)</div>
            </div>
          </div>
          <span class="text-emerald-400 group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="openFactoryModal(worldGrid[${tile.x}][${tile.y}])" class="bg-orange-950/70 hover:bg-orange-900/90 border border-orange-700/80 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 border border-orange-700/60 p-0.5 flex items-center justify-center shrink-0">
              <img src="assets/empresas/factory_default.png" class="w-full h-full object-contain" onerror="this.outerHTML='🏭'">
            </div>
            <div>
              <div class="font-bold text-orange-300 flex items-center gap-1 text-xs">Construir Parque Fabril</div>
              <div class="text-[10px] text-slate-400">Transformação de insumos em produtos acabados de alto valor</div>
            </div>
          </div>
          <span class="text-orange-400 group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="openFarmModal(worldGrid[${tile.x}][${tile.y}])" class="bg-amber-950/70 hover:bg-amber-900/90 border border-amber-700/80 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 border border-amber-700/60 p-0.5 flex items-center justify-center shrink-0">
              <img src="assets/agro/farm_default.png" class="w-full h-full object-contain" onerror="this.outerHTML='🌾'">
            </div>
            <div>
              <div class="font-bold text-amber-300 flex items-center gap-1 text-xs">Iniciar Fazenda / Agropecuária</div>
              <div class="text-[10px] text-slate-400">Cultivo de grãos, café, algodão, cana e criação de gado</div>
            </div>
          </div>
          <span class="text-amber-400 group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="confirmBuildWarehouse(${tile.x}, ${tile.y})" class="bg-sky-950/70 hover:bg-sky-900/90 border border-sky-700/80 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 border border-sky-700/60 p-0.5 flex items-center justify-center shrink-0 text-base">
              🏢
            </div>
            <div>
              <div class="font-bold text-sky-300 flex items-center gap-1 text-xs">Construir Centro de Distribuição & Armazém</div>
              <div class="text-[10px] text-slate-400">Hub logístico: unifica safras de múltiplas fazendas, supre indústrias e estoca insumos</div>
            </div>
          </div>
          <span class="text-sky-400 group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="confirmBuildRDCenter(${tile.x}, ${tile.y})" class="bg-purple-950/70 hover:bg-purple-900/90 border border-purple-700/80 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 border border-purple-700/60 p-0.5 flex items-center justify-center shrink-0 text-base">
              🔬
            </div>
            <div>
              <div class="font-bold text-purple-300 flex items-center gap-1 text-xs">Construir Centro de P&D (Laboratório)</div>
              <div class="text-[10px] text-slate-400">Pesquisa e desenvolvimento tecnológico para superar a qualidade do mercado</div>
            </div>
          </div>
          <span class="text-purple-400 group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>
      </div>
    `;

    const contentPanel = document.getElementById('facility-content-panel');
    if (contentPanel) {
      contentPanel.innerHTML = `
        <div class="space-y-3 font-mono text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300 text-[11px]">
            <div class="flex justify-between"><span>Tráfego Urbano:</span> <strong class="text-amber-400">🚦 ${d.trafficIndex}/100</strong></div>
            <div class="flex justify-between"><span>População Local:</span> <strong class="text-sky-400">👥 ${d.population.toLocaleString()} hab</strong></div>
            <div class="flex justify-between"><span>Custo de Ocupação:</span> <strong class="text-rose-400">-$${d.landRentDaily}/dia</strong></div>
            ${depositName ? `<div class="flex justify-between text-emerald-400 font-bold"><span>Depósito Natural:</span> <span>${hasTimber ? '🪵' : '⛏️'} ${depositName}</span></div>` : ''}
          </div>

          ${hasResource ? `
            <div class="space-y-2">
              <div class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <span>⚡</span> <span>Vocação Natural do Terreno:</span>
              </div>
              ${naturalResourceCard}
              
              <details class="group mt-2">
                <summary class="cursor-pointer text-[10px] text-slate-400 hover:text-slate-200 font-bold py-1.5 px-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between select-none transition">
                  <span class="flex items-center gap-1.5"><span>⚙️</span> Outras opções de zoneamento (desmate / empreendimentos)</span>
                  <span class="group-open:rotate-90 transition text-xs">▸</span>
                </summary>
                <div class="pt-2">
                  ${standardActionsHtml}
                </div>
              </details>
            </div>
          ` : `
            <div class="text-[11px] font-bold text-slate-300">Escolha o empreendimento para inaugurar:</div>
            ${standardActionsHtml}
          `}
        </div>
      `;
    }

    const win = document.getElementById('floating-facility-window');
    if (win) win.classList.remove('hidden');
  },

  renderMinePanel(tile) {
    if (typeof window !== 'undefined' && typeof window.renderMinePanel === 'function' && window.renderMinePanel !== this.renderMinePanel) {
      return window.renderMinePanel(tile);
    }
  },

  renderFarmPanel(tile) {
    if (typeof window !== 'undefined' && typeof window.renderFarmPanel === 'function' && window.renderFarmPanel !== this.renderFarmPanel) {
      return window.renderFarmPanel(tile);
    }
  },

  renderFactoryPanel(tile) {
    if (typeof window !== 'undefined' && typeof window.renderFactoryPanel === 'function' && window.renderFactoryPanel !== this.renderFactoryPanel) {
      return window.renderFactoryPanel(tile);
    }
  },

  renderStorePanel(tile) {
    if (typeof window !== 'undefined' && typeof window.renderStorePanel === 'function' && window.renderStorePanel !== this.renderStorePanel) {
      return window.renderStorePanel(tile);
    }
  },

  renderRDCenterPanel(tile) {
    if (typeof window !== 'undefined' && typeof window.renderRDCenterPanel === 'function' && window.renderRDCenterPanel !== this.renderRDCenterPanel) {
      return window.renderRDCenterPanel(tile);
    }
  },

  renderFacilityFooterActions(tile, extraBtn = '') {
    const actionRow = document.getElementById('facility-action-row');
    if (!actionRow) return;
    if (!tile || (!tile.store && !tile.mine && !tile.farm && !tile.factory && !tile.rdCenter && !tile.warehouse)) {
      actionRow.classList.add('hidden');
      return;
    }

    const val = typeof window.calculateFacilityValue === 'function' ? window.calculateFacilityValue(tile) : { sellValue: 10000, salvageValue: 5000 };
    actionRow.classList.remove('hidden');
    actionRow.innerHTML = `
      ${extraBtn ? `<div class="mb-1">${extraBtn}</div>` : ''}
      <div class="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
        <button onclick="sellFacility(${tile.x}, ${tile.y})" class="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-700/60 text-emerald-300 font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer text-center" title="Ofertar ao mercado / concorrentes (+70% a 80% do valor)">
          🏷️ Vender (+$${val.sellValue.toLocaleString()})
        </button>
        <button onclick="demolishFacility(${tile.x}, ${tile.y})" class="py-2 px-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-rose-800/60 text-rose-300 font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer text-center" title="Demolir edifício e desocupar lote (+40% sucata)">
          🗑️ Demolir (+$${val.salvageValue.toLocaleString()})
        </button>
      </div>
    `;
  },

  toggleRDPatentsExpanded() {
    this.isRDPatentsExpanded = !this.isRDPatentsExpanded;
    if (typeof window !== 'undefined') window.isRDPatentsExpanded = this.isRDPatentsExpanded;
    if (window.activeManagedTile?.rdCenter) {
      this.renderRDCenterPanel(window.activeManagedTile);
    }
  },

  showCustomConfirmModal({
    icon = '🏗️',
    title = 'Confirmação',
    subtitle = 'Operação Imobiliária',
    description = '',
    details = [],
    confirmText = 'Confirmar',
    confirmTheme = 'purple',
    onConfirm = null
  }) {
    this.pendingConfirmCallback = onConfirm;
    const iconEl = document.getElementById('confirm-modal-icon');
    if (iconEl) iconEl.textContent = icon;
    
    const titleEl = document.getElementById('confirm-modal-title');
    if (titleEl) titleEl.textContent = title;

    const subEl = document.getElementById('confirm-modal-subtitle');
    if (subEl) subEl.textContent = subtitle;

    const descEl = document.getElementById('confirm-modal-description');
    if (descEl) descEl.innerHTML = description;

    const detailsEl = document.getElementById('confirm-modal-details-grid');
    if (detailsEl) {
      if (details.length > 0) {
        detailsEl.innerHTML = details.map(d => `
          <div class="flex items-center justify-between">
            <span class="text-slate-400">${d.label}:</span>
            <strong class="${d.color || 'text-slate-200'}">${d.value}</strong>
          </div>
        `).join('');
        detailsEl.classList.remove('hidden');
      } else {
        detailsEl.classList.add('hidden');
      }
    }

    const btn = document.getElementById('confirm-modal-action-btn');
    if (btn) {
      btn.innerHTML = `<span>${confirmText}</span>`;
      const themeClasses = {
        purple: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/40 shadow-purple-900/40',
        emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-900/40',
        rose: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400/40 shadow-rose-900/40',
        sky: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/40 shadow-sky-900/40',
        amber: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/40 shadow-amber-900/40'
      };
      btn.className = `px-4 py-2 rounded-xl text-xs font-bold border shadow-lg cursor-pointer transition flex items-center gap-1.5 ${themeClasses[confirmTheme] || themeClasses.purple}`;
    }

    const iconBadge = document.getElementById('confirm-modal-icon-badge');
    if (iconBadge) {
      const badgeClasses = {
        purple: 'bg-purple-950/80 border-purple-600/60',
        emerald: 'bg-emerald-950/80 border-emerald-600/60',
        rose: 'bg-rose-950/80 border-rose-600/60',
        sky: 'bg-sky-950/80 border-sky-600/60',
        amber: 'bg-amber-950/80 border-amber-600/60'
      };
      iconBadge.className = `w-9 h-9 rounded-xl border flex items-center justify-center text-lg shadow-inner ${badgeClasses[confirmTheme] || badgeClasses.purple}`;
    }

    const modal = document.getElementById('custom-confirm-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeCustomConfirmModal(cancelled = true) {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) modal.classList.add('hidden');
    if (cancelled) this.pendingConfirmCallback = null;
  },

  executeCustomConfirmModal() {
    const cb = this.pendingConfirmCallback;
    this.closeCustomConfirmModal(false);
    if (typeof cb === 'function') {
      cb();
    }
  },

  checkWorkingCapitalSafety(cost, onProceed, buildingName = 'este empreendimento') {
    const cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);
    const remainingCash = cash - cost;
    const isHighRatio = cost > (cash * 0.70);
    const isLowReserves = remainingCash < 15000;

    if (isHighRatio || isLowReserves) {
      this.showCustomConfirmModal({
        icon: '⚠️',
        title: 'Alerta de Iluquidez: Capital de Giro Baixo!',
        subtitle: 'Gestão Financeira & Prevenção de Falência',
        description: `Construir <strong>${buildingName}</strong> consumirá <strong>$${cost.toLocaleString('en-US')}</strong> e deixará você com apenas <strong>$${remainingCash.toLocaleString('en-US')}</strong> em caixa.<br><br>🚨 <strong>Atenção aos Custos Fixos:</strong> No <em>OIKONOMIA</em>, lojas e indústrias exigem capital de giro para <strong>comprar estoque inicial</strong> e cobrir <strong>salários e aluguel diários</strong>. Sem caixa, a empresa entrará em cheque especial (3,5% a.m.) e poderá falir rapidamente!`,
        details: [
          { label: 'Custo do Investimento', value: `-$${cost.toLocaleString('en-US')}`, color: 'text-rose-400 font-bold' },
          { label: 'Saldo Restante Pós-Obra', value: `$${remainingCash.toLocaleString('en-US')}`, color: remainingCash < 5000 ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold' },
          { label: 'Reserva Segura Mínima', value: '$15,000', color: 'text-emerald-400 font-bold' }
        ],
        confirmText: 'Continuar Mesmo Assim',
        confirmTheme: 'amber',
        onConfirm: () => {
          onProceed();
        }
      });
      return false;
    }

    onProceed();
    return true;
  },

  confirmBuildRDCenter(x, y) {
    const worldGrid = window.worldGrid;
    const tile = worldGrid && worldGrid[x] && worldGrid[x][y];
    if (!tile || tile.isWater || tile.isRoad || tile.store || tile.mine || tile.farm || tile.factory || tile.rdCenter || tile.warehouse) return;

    const cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);
    const cost = 80000;

    if (cash < cost) {
      this.showCustomConfirmModal({
        icon: '❌',
        title: 'Saldo Insuficiente',
        subtitle: 'Centro de P&D (Laboratório)',
        description: `Seu saldo em caixa é insuficiente para bancar a obra civil deste empreendimento. Você precisa de <strong>$${cost.toLocaleString('en-US')}</strong>.`,
        details: [
          { label: 'Custo de Obra', value: `-$${cost.toLocaleString('en-US')}`, color: 'text-rose-400 font-bold' },
          { label: 'Seu Caixa Atual', value: `$${cash.toLocaleString('en-US')}`, color: 'text-amber-400 font-bold' },
          { label: 'Déficit', value: `-$${(cost - cash).toLocaleString('en-US')}`, color: 'text-rose-500 font-bold' }
        ],
        confirmText: 'Entendido',
        confirmTheme: 'rose',
        onConfirm: null
      });
      return;
    }

    const d = tile.district || { name: 'Distrito Industrial', landRentDaily: 10 };
    const cityName = tile.city ? (tile.city.cityName || tile.city.name || 'Nova Atenas') : 'Nova Atenas';
    const dailyRent = Math.round(d.landRentDaily * 1.2);
    const remainingCash = cash - cost;
    const isLowReserves = remainingCash < 15000 || cost > (cash * 0.70);
    const day = typeof window.day !== 'undefined' ? window.day : 1;
    const month = typeof window.month !== 'undefined' ? window.month : 1;
    const year = typeof window.year !== 'undefined' ? window.year : 2026;

    this.showCustomConfirmModal({
      icon: '🔬',
      title: 'Inaugurar Centro de P&D',
      subtitle: `Local: ${d.name} (${x}, ${y}) · ${cityName}`,
      description: `Deseja autorizar o investimento para construção de um <strong>Laboratório Central de Pesquisa & Desenvolvimento</strong> neste lote?${isLowReserves ? '<br><br><span class="text-amber-300 font-bold">⚠️ Alerta de Iluquidez:</span> Restarão menos de $15.000 em caixa para cobrir salários e despesas operacionais!' : ''}`,
      details: [
        { label: 'Custo de Obra (Capex)', value: `-$${cost.toLocaleString('en-US')}`, color: 'text-rose-400 font-bold' },
        { label: 'Aluguel do Solo', value: `-$${dailyRent}/dia`, color: 'text-amber-400' },
        { label: 'Saldo de Caixa Após', value: `$${remainingCash.toLocaleString('en-US')}`, color: isLowReserves ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold' }
      ],
      confirmText: `✅ Autorizar Obra (-$${cost.toLocaleString('en-US')})`,
      confirmTheme: isLowReserves ? 'amber' : 'purple',
      onConfirm: () => {
        if (typeof window.cash !== 'undefined') window.cash -= cost;
        else if (window.GameState) window.GameState.cash -= cost;

        tile.rdCenter = {
          name: `Centro de P&D ${cityName}`,
          level: 1,
          dailyRent: dailyRent,
          constructionCost: cost,
          builtAt: { day, month, year }
        };
        tile.buildingHeight = 24;
        if (typeof window._indexTile === 'function') window._indexTile(tile);

        if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
        if (typeof window.addGameLog === 'function') {
          window.addGameLog(`🔬 Centro de P&D inaugurado em ${cityName}! (-$${cost.toLocaleString('en-US')})`, 'text-purple-400 font-bold');
        }

        if (typeof window !== 'undefined') window.activeManagedTile = tile;
        FacilityPanel.renderFacilityPanel(tile);
        const win = document.getElementById('floating-facility-window');
        if (win) win.classList.remove('hidden');

        FacilityPanel.renderTileInspector(tile);
        if (typeof window.scheduleRender === 'function') window.scheduleRender();
        if (typeof window.updateUI === 'function') window.updateUI();
      }
    });
  },

  openFacilityConfirmModal({ icon, title, subtitle, name, detailsHtml, confirmText, confirmClass, onConfirm }) {
    const modal = document.getElementById('confirm-facility-modal');
    const iconBox = document.getElementById('fac-confirm-icon-box');
    const titleEl = document.getElementById('fac-confirm-title');
    const subEl = document.getElementById('fac-confirm-subtitle');
    const nameEl = document.getElementById('fac-confirm-name');
    const detailsEl = document.getElementById('fac-confirm-details');
    const btnExec = document.getElementById('fac-confirm-btn-execute');

    if (iconBox) iconBox.innerHTML = icon || '🗑️';
    if (titleEl) titleEl.textContent = title;
    if (subEl && subtitle) subEl.innerHTML = subtitle;
    if (nameEl) nameEl.textContent = name;
    if (detailsEl) detailsEl.innerHTML = detailsHtml;

    if (btnExec) {
      btnExec.textContent = confirmText || 'Confirmar';
      btnExec.className = `py-3 rounded-xl font-bold text-white transition text-center shadow-lg cursor-pointer ${confirmClass || 'bg-rose-600 hover:bg-rose-500'}`;
      btnExec.onclick = () => {
        this.closeFacilityConfirmModal();
        if (typeof onConfirm === 'function') onConfirm();
      };
    }

    this.pendingFacilityAction = onConfirm;
    if (modal) modal.classList.remove('hidden');
  },

  closeFacilityConfirmModal() {
    const modal = document.getElementById('confirm-facility-modal');
    if (modal) modal.classList.add('hidden');
    this.pendingFacilityAction = null;
  }
};

// Global bindings for inline HTML event handlers
if (typeof window !== 'undefined') {
  window.FacilityPanel = FacilityPanel;
  window.openFloatingFacilityWindow = FacilityPanel.openFloatingFacilityWindow.bind(FacilityPanel);
  window.closeFloatingFacilityWindow = FacilityPanel.closeFloatingFacilityWindow.bind(FacilityPanel);
  window.renderFacilityPanel = FacilityPanel.renderFacilityPanel.bind(FacilityPanel);
  window.renderTileInspector = FacilityPanel.renderTileInspector.bind(FacilityPanel);
  window.renderIdlePanel = FacilityPanel.renderIdlePanel.bind(FacilityPanel);
  window.renderEmptyLotPanel = FacilityPanel.renderEmptyLotPanel.bind(FacilityPanel);
  window.renderFacilityFooterActions = FacilityPanel.renderFacilityFooterActions.bind(FacilityPanel);
  window.toggleRDPatentsExpanded = FacilityPanel.toggleRDPatentsExpanded.bind(FacilityPanel);
  window.showCustomConfirmModal = FacilityPanel.showCustomConfirmModal.bind(FacilityPanel);
  window.closeCustomConfirmModal = FacilityPanel.closeCustomConfirmModal.bind(FacilityPanel);
  window.executeCustomConfirmModal = FacilityPanel.executeCustomConfirmModal.bind(FacilityPanel);
  window.checkWorkingCapitalSafety = FacilityPanel.checkWorkingCapitalSafety.bind(FacilityPanel);
  window.confirmBuildRDCenter = FacilityPanel.confirmBuildRDCenter.bind(FacilityPanel);
  window.openFacilityConfirmModal = FacilityPanel.openFacilityConfirmModal.bind(FacilityPanel);
  window.closeFacilityConfirmModal = FacilityPanel.closeFacilityConfirmModal.bind(FacilityPanel);
}

export default FacilityPanel;
