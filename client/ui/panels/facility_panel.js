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
    const rawD = tile.district || {};
    const d = {
      name: rawD.name || 'Distrito Central',
      landRentDaily: rawD.landRentDaily != null ? rawD.landRentDaily : 10,
      trafficIndex: rawD.trafficIndex != null ? rawD.trafficIndex : 50,
      population: rawD.population != null ? rawD.population : 5000
    };
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
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-amber-500/40 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-amber-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_timber.png" class="w-full h-full object-contain" onerror="this.outerHTML='🪵'">
              </div>
              <div>
                <div class="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <span>🪵</span> Instalar Serraria & Silvicultura
                </div>
                <div class="text-[11px] text-amber-400/80 mt-0.5">Manejo & Extração de Madeira / Toras</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$28.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">650 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            🌲 <strong>Reserva Florestal:</strong> Extraia toras nativas brutas para abastecer indústrias de chapas estruturais (<code class="text-amber-300">lumber</code>), celulose/papel e marcenarias de móveis nobres.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_timber')" ${cash < 28000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🪵</span>
            <span>Construir Serraria & Silvicultura ($28.000)</span>
          </button>
        </div>
      `;
    } else if (hasSilica) {
      naturalResourceCard = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-stone-500/40 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-stone-400/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_silica.png" class="w-full h-full object-contain" onerror="this.outerHTML='🏖️'">
              </div>
              <div>
                <div class="font-bold text-stone-200 text-sm flex items-center gap-1.5">
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
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            💎 <strong>Bacia Continental de Quartzo:</strong> Areia de sílica de alta pureza (SiO₂ > 99%), isenta de sal marinho e conchas, essencial para fundição de Vidro Plano (<code class="text-sky-300">glass</code>) e chips semicondutores (<code class="text-sky-300">chips</code>).
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_silica')" ${cash < 30000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🏖️</span>
            <span>Construir Jazida de Sílica & Areia ($30.000)</span>
          </button>
        </div>
      `;
    } else if (hasIron) {
      naturalResourceCard = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-sky-500/40 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-sky-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
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
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            ⛏️ <strong>Minério de Ferro Bruto:</strong> Minério de alta densidade (hematita e magnetita), essencial para usinas de chapas de aço (<code class="text-sky-300">steel_sheets</code>), vigas estruturais e máquinas pesadas.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_iron')" ${cash < 40000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>⛏️</span>
            <span>Construir Mina de Ferro ($40.000)</span>
          </button>
        </div>
      `;
    } else if (hasBauxite) {
      naturalResourceCard = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-orange-500/40 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-orange-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
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
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            🪨 <strong>Jazida de Bauxita:</strong> Solo laterítico rico em óxido de alumínio (Al₂O₃), refinado em chapas de alumínio estrutural leve (<code class="text-orange-300">aluminum_sheets</code>) para latinhas, eletrônicos e fuselagem.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_bauxite')" ${cash < 42000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🪨</span>
            <span>Construir Mina de Bauxita ($42.000)</span>
          </button>
        </div>
      `;
    } else if (hasChemical) {
      naturalResourceCard = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-teal-500/40 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-teal-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
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
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            🧪 <strong>Bacia de Sais Químicos:</strong> Minerais e compostos inorgânicos de alta pureza, indispensáveis para remédios, fertilizantes agrícolas, tintas industriais e reagentes poliméricos.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_chemicals')" ${cash < 38000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🧪</span>
            <span>Construir Depósito de Minerais Químicos ($38.000)</span>
          </button>
        </div>
      `;
    } else if (hasOil) {
      naturalResourceCard = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-slate-600/50 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-slate-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
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
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            🛢️ <strong>Bacia Petrolífera Continental:</strong> Poços e bombas de cavidades em terra firme para extração de óleo cru, alimentando refinarias de plástico (<code class="text-sky-300">plastic</code>) e polímeros industriais.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_oil')" ${cash < 65000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🛢️</span>
            <span>Construir Poço de Petróleo ($65.000)</span>
          </button>
        </div>
      `;
    } else if (hasGold) {
      naturalResourceCard = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-yellow-500/50 space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-[#0d1017] border border-yellow-400/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img src="assets/minas/mine_gold.png" class="w-full h-full object-contain" onerror="this.outerHTML='🥇'">
              </div>
              <div>
                <div class="font-bold text-yellow-300 text-sm flex items-center gap-1.5">
                  <span>🥇</span> Instalar Mina de Ouro Nobre
                </div>
                <div class="text-[11px] text-yellow-400/80 mt-0.5">Lavra de Minério Aurífero de Alto Teor</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-bold text-rose-300">$90.000</div>
              <div class="text-[10px] text-emerald-400 font-bold">150 un/dia</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
            🥇 <strong>Veio Nobre de Montanha:</strong> Minério de ouro de alta pureza incrustado em rochas profundas, indispensável para alta joalheria de luxo e componentes eletrônicos finos.
          </div>
          <button onclick="confirmBuildMineDirect(${tile.x}, ${tile.y}, 'mine_gold')" ${cash < 90000 ? 'disabled' : ''} class="w-full bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>🥇</span>
            <span>Construir Mina de Ouro Nobre ($90.000)</span>
          </button>
        </div>
      `;
    }

    const standardActionsHtml = `
      <div class="grid grid-cols-1 gap-2">
        <button onclick="openStoreModal(worldGrid[${tile.x}][${tile.y}])" class="bg-[#0d1017] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#c9a86a]/40 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#080a0d] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0">
              <img src="assets/lojas/supermarket.png" class="w-full h-full object-contain" onerror="this.outerHTML='🏪'">
            </div>
            <div>
              <div class="font-bold text-slate-200 group-hover:text-[#c9a86a] transition flex items-center gap-1 text-xs">Inaugurar Estabelecimento Comercial</div>
              <div class="text-[10px] text-slate-400">Venda no varejo (alimentos, eletrônicos, vestuário, conveniência...)</div>
            </div>
          </div>
          <span class="text-[#c9a86a] group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="openFactoryModal(worldGrid[${tile.x}][${tile.y}])" class="bg-[#0d1017] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#c9a86a]/40 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#080a0d] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0">
              <img src="assets/empresas/factory_default.png" class="w-full h-full object-contain" onerror="this.outerHTML='🏭'">
            </div>
            <div>
              <div class="font-bold text-slate-200 group-hover:text-[#c9a86a] transition flex items-center gap-1 text-xs">Construir Parque Fabril</div>
              <div class="text-[10px] text-slate-400">Transformação de insumos em produtos acabados de alto valor</div>
            </div>
          </div>
          <span class="text-[#c9a86a] group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="openFarmModal(worldGrid[${tile.x}][${tile.y}])" class="bg-[#0d1017] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#c9a86a]/40 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#080a0d] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0">
              <img src="assets/agro/farm_default.png" class="w-full h-full object-contain" onerror="this.outerHTML='🌾'">
            </div>
            <div>
              <div class="font-bold text-slate-200 group-hover:text-[#c9a86a] transition flex items-center gap-1 text-xs">Iniciar Fazenda / Agropecuária</div>
              <div class="text-[10px] text-slate-400">Cultivo de grãos, café, algodão, cana e criação de gado</div>
            </div>
          </div>
          <span class="text-[#c9a86a] group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="confirmBuildWarehouse(${tile.x}, ${tile.y})" class="bg-[#0d1017] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#c9a86a]/40 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#080a0d] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0 text-base">
              🏢
            </div>
            <div>
              <div class="font-bold text-slate-200 group-hover:text-[#c9a86a] transition flex items-center gap-1 text-xs">Construir Centro de Distribuição & Armazém</div>
              <div class="text-[10px] text-slate-400">Hub logístico: unifica safras de múltiplas fazendas, supre indústrias e estoca insumos</div>
            </div>
          </div>
          <span class="text-[#c9a86a] group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>

        <button onclick="confirmBuildRDCenter(${tile.x}, ${tile.y})" class="bg-[#0d1017] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#c9a86a]/40 p-2.5 rounded-xl text-left flex items-center justify-between group transition cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#080a0d] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0 text-base">
              🔬
            </div>
            <div>
              <div class="font-bold text-slate-200 group-hover:text-[#c9a86a] transition flex items-center gap-1 text-xs">Construir Centro de P&D (Laboratório)</div>
              <div class="text-[10px] text-slate-400">Pesquisa e desenvolvimento tecnológico para superar a qualidade do mercado</div>
            </div>
          </div>
          <span class="text-[#c9a86a] group-hover:translate-x-1 transition font-bold shrink-0 ml-1">➔</span>
        </button>
      </div>
    `;

    const contentPanel = document.getElementById('facility-content-panel');
    if (contentPanel) {
      contentPanel.innerHTML = `
        <div class="space-y-3 font-mono text-xs">
          <div class="bg-[#0b0e14] p-3 rounded-xl border border-white/[0.08] space-y-1.5 text-slate-300 text-[11px]">
            <div class="flex justify-between"><span>Tráfego Urbano:</span> <strong class="text-amber-400">🚦 ${d.trafficIndex}/100</strong></div>
            <div class="flex justify-between"><span>População Local:</span> <strong class="text-sky-400">👥 ${d.population.toLocaleString()} hab</strong></div>
            <div class="flex justify-between"><span>Custo de Ocupação:</span> <strong class="text-rose-400">-$${d.landRentDaily}/dia</strong></div>
            ${depositName ? `<div class="flex justify-between text-[#c9a86a] font-bold"><span>Depósito Natural:</span> <span>${hasTimber ? '🪵' : '⛏️'} ${depositName}</span></div>` : ''}
          </div>

          ${hasResource ? `
            <div class="space-y-2">
              <div class="text-[11px] font-bold text-[#c9a86a] flex items-center gap-1.5">
                <span>⚡</span> <span>Vocação Natural do Terreno:</span>
              </div>
              ${naturalResourceCard}
              
              <details class="group mt-2">
                <summary class="cursor-pointer text-[10px] text-slate-400 hover:text-slate-200 font-bold py-2 px-3 bg-[#0d1017] rounded-lg border border-white/[0.08] flex items-center justify-between select-none transition">
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
    if (!tile || !tile.mine) return;
    const m = tile.mine;
    const res = m.resourceId || '';
    const isTimber = res === 'timber';
    const isSilica = res === 'silica';
    const isOil = res === 'crude_oil';
    const isBauxite = res === 'bauxite';
    const isGold = res === 'gold_ore';
    const isChem = res === 'chemical_minerals';

    const iconEl = document.getElementById('facility-icon');
    const defaultSprite = isTimber ? 'minas/mine_timber' 
      : (isSilica ? 'minas/mine_silica' 
      : (isOil ? 'minas/mine_oil'
      : (isBauxite ? 'minas/mine_bauxite'
      : (isGold ? 'minas/mine_gold'
      : (isChem ? 'minas/mine_chemicals' : 'minas/mine_iron')))));

    const sm = (typeof window !== 'undefined' && window.SpriteManager) ? window.SpriteManager : null;
    const spriteKey = (sm && typeof sm.getMineSpriteKey === 'function') 
      ? sm.getMineSpriteKey(m.mineTypeId || defaultSprite) 
      : defaultSprite;
    const defaultIcon = isTimber ? '🪵' : (isSilica ? '🏖️' : (isOil ? '🛢️' : (isBauxite ? '🪨' : (isGold ? '🥇' : (isChem ? '🧪' : '⛏️')))));
    if (iconEl) iconEl.innerHTML = `<img src="assets/${spriteKey}.png" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='${defaultIcon}'">`;
    
    const title = isTimber ? '🪵 Serraria & Silvicultura Florestal' 
      : (isSilica ? '🏖️ Jazida de Sílica & Quartzo Industrial' 
      : (isOil ? '🛢️ Campo Petrolífero Terrestre'
      : (isBauxite ? '🪨 Mina de Bauxita (Alumínio)'
      : (isGold ? '🥇 Mina de Ouro Nobre'
      : (isChem ? '🧪 Depósito de Minerais Químicos' : m.name)))));

    const distName = tile.district ? tile.district.name : 'Metrópole';
    const subtitle = isTimber 
      ? `${distName} · Unidade de Manejo & Extração Florestal`
      : (isSilica ? `${distName} · Bacia Geológica de Sílica Continental` 
      : (isOil ? `${distName} · Bacia Sedimentar de Óleo Bruto`
      : (isBauxite ? `${distName} · Formação Laterítica de Bauxita`
      : (isGold ? `${distName} · Veio Aurífero de Alta Montanha`
      : (isChem ? `${distName} · Bacia Evaporítica de Sais Minerais`
      : `${distName} · Instalação Extrativista de Recursos`)))));

    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = title;
    const subtitleEl = document.getElementById('facility-subtitle');
    if (subtitleEl) subtitleEl.textContent = subtitle;

    const badge = document.getElementById('facility-rent-badge');
    const landRent = tile.district ? tile.district.landRentDaily : 10;
    const mineDailyOpex = isTimber ? 140 : (isSilica ? 150 : (isOil ? 220 : (isBauxite ? 160 : (isGold ? 350 : (isChem ? 160 : 180)))));
    const totalMineDaily = landRent + mineDailyOpex;
    const opexLabel = isTimber ? 'Manejo $140' : (isSilica ? 'Lavagem $150' : (isOil ? 'Bombeamento $220' : (isBauxite ? 'Lavra $160' : (isGold ? 'Beneficiamento $350' : (isChem ? 'Refino $160' : 'Extração $180')))));
    if (badge) {
      badge.textContent = `-$${totalMineDaily}/dia (Solo $${landRent} + ${opexLabel})`;
      badge.classList.remove('hidden');
    }

    const textClass = isTimber ? 'text-amber-300' : (isSilica ? 'text-stone-200' : (isOil ? 'text-slate-200' : (isBauxite ? 'text-orange-300' : (isGold ? 'text-yellow-300' : (isChem ? 'text-teal-300' : 'text-sky-300')))));
    const storageLabel = isTimber ? 'Pátio de Toras / Madeira' 
      : (isSilica ? 'Silo de Areia de Sílica' 
      : (isOil ? 'Parque de Tanques de Petróleo'
      : (isBauxite ? 'Pátio de Minério de Bauxita'
      : (isGold ? 'Cofre de Minério de Ouro'
      : (isChem ? 'Silos & Reatores Químicos' : 'Armazém de Minério')))));

    const tipText = isTimber
      ? '💡 Fornece toras nativas para serrarias de chapas estruturais (lumber), celulose e marcenarias.'
      : (isSilica 
          ? '💡 Fornece sílica pura (SiO₂ > 99%) para fundição de vidro plano (glass) e fábricas de semicondutores (chips).'
          : (isOil
              ? '💡 Fornece petróleo bruto pesado diretamente para refinarias de plástico sintético e petroquímica.'
              : (isBauxite
                  ? '💡 Fornece bauxita para fornos de laminação de alumínio leve (aluminum_sheets), latinhas e fuselagens.'
                  : (isGold
                      ? '💡 Fornece ouro bruto nobre para alta joalheria de luxo e componentes eletrônicos finos.'
                      : (isChem
                          ? '💡 Fornece sais e compostos para indústrias farmacêuticas, fertilizantes e reagentes industriais.'
                          : '💡 Fornece matérias-primas pesadas diretamente para usinas siderúrgicas e indústria pesada.')))));

    let resEmoji = '⛏️ ';
    if (isTimber) resEmoji = '🪵 ';
    else if (isSilica) resEmoji = '🏖️ ';
    else if (isOil) resEmoji = '🛢️ ';
    else if (isBauxite) resEmoji = '🪨 ';
    else if (isGold) resEmoji = '🥇 ';
    else if (isChem) resEmoji = '🧪 ';

    const contentEl = document.getElementById('facility-content-panel');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="bg-[#0b0e14] p-4 rounded-xl border border-white/[0.08] space-y-3 font-mono text-xs shadow-lg">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span class="font-bold ${textClass} text-sm flex items-center gap-1.5">${resEmoji}<span>${m.resourceName}</span></span>
            <span class="text-[10px] bg-[#c9a86a]/15 text-[#c9a86a] px-2 py-0.5 rounded border border-[#c9a86a]/30 font-bold">QR: ${m.quality}/100</span>
          </div>
          <div class="bg-[#0d1017] p-3 rounded-lg border border-white/[0.06] space-y-1.5 text-slate-300 text-[11px]">
            <div class="flex justify-between"><span>Extração Diária:</span> <strong class="text-emerald-400">${m.dailyYield} un/dia</strong></div>
            <div class="flex justify-between"><span>Custo Unitário:</span> <strong class="text-rose-400">$${m.unitCost.toFixed(2)}/un</strong></div>
            <div class="flex justify-between"><span>${storageLabel}:</span> <strong class="text-slate-100">${m.stock} / ${m.maxCapacity} un</strong></div>
          </div>
          <div class="bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] text-[10px] text-slate-400 leading-relaxed">
            ${tipText}
          </div>
        </div>
      `;
    }
    this.renderFacilityFooterActions(tile);
  },

  renderFarmPanel(tile) {
    if (!tile || !tile.farm) return;
    const farm = tile.farm;
    const iconEl = document.getElementById('facility-icon');
    const sm = (typeof window !== 'undefined' && window.SpriteManager) ? window.SpriteManager : null;
    const spriteKey = (sm && typeof sm.getFarmSpriteKey === 'function') ? sm.getFarmSpriteKey(farm.farmTypeId) : 'agro/farm_wheat';
    if (iconEl) iconEl.innerHTML = `<img src="assets/${spriteKey}.png" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='🌾'">`;
    
    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = farm.name;
    const distName = tile.district ? tile.district.name : 'Metrópole';
    const subtitleEl = document.getElementById('facility-subtitle');
    if (subtitleEl) subtitleEl.textContent = `${distName} · Propriedade Agropecuária`;
    
    const badge = document.getElementById('facility-rent-badge');
    const landRent = tile.district ? tile.district.landRentDaily : 10;
    const totalFarmDaily = landRent + 120;
    if (badge) {
      badge.textContent = `-$${totalFarmDaily}/dia (Solo $${landRent} + Mão de Obra $120)`;
      badge.classList.remove('hidden');
    }

    const isLivestock = ['poultry', 'raw_milk', 'cattle', 'pigs', 'wool'].includes(farm.cropId) || ['farm_poultry', 'farm_dairy', 'farm_cattle', 'farm_pigs', 'farm_sheep', 'poultry'].includes(farm.farmTypeId);
    let feedHtml = '';

    if (isLivestock) {
      const hasFeed = !!(farm.feedConfig && farm.feedConfig.active);
      const effYield = hasFeed ? Math.round(farm.dailyYield * 1.5) : (farm.effectiveYield || farm.dailyYield);
      const effQR = hasFeed ? Math.min(100, (farm.quality || 60) + 15) : (farm.effectiveQuality || farm.quality || 60);
      const feedNeeded = Math.ceil(farm.dailyYield * 0.20);

      let stockMonitorHtml = '';
      if (hasFeed) {
        const isInternal = farm.feedConfig.supplierId?.startsWith('farm_');
        if (isInternal) {
          const parts = farm.feedConfig.supplierId.split('_');
          const fx = Number(parts[1]), fy = Number(parts[2]);
          const grid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : null;
          const feedFarmTile = (grid && grid[fx]) ? grid[fx][fy] : null;
          const supplierStock = feedFarmTile?.farm ? (feedFarmTile.farm.stock || 0) : 0;
          const daysAutonomy = feedNeeded > 0 ? Math.floor(supplierStock / feedNeeded) : 0;

          let autonomyBadge = '';
          let barColor = 'bg-emerald-500';
          let alertMsg = '';

          if (supplierStock < feedNeeded) {
            autonomyBadge = '<span class="text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 font-bold text-[9px] animate-pulse">🔴 Ruptura (0 dias)</span>';
            barColor = 'bg-rose-600';
            alertMsg = '<div class="text-[9px] text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded px-1.5 py-0.5 mt-1 font-bold">⚠ Estoque esgotado! Os animais voltarão ao ritmo básico de pasto sem ração suplementar.</div>';
          } else if (daysAutonomy <= 3) {
            autonomyBadge = `<span class="text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 font-bold text-[9px]">🔴 Risco (${daysAutonomy}d)</span>`;
            barColor = 'bg-rose-500';
            alertMsg = `<div class="text-[9px] text-rose-300 bg-rose-950/30 border border-rose-800/50 rounded px-1.5 py-0.5 mt-1">⚠ Apenas ${daysAutonomy} dias de ração restantes. Amplie o plantio ou conecte outro fornecedor.</div>`;
          } else if (daysAutonomy <= 7) {
            autonomyBadge = `<span class="text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 font-bold text-[9px]">🟡 Atenção (${daysAutonomy}d)</span>`;
            barColor = 'bg-amber-500';
          } else {
            autonomyBadge = `<span class="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-bold text-[9px]">🟢 Seguro (${daysAutonomy}d)</span>`;
            barColor = 'bg-emerald-500';
          }

          const stockPercent = Math.min(100, Math.max(5, Math.round((supplierStock / (feedNeeded * 14)) * 100)));

          stockMonitorHtml = `
            <div class="bg-[#080a0d] p-2.5 rounded-xl border border-white/[0.06] space-y-1.5 mt-2">
              <div class="flex items-center justify-between text-[10px]">
                <span class="text-slate-400 flex items-center gap-1 font-bold">📊 Autonomia de Ração:</span>
                ${autonomyBadge}
              </div>
              <div class="h-1.5 bg-[#0b0e14] rounded-full overflow-hidden border border-white/[0.06]">
                <div class="${barColor} h-full rounded-full transition-all duration-300" style="width:${stockPercent}%"></div>
              </div>
              <div class="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span>Consumo: <strong class="text-amber-300">${feedNeeded} un/dia</strong></span>
                <span>Estoque no Silo: <strong class="${supplierStock < feedNeeded ? 'text-rose-400 font-bold' : 'text-slate-200'}">${supplierStock.toLocaleString()} un</strong></span>
              </div>
              ${alertMsg}
            </div>
          `;
        } else if (farm.feedConfig.supplierId?.startsWith('port_') || farm.feedConfig.supplierId?.startsWith('primary_') || farm.feedConfig.supplierId?.startsWith('port')) {
          const feedDailyCost = feedNeeded * (farm.feedConfig.landedCost || 0.60);
          stockMonitorHtml = `
            <div class="bg-[#080a0d] p-2.5 rounded-xl border border-white/[0.06] space-y-1 mt-2 text-[10px]">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-bold">Origem: Importação Portuária</span>
                <span class="text-[#c9a86a] bg-[#c9a86a]/15 px-2 py-0.5 rounded border border-[#c9a86a]/30 font-bold text-[9px]">🚢 Abastecimento Contínuo</span>
              </div>
              <div class="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span>Consumo: <strong class="text-amber-300">${feedNeeded} un/dia</strong></span>
                <span>Custo Diário: <strong class="text-emerald-400 font-bold">-$${feedDailyCost.toFixed(2)}/dia</strong></span>
              </div>
            </div>
          `;
        }
      }

      feedHtml = `
        <div class="bg-[#0d1017] p-3 rounded-xl border ${hasFeed ? 'border-[#c9a86a]/40 bg-[#c9a86a]/5' : 'border-white/[0.06]'} space-y-2 font-mono mt-3">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-bold text-slate-200 flex items-center gap-1.5">
              <span>🌽</span> Nutrição & Ração Pecuária:
            </span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${hasFeed ? 'bg-[#c9a86a]/20 text-[#c9a86a] border border-[#c9a86a]/40' : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'}">
              ${hasFeed ? '⚡ Suplementado (+50% / +15 QR)' : 'Pasto Natural (Básico)'}
            </span>
          </div>

          <div class="text-[10px] text-slate-300 space-y-1">
            ${hasFeed ? `
              <div class="flex items-center justify-between text-slate-300">
                <span>Grão: <strong class="text-amber-300">${farm.feedConfig.grainProdId === 'corn' ? '🌽 Milho Agrícola' : '🌾 Trigo & Cereais'}</strong></span>
                <span>Custo Ração: <strong class="text-emerald-400">$${(farm.feedConfig.landedCost || 0.40).toFixed(2)}/un</strong></span>
              </div>
              <div class="text-[9px] text-slate-400">Fornecedor: <strong class="text-slate-200">${farm.feedConfig.supplierName || 'Fazenda Própria'}</strong></div>
              <div class="text-[9px] text-[#c9a86a] font-bold pt-0.5">🚀 Rendimento: ${effYield} un/dia · Qualidade: QR ${effQR}</div>
              ${stockMonitorHtml}
            ` : `
              <div class="text-[10px] text-slate-400 italic">
                Alimente as criações com Milho ou Trigo para acelerar o rendimento em +50% e elevar a Qualidade (QR).
              </div>
            `}
          </div>

          <div class="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
            <button onclick="openFarmFeedSupplierModal(${tile.x}, ${tile.y})" class="bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition shadow">
              ${hasFeed ? '⚙️ Alterar Ração' : '🌽 Conectar Ração (Milho/Trigo)'}
            </button>
            ${hasFeed ? `
              <button onclick="disconnectFarmFeed(${tile.x}, ${tile.y})" class="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer">Desativar</button>
            ` : ''}
          </div>
        </div>
      `;
    }

    const effDisplayYield = farm.effectiveYield || farm.dailyYield;
    const effDisplayQR = farm.effectiveQuality || farm.quality || 60;

    const contentEl = document.getElementById('facility-content-panel');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="bg-[#0b0e14] p-4 rounded-xl border border-white/[0.08] space-y-3 font-mono text-xs shadow-lg">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span class="font-bold text-[#c9a86a] text-sm">${farm.cropName}</span>
            <span class="text-[10px] bg-[#c9a86a]/15 text-[#c9a86a] px-2 py-0.5 rounded border border-[#c9a86a]/30 font-bold">QR: ${effDisplayQR}/100</span>
          </div>
          <div class="bg-[#0d1017] p-3 rounded-lg border border-white/[0.06] space-y-1.5 text-slate-300 text-[11px]">
            <div class="flex justify-between"><span>Produção Diária:</span> <span><strong class="text-emerald-400">${effDisplayYield} un/dia</strong> ${effDisplayYield > farm.dailyYield ? '<span class="text-[9px] text-[#c9a86a] font-bold">(+50% Ração)</span>' : ''}</span></div>
            <div class="flex justify-between"><span>Custo Operacional:</span> <strong class="text-rose-400">$${farm.dailyOperatingCost.toFixed(2)}/un</strong></div>
            <div class="flex justify-between"><span>Silo / Estoque:</span> <strong class="text-slate-100">${farm.stock} / ${farm.maxCapacity} un</strong></div>
          </div>
          ${feedHtml}
          <div class="bg-[#080a0d] p-2.5 rounded-lg border border-white/[0.04] text-[10px] text-slate-400 mt-2 leading-relaxed">
            💡 Fornece matérias-primas e insumos agropecuários de baixo custo para o varejo e fábricas da corporação.
          </div>
        </div>
      `;
    }
    this.renderFacilityFooterActions(tile);
  },

  renderFactoryPanel(tile) {
    if (!tile || !tile.factory) return;
    const factory = tile.factory;
    const sm = (typeof window !== 'undefined' && window.SpriteManager) ? window.SpriteManager : null;
    const factorySprite = (sm && typeof sm.getFactorySprite === 'function') ? sm.getFactorySprite(factory.lines, factory.customSkin) : 'industrial/factory_default';
    const iconEl = document.getElementById('facility-icon');
    if (iconEl) iconEl.innerHTML = `<img src="assets/${factorySprite}.png" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='🏭'">`;
    
    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = factory.name;
    
    const skinVal = factory.customSkin || 'auto';
    const distName = tile.district ? tile.district.name : 'Distrito Industrial';
    const subtitleEl = document.getElementById('facility-subtitle');
    if (subtitleEl) {
      subtitleEl.innerHTML = `
        <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span>${distName} · Complexo Fabril</span>
          <span class="text-slate-600">•</span>
          <span class="text-[10px] text-[#c9a86a] font-medium">🎨 Fachada:</span>
          <select onchange="setFactoryFacade(${tile.x}, ${tile.y}, this.value)" class="bg-[#0b0e14] text-slate-200 border border-white/[0.12] hover:border-[#c9a86a] rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-[#c9a86a] cursor-pointer shadow-sm">
            <option value="auto" ${skinVal === 'auto' ? 'selected' : ''}>⚙️ Automática (Por Produção)</option>
            <option value="food_processing" ${skinVal === 'food_processing' ? 'selected' : ''}>🥫 Alimentos & Frigorífico</option>
            <option value="steel_mill" ${skinVal === 'steel_mill' ? 'selected' : ''}>⚙️ Siderúrgica & Metais</option>
            <option value="electronics_factory" ${skinVal === 'electronics_factory' ? 'selected' : ''}>💻 Chips & Eletrônicos</option>
            <option value="auto_plant" ${skinVal === 'auto_plant' ? 'selected' : ''}>🚗 Montadora de Veículos</option>
            <option value="textile_mill" ${skinVal === 'textile_mill' ? 'selected' : ''}>🧵 Indústria Têxtil</option>
            <option value="refinery" ${skinVal === 'refinery' ? 'selected' : ''}>🛢️ Refinaria Petroquímica</option>
            <option value="factory_default" ${skinVal === 'factory_default' ? 'selected' : ''}>📦 Galpão Geral</option>
          </select>
        </div>
      `;
    }
    const badge = document.getElementById('facility-rent-badge');
    const landRent = tile.district ? tile.district.landRentDaily : 10;
    const linesCount = factory.lines ? Object.keys(factory.lines).length : 0;
    const factoryWages = linesCount * 200;
    const totalFactoryDaily = landRent + factoryWages;
    if (badge) {
      badge.textContent = `-$${totalFactoryDaily}/dia (Solo $${landRent} + $${factoryWages} Linhas)`;
      badge.classList.remove('hidden');
    }

    const panel = document.getElementById('facility-content-panel');
    if (!panel) return;
    panel.innerHTML = '';

    const lines = Object.entries(factory.lines || {});
    if (lines.length === 0) {
      panel.innerHTML = `<p class="text-xs text-slate-500 font-mono text-center py-6">Nenhuma linha de produção ativa. Ative uma linha abaixo.</p>`;
    } else {
      const labs = (typeof window !== 'undefined' && window.rdLabs) ? window.rdLabs : {};
      const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};
      const recipes = (typeof window !== 'undefined' && window.FACTORY_RECIPES) ? window.FACTORY_RECIPES : [];
      const math = (typeof window !== 'undefined' && window.CoreMath) ? window.CoreMath : null;

      for (const [recipeId, line] of lines) {
        const rdProj = Object.values(labs).find(p => p.productId === line.outputProductId);
        const techLvl = (math && typeof math.getTechLevelLabel === 'function') ? math.getTechLevelLabel(line.outputQuality || 60) : { level: 1, label: 'Padrão', icon: '🥉', color: 'text-slate-300 border-white/[0.08] bg-white/[0.04]' };
        const rdBadge = rdProj
          ? `<button onclick="openRDCenterModal()" class="text-[9px] bg-[#c9a86a]/15 text-[#c9a86a] px-1.5 py-0.5 rounded border border-[#c9a86a]/30 font-mono ml-1 hover:bg-[#c9a86a]/25 cursor-pointer" title="P&D: ${rdProj.status === 'completed' ? 'Concluído' : 'Pesquisando'} QR ${rdProj.targetQR} (Atual: ${rdProj.currentQR.toFixed(1)})">🔬 P&D: ${rdProj.currentQR.toFixed(0)}</button>`
          : '';

        const rec = recipes.find(r => r.id === line.recipeId);
        line.inputsConfig = line.inputsConfig || {};

        let inputsHtml = '';
        if (rec && rec.inputs && Object.keys(rec.inputs).length > 0) {
          const items = Object.entries(rec.inputs).map(([inpId, qty]) => {
            if (!line.inputsConfig[inpId] && typeof window.getDefaultSupplierForInput === 'function') {
              line.inputsConfig[inpId] = window.getDefaultSupplierForInput(inpId, tile);
            }
            const cfg = line.inputsConfig[inpId] || {};
            const inpProd = catalog[inpId] || { name: inpId };
            const isInternal = cfg.supplierId?.startsWith('farm_') || cfg.supplierId?.startsWith('mine_') || cfg.supplierId?.startsWith('factory_');

            return `
              <div class="bg-[#0d1017] p-1.5 rounded-lg border ${isInternal ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/[0.06]'} flex items-center justify-between gap-1.5 text-[10px]">
                <div class="truncate max-w-[170px]">
                  <span class="${isInternal ? 'text-amber-400 font-bold' : 'text-slate-300 font-bold'}">${qty}x ${inpProd.name}</span>
                  <span class="text-[9px] text-slate-400 block truncate">Origem: <strong class="${isInternal ? 'text-amber-300' : 'text-[#c9a86a]'}">${isInternal ? '🏛️ Própria' : '🚢 Porto'}: ${cfg.supplierName ? cfg.supplierName.split('(')[0].trim() : 'Porto'}</strong> (QR ${cfg.quality || 50})</span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-[9px] text-emerald-400 font-bold">$${cfg.landedCost ? cfg.landedCost.toFixed(2) : '0.00'}</span>
                  <button onclick="openFactoryInputSupplierModal(${tile.x}, ${tile.y}, '${recipeId}', '${inpId}')" class="bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/[0.08] cursor-pointer">Trocar</button>
                </div>
              </div>
            `;
          }).join('');

          inputsHtml = `
            <div class="pt-1.5 border-t border-white/[0.06] space-y-1">
              <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Matérias-Primas & Fornecedores:</div>
              ${items}
            </div>
          `;
        }

        const card = document.createElement('div');
        card.className = 'bg-[#0b0e14] p-3 rounded-xl border border-white/[0.08] space-y-2 font-mono text-xs shadow-md';
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
            <div class="flex items-center flex-wrap gap-1">
              <span class="font-bold text-[#c9a86a]">${line.recipeName}</span>
              <button onclick="openEncyclopediaModal('products', '${line.outputProductId}')" class="text-[9px] bg-white/[0.04] text-slate-300 px-1 py-0.2 rounded border border-white/[0.08] font-mono hover:bg-white/[0.08] cursor-pointer" title="Ver na Enciclopédia">📖 Wiki</button>
              <span class="text-[9px] bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded">${catalog[line.outputProductId]?.category || 'Insumo'}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded border font-bold ${techLvl.color}">${techLvl.icon} Lvl ${techLvl.level}</span>
              ${rdBadge}
            </div>
            <button onclick="removeFactoryLine(${tile.x}, ${tile.y}, '${recipeId}')" class="text-slate-500 hover:text-rose-400 font-mono text-sm px-1 cursor-pointer">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-[#0d1017] p-2 rounded-lg border border-white/[0.04]">
            <div>Custo Unitário: <strong class="text-emerald-400">$${line.unitCost.toFixed(2)}/un</strong></div>
            <div>Qualidade (QR): <strong class="text-cyan-300">${line.outputQuality}/100</strong></div>
            <div>Capacidade: <strong class="text-slate-100">${line.dailyCapacity} un/dia</strong></div>
            <div>Estoque Fabril: <strong class="text-amber-400">${line.finishedStock} un</strong></div>
          </div>
          ${inputsHtml}
        `;
        panel.appendChild(card);
      }
    }

    const freeLines = (factory.maxLines || 4) - lines.length;
    let extraBtn = '';
    if (freeLines > 0) {
      extraBtn = `
        <button onclick="openFactoryRecipeModal(${tile.x}, ${tile.y})"
          class="w-full text-center text-xs font-bold text-[#080a0d] bg-[#c9a86a] hover:bg-[#d8b779] font-mono py-2 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1">
          <span>➕ Ativar Linha de Produção</span>
          <span class="text-[10px] opacity-80">(${freeLines} livre${freeLines > 1 ? 's' : ''})</span>
        </button>
      `;
    }
    this.renderFacilityFooterActions(tile, extraBtn);
  },

  setFactoryFacade(x, y, skin) {
    const grid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : null;
    const tile = grid && grid[x] && grid[x][y];
    if (tile && tile.factory) {
      tile.factory.customSkin = skin;
      this.renderFactoryPanel(tile);
      if (typeof window !== 'undefined' && typeof window.renderMap === 'function') window.renderMap();
      if (typeof window !== 'undefined' && typeof window.addGameLog === 'function') {
        window.addGameLog(`🎨 Fachada da ${tile.factory.name} alterada para: ${skin === 'auto' ? 'Automática por Produção' : skin}`, 'text-amber-300');
      }
    }
  },

  renderStorePanel(tile) {
    if (!tile || !tile.store) return;
    const store = tile.store;
    const d = tile.district || { landRentDaily: 10, population: 50000, trafficIndex: 50 };

    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = store.name;
    const subtitleEl = document.getElementById('facility-subtitle');
    if (subtitleEl) subtitleEl.textContent = `${d?.name || 'Comércio'} · Lote (${tile.x}, ${tile.y})`;

    const iconEl = document.getElementById('facility-icon');
    if (iconEl) iconEl.innerHTML = `<img src="assets/lojas/${store.storeTypeId}.png" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='🏪'">`;
    const badge = document.getElementById('facility-rent-badge');
    const shelvesCount = Object.keys(store.shelves || {}).length;
    const clerkCost = shelvesCount * 40;
    const totalStoreDaily = (store.dailyRent || d.landRentDaily) + clerkCost;
    if (badge) {
      badge.textContent = `-$${totalStoreDaily.toFixed(0)}/dia (Solo $${(store.dailyRent || d.landRentDaily).toFixed(0)} + $${clerkCost} Equipe)`;
      badge.classList.remove('hidden');
    }

    const panel = document.getElementById('facility-content-panel');
    if (!panel) return;
    panel.innerHTML = '';

    const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};
    const labs = (typeof window !== 'undefined' && window.rdLabs) ? window.rdLabs : {};
    const brandRating = (typeof window !== 'undefined' && window.playerBrandRating) ? window.playerBrandRating : {};
    const math = (typeof window !== 'undefined' && window.CoreMath) ? window.CoreMath : null;
    const macroCycle = (typeof window !== 'undefined' && window.MacroCycleSystem) ? window.MacroCycleSystem : null;
    const yr = (typeof window !== 'undefined' && typeof window.year === 'number') ? window.year : 1;

    for (const [prodId, shelf] of Object.entries(store.shelves || {})) {
      const prod = catalog[prodId];
      if (!prod) continue;

      const rdProj = Object.values(labs).find(p => p.productId === prodId);
      const rdBadge = rdProj
        ? `<button onclick="openRDCenterModal()" class="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 font-mono hover:bg-purple-900 cursor-pointer" title="P&D: ${rdProj.status === 'completed' ? 'Concluído' : 'Pesquisando'} QR ${rdProj.targetQR} (Atual: ${rdProj.currentQR.toFixed(1)})">🔬 P&D: ${rdProj.currentQR.toFixed(0)}</button>`
        : '';

      const brand = brandRating[prodId] || 20;
      const elast = (math && typeof math.calculatePriceElasticityFactor === 'function') 
        ? math.calculatePriceElasticityFactor(prod.necessityIndex, prod.standardPrice, shelf.price, shelf.quality)
        : 1;
      const rawDailySales = d.population * prod.perCapitaDailyDemand * (d.trafficIndex / 100) * 0.45 * elast;
      const estSales = Math.max(0.05, rawDailySales);
      const daysCover = Math.floor(shelf.stock / estSales);
      const capitalTied = Math.round(shelf.stock * (shelf.landedCost || prod.baseCost));
      const stockPct = Math.round((shelf.stock / shelf.maxCapacity) * 100);
      const markupPct = Math.round(((shelf.price - shelf.landedCost) / shelf.landedCost) * 100);
      const isStockout = shelf.stock < 15;

      const coverBadge = isStockout
        ? '<span class="text-rose-400 font-bold bg-rose-950/80 px-1 py-0.2 rounded border border-rose-800 text-[8px]">🔴 Ruptura</span>'
        : (daysCover <= 2
          ? `<span class="text-rose-300 font-bold bg-rose-950/80 px-1 py-0.2 rounded border border-rose-800 text-[8px]">🔴 ${daysCover}d (Risco)</span>`
          : (daysCover <= 5
            ? `<span class="text-amber-300 font-bold bg-amber-950/80 px-1 py-0.2 rounded border border-amber-800 text-[8px]">🟡 ${daysCover}d</span>`
            : `<span class="text-emerald-400 font-bold bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800 text-[8px]">🟢 ${daysCover}d</span>`));

      const isWarehouse = !!shelf.supplierId?.startsWith('warehouse_');
      const isInternalFacility = !!(shelf.supplierId?.startsWith('factory_') || shelf.supplierId?.startsWith('farm_') || shelf.supplierId?.startsWith('mine_'));
      const isInternal = isInternalFacility || isWarehouse;
      const macroWholesaleMult = macroCycle ? macroCycle.getWholesaleCostMultiplier(yr) : 1.0;
      const effectiveUnitCost = (shelf.landedCost || prod.baseCost || 1) * (isInternal ? 1.0 : macroWholesaleMult);
      const costFill = Math.round((shelf.maxCapacity - shelf.stock) * effectiveUnitCost);

      const profile = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile : null;
      const compName = profile?.companyName || 'Holding';

      let supplierDisplay = '';
      if (isWarehouse) {
        supplierDisplay = `<span class="text-emerald-400 font-bold">🏢 [${compName}] Armazém Central (${shelf.supplierName ? shelf.supplierName.split('(')[0].trim() : 'CD'})</span>`;
      } else if (isInternalFacility) {
        supplierDisplay = `<span class="text-amber-400 font-bold">🏛️ [${compName}] ${shelf.supplierName ? shelf.supplierName.split('(')[0].trim() : 'Produção Própria'}</span>`;
      } else {
        supplierDisplay = `<span class="text-sky-300">🚢 Porto: ${shelf.supplierName ? shelf.supplierName.split('(')[0].trim() : 'Porto'}</span>`;
      }

      const card = document.createElement('div');
      card.className = `rounded-xl border ${isStockout ? 'border-rose-500/60 shadow-rose-950/20' : 'border-white/[0.08]'} bg-[#0b0e14] p-3 space-y-2.5 shadow-md font-mono`;
      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-bold text-slate-100">${prod.name}</span>
            <button onclick="openEncyclopediaModal('products', '${prodId}')" class="text-[9px] bg-white/[0.04] text-slate-300 px-1.5 py-0.2 rounded border border-white/[0.08] hover:bg-white/[0.08] cursor-pointer" title="Ver na Enciclopédia">📖 Wiki</button>
            <span class="text-[9px] bg-[#c9a86a]/15 text-[#c9a86a] px-1.5 py-0.5 rounded border border-[#c9a86a]/30 font-bold">QR: ${shelf.quality}</span>
            <span class="text-[9px] bg-white/[0.04] text-slate-300 px-1.5 py-0.5 rounded border border-white/[0.08]">⭐ Marca: ${brand}</span>
            ${rdBadge}
          </div>
          <button onclick="removeProductFromStore(${tile.x}, ${tile.y}, '${prodId}')" class="text-[10px] text-slate-500 hover:text-rose-400 font-mono px-1 cursor-pointer">✕</button>
        </div>

        <div class="bg-[#0d1017] p-2 rounded-lg text-[10px] font-mono flex items-center justify-between border ${isInternal ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/[0.06]'}">
          <div class="truncate max-w-[210px]">
            ${supplierDisplay}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400">${isInternal ? 'Frete' : 'Custo'}: <strong class="text-emerald-400 font-bold">$${shelf.landedCost.toFixed(2)}</strong></span>
            <button onclick="openSupplierModal(${tile.x}, ${tile.y}, '${prodId}')" class="bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/[0.08] cursor-pointer">Trocar</button>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
            <span class="${isStockout ? 'text-rose-400 font-bold' : 'text-slate-400'}">Estoque: ${shelf.stock.toLocaleString()} / ${shelf.maxCapacity.toLocaleString()} un</span>
            <span class="${isStockout ? 'text-rose-400 font-bold' : 'text-slate-500'}">${isStockout ? '⚠ BAIXO' : `${stockPct}%`}</span>
          </div>
          <div class="h-1.5 bg-[#080a0d] rounded-full overflow-hidden mb-1.5 border border-white/[0.06]">
            <div class="stock-bar-fill h-full rounded-full ${isStockout ? 'bg-rose-500' : stockPct > 50 ? 'bg-emerald-500' : 'bg-amber-500'}" style="width:${stockPct}%"></div>
          </div>

          <!-- Métricas de Capital de Giro & Cobertura -->
          <div class="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1 mb-1 border-b border-white/[0.06]">
            <span class="flex items-center gap-1">Cobertura: ${coverBadge}</span>
            <span>Imobilizado: <strong class="text-amber-300 font-bold">$${capitalTied.toLocaleString()}</strong></span>
          </div>

          <div class="flex items-center gap-1.5 text-[9px] font-mono flex-wrap">
            <button onclick="buyInstantStock(${tile.x}, ${tile.y}, '${prodId}', 100)" class="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 px-2 py-0.5 rounded border border-white/[0.08] cursor-pointer">+100 un</button>
            <button onclick="buyInstantStock(${tile.x}, ${tile.y}, '${prodId}', ${shelf.maxCapacity - shelf.stock})" class="bg-[#c9a86a]/15 hover:bg-[#c9a86a]/25 text-[#c9a86a] px-2 py-0.5 rounded border border-[#c9a86a]/30 flex items-center gap-1 cursor-pointer" title="Reposição imediata de estoque">
              <span>Encher (-$${costFill.toLocaleString()})</span>
              ${macroWholesaleMult < 1.0 && !isInternal ? '<span class="text-[7px] bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-800 font-bold">-20% Macro</span>' : ''}
            </button>
            <button onclick="openPriceSimulatorModal(${tile.x}, ${tile.y}, '${prodId}')" class="ml-auto text-[#c9a86a] hover:underline font-bold flex items-center gap-0.5 cursor-pointer">📊 Simular 'E se?'</button>
            <button onclick="openMarketingCentralModal()" class="text-amber-400 hover:text-amber-300 font-bold ml-1 cursor-pointer">📢</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-white/[0.06]">
          <div>
            <span class="text-slate-400 block mb-0.5">Preço ($):</span>
            <input type="number" step="0.50" value="${shelf.price.toFixed(2)}"
              onchange="updateShelfPrice(${tile.x}, ${tile.y}, '${prodId}', this.value)"
              class="w-full bg-[#080a0d] border border-white/[0.12] rounded px-2 py-1 text-emerald-400 font-bold text-right focus:outline-none focus:border-[#c9a86a]">
            <span class="text-[9px] ${markupPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}">Margem: ${markupPct > 0 ? '+' : ''}${markupPct}%</span>
          </div>
          <div>
            <span class="text-slate-400 block mb-0.5">Reposição Diária:</span>
            <input type="number" step="10" value="${shelf.dailyRestock}"
              onchange="updateShelfRestock(${tile.x}, ${tile.y}, '${prodId}', this.value)"
              class="w-full bg-[#080a0d] border border-white/[0.12] rounded px-2 py-1 text-slate-200 font-bold text-right focus:outline-none focus:border-[#c9a86a]">
          </div>
        </div>
      `;
      panel.appendChild(card);
    }

    const freeSlots = (store.maxShelves || 4) - Object.keys(store.shelves || {}).length;
    let extraBtn = '';
    if (freeSlots > 0) {
      extraBtn = `
        <button onclick="openAddProductModal(${tile.x}, ${tile.y})"
          class="w-full text-center text-xs font-bold text-[#080a0d] bg-[#c9a86a] hover:bg-[#d8b779] font-mono py-2 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
          <span>➕ Adicionar Produto às Gôndolas</span>
          <span class="text-[10px] opacity-80">(${freeSlots} livre${freeSlots > 1 ? 's' : ''})</span>
        </button>
      `;
    }
    this.renderFacilityFooterActions(tile, extraBtn);
  },

  renderRDCenterPanel(tile) {
    if (!tile || !tile.rdCenter) return;
    const rd = tile.rdCenter;
    const iconEl = document.getElementById('facility-icon');
    if (iconEl) iconEl.innerHTML = `<img src="assets/pesquisa/rd_center.png" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='🔬'">`;
    const titleEl = document.getElementById('facility-title');
    if (titleEl) titleEl.textContent = rd.name;
    const distName = tile.district?.name || 'Metrópole';
    const subtitleEl = document.getElementById('facility-subtitle');
    if (subtitleEl) subtitleEl.textContent = `${distName} · Complexo de P&D (Pesquisa & Inovação)`;
    const badge = document.getElementById('facility-rent-badge');
    const rdRent = rd.dailyRent || (tile.district ? tile.district.landRentDaily : 10);
    const totalRDDaily = rdRent + 150;
    if (badge) {
      badge.textContent = `-$${totalRDDaily}/dia (Solo $${rdRent} + Infra $150)`;
      badge.classList.remove('hidden');
    }

    const labs = (typeof window !== 'undefined' && window.rdLabs) ? window.rdLabs : {};
    const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};
    const rdCats = (typeof window !== 'undefined' && window.RD_CATEGORIES) ? window.RD_CATEGORIES : {};
    const math = (typeof window !== 'undefined' && window.CoreMath) ? window.CoreMath : null;

    const allProjects = Object.values(labs);
    const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'paused');
    const completedProjects = allProjects.filter(p => p.status === 'completed');
    const totalBudget = activeProjects.filter(p => p.status === 'active').reduce((s, p) => s + (p.monthlyBudget || 0), 0);
    const totalCapacity = (typeof window !== 'undefined' && typeof window.getRDTotalLabCapacity === 'function') ? window.getRDTotalLabCapacity() : 4;
    const usedSlots = (typeof window !== 'undefined' && typeof window.getRDUsedLabSlots === 'function') ? window.getRDUsedLabSlots() : 0;
    const freeSlots = Math.max(0, totalCapacity - usedSlots);

    let projectsHtml = '';
    if (activeProjects.length === 0) {
      projectsHtml = `
        <div class="bg-[#0d1017] p-3 rounded-xl border border-dashed border-white/[0.12] text-center space-y-2 font-mono">
          <p class="text-[11px] text-slate-400">Nenhuma bancada em operação no momento.</p>
          <button onclick="openRDNewProjectModal()" class="w-full py-2 rounded-lg bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] font-bold text-xs shadow cursor-pointer transition flex items-center justify-center gap-1.5">
            ➕ Alocar Projeto de Pesquisa (${freeSlots}/${totalCapacity} Bancadas Livres)
          </button>
        </div>
      `;
    } else {
      projectsHtml = activeProjects.map(proj => {
        const prod = catalog[proj.productId];
        const cat = rdCats[proj.category] || {};
        const labsCount = proj.labsCount || 1;
        const minCostSingle = (math && typeof math.calculateRDMonthlyCost === 'function') ? math.calculateRDMonthlyCost(proj.currentQR, prod ? prod.rdBaseCost : 3000) : 3000;
        const minCostTotal = minCostSingle * labsCount;
        const pct = Math.min(100, Math.round(((proj.currentQR - proj.startQR) / Math.max(1, proj.targetQR - proj.startQR)) * 100));

        const isActive = proj.status === 'active';
        const statusBadge = isActive
          ? '<span class="bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700/60 text-[8px] font-bold animate-pulse">🟢 ATIVO</span>'
          : '<span class="bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.08] text-[8px] font-bold">⏸ PAUSADO</span>';

        const gainSingle = (math && typeof math.calculateRDQualityGain === 'function') ? math.calculateRDQualityGain(proj.currentQR, proj.targetQR, (proj.monthlyBudget || minCostTotal) / labsCount, minCostSingle) : 1;
        const gainTotal = gainSingle * labsCount;
        const monthsLeft = gainTotal > 0 ? Math.ceil((proj.targetQR - proj.currentQR) / gainTotal) : '∞';
        const barColor = isActive ? 'bg-gradient-to-r from-amber-500 to-[#c9a86a] shadow-sm shadow-amber-500/30' : 'bg-slate-600';

        return `
          <div class="bg-[#0d1017] border ${isActive ? 'border-[#c9a86a]/40 shadow-md shadow-black/40' : 'border-white/[0.06]'} rounded-xl p-2.5 space-y-2 font-mono text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-sm">${cat.icon || '🔬'}</span>
                <div>
                  <strong class="text-slate-100 text-[11px] block leading-none">${prod ? prod.name : proj.productId}</strong>
                  <span class="text-[9px] text-[#c9a86a]">${labsCount} Lab${labsCount > 1 ? 's' : ''} dedicado${labsCount > 1 ? 's' : ''}</span>
                </div>
              </div>
              ${statusBadge}
            </div>

            <!-- Barra de Progresso do QR -->
            <div>
              <div class="flex justify-between text-[9px] text-slate-400 mb-1">
                <span>QR: <strong class="text-amber-300">${proj.currentQR.toFixed(1)}</strong> → <strong class="text-[#c9a86a]">${proj.targetQR}</strong></span>
                <span class="font-bold text-slate-300">${pct}% (${monthsLeft === '∞' ? '∞' : `~${monthsLeft}m`})</span>
              </div>
              <div class="h-1.5 bg-[#080a0d] rounded-full overflow-hidden border border-white/[0.06]">
                <div class="${barColor} h-full rounded-full transition-all duration-300" style="width:${pct}%"></div>
              </div>
            </div>

            <!-- Resumo Financeiro & Ações Rápidas -->
            <div class="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[9px]">
              <span class="text-emerald-400 font-bold">$${(proj.monthlyBudget || 0).toLocaleString('en-US')}/mês</span>
              <div class="flex items-center gap-1">
                ${isActive ? `<button onclick="pauseRDProject('${proj.id}')" class="px-1.5 py-0.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded border border-white/[0.08] font-bold cursor-pointer" title="Pausar pesquisa">⏸</button>` : ''}
                ${!isActive ? `<button onclick="resumeRDProject('${proj.id}')" class="px-1.5 py-0.5 bg-[#c9a86a]/20 hover:bg-[#c9a86a]/30 text-[#c9a86a] rounded border border-[#c9a86a]/40 font-bold cursor-pointer" title="Retomar pesquisa">▶</button>` : ''}
                <button onclick="adjustRDBudget('${proj.id}')" class="px-1.5 py-0.5 bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 rounded border border-white/[0.08] font-bold cursor-pointer" title="Ajustar verba mensal">💰</button>
                <button onclick="cancelRDProject('${proj.id}')" class="px-1.5 py-0.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded border border-rose-800/60 font-bold cursor-pointer" title="Cancelar pesquisa">✕</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (freeSlots > 0) {
        projectsHtml += `
          <button onclick="openRDNewProjectModal()" class="w-full py-1.5 rounded-xl bg-[#0d1017] hover:bg-white/[0.04] text-[#c9a86a] font-bold text-[11px] border border-dashed border-[#c9a86a]/40 cursor-pointer transition flex items-center justify-center gap-1.5">
            ➕ Alocar Nova Pesquisa (${freeSlots} Bancada${freeSlots > 1 ? 's' : ''} Livre${freeSlots > 1 ? 's' : ''})
          </button>
        `;
      }
    }

    let patentsHtml = '';
    if (completedProjects.length > 0) {
      const sortedCompleted = [...completedProjects].sort((a, b) => (b.currentQR || 0) - (a.currentQR || 0));
      const maxQR = Math.max(...sortedCompleted.map(p => p.currentQR || 0));
      const techLevelName = sortedCompleted.length >= 8 || maxQR >= 95 ? 'Nível 4 (Vanguarda Tecnológica)' :
                           (sortedCompleted.length >= 4 || maxQR >= 85 ? 'Nível 3 (Alta Tecnologia)' :
                           (sortedCompleted.length >= 2 || maxQR >= 70 ? 'Nível 2 (Industrial Avançado)' : 'Nível 1 (Manufatura Básica)'));

      patentsHtml = `
        <div class="bg-[#0d1017] p-2.5 rounded-xl border border-white/[0.08] space-y-2 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-sm">🏆</span>
              <div>
                <strong class="text-[#c9a86a] text-xs font-bold block">Acervo de Patentes (${completedProjects.length})</strong>
                <span class="text-[9px] text-amber-400/80 font-bold">${techLevelName}</span>
              </div>
            </div>
            <button onclick="toggleRDPatentsExpanded()" class="px-2 py-0.5 rounded text-[9px] font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] cursor-pointer transition">
              ${this.isRDPatentsExpanded ? '▴ Recolher' : '▾ Ver Todas'}
            </button>
          </div>

          <!-- Chips Compactos (Modo Recolhido) -->
          ${!this.isRDPatentsExpanded ? `
            <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
              ${sortedCompleted.slice(0, 6).map(p => {
                const prod = catalog[p.productId];
                const name = prod ? prod.name : p.productId;
                return `
                  <span class="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 text-[10px] font-bold flex items-center gap-1 shadow-sm" title="Patente Consolidada: QR ${Math.round(p.currentQR)}">
                    <span>⭐</span>
                    <span>${name}</span>
                    <strong class="text-[#c9a86a]">QR ${Math.round(p.currentQR)}</strong>
                  </span>
                `;
              }).join('')}
              ${sortedCompleted.length > 6 ? `
                <button onclick="toggleRDPatentsExpanded()" class="text-[9px] text-[#c9a86a] hover:underline font-bold px-1 cursor-pointer">
                  +${sortedCompleted.length - 6} patentes
                </button>
              ` : ''}
            </div>
          ` : `
            <!-- Lista Detalhada Compacta (Modo Expandido) -->
            <div class="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pt-1">
              ${sortedCompleted.map(p => {
                const prod = catalog[p.productId];
                const name = prod ? prod.name : p.productId;
                const cat = rdCats[p.category] || {};
                return `
                  <div class="flex items-center justify-between p-1.5 rounded-lg bg-[#080a0d] border border-white/[0.06] text-[10px]">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span>${cat.icon || '🔬'}</span>
                      <strong class="text-slate-200 truncate">${name}</strong>
                      <span class="text-[8px] bg-white/[0.04] text-slate-400 px-1 py-0.2 rounded border border-white/[0.04]">${p.category}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="text-emerald-400 font-bold">⭐ QR ${Math.round(p.currentQR)}</span>
                      <span class="text-[8px] bg-emerald-950/60 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50 font-bold">100%</span>
                      <button onclick="cancelRDProject('${p.id}')" class="text-slate-500 hover:text-rose-400 p-0.5 text-xs cursor-pointer transition" title="Arquivar ou remover patente antiga">
                        🗑️
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;
    }

    const contentEl = document.getElementById('facility-content-panel');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-white/[0.08] space-y-3 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div>
              <span class="font-bold text-[#c9a86a] text-sm block tracking-wide">Laboratório Tecnológico</span>
              <span class="text-[10px] text-slate-400">Capacidade: <strong>${usedSlots}/${totalCapacity} Bancadas</strong> ativas</span>
            </div>
            <span class="text-[10px] bg-[#c9a86a]/15 text-[#c9a86a] px-2 py-0.5 rounded border border-[#c9a86a]/30 font-bold">Nível ${rd.level || 1}</span>
          </div>

          <!-- Seção de Bancadas em Operação -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>🔬 BANCADAS EM OPERAÇÃO (${activeProjects.length})</span>
              <span class="text-emerald-400">$${totalBudget.toLocaleString('en-US')}/mês</span>
            </div>
            ${projectsHtml}
          </div>

          <!-- Seção de Acervo de Patentes & Nível Tecnológico -->
          ${patentsHtml}

          <!-- Ações Rápidas: Árvore Tecnológica & Central de Patentes -->
          <div class="pt-2 border-t border-white/[0.06] space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <button onclick="openTechTreeModal()" class="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#c9a86a] font-bold text-[11px] border border-[#c9a86a]/30 shadow cursor-pointer transition flex items-center justify-center gap-1">
                🧬 Árvore Tech
              </button>
              <button onclick="openRDCenterModal(); switchRDTab('market');" class="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-bold text-[11px] border border-white/[0.08] shadow cursor-pointer transition flex items-center justify-center gap-1">
                📜 Mercado Tech
              </button>
            </div>
            <button onclick="openRDCenterModal(); switchRDTab('projects');" class="w-full py-2 rounded-xl bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] font-bold text-xs shadow cursor-pointer transition flex items-center justify-center gap-1.5">
              🔬 Abrir Central Completa de P&D
            </button>
          </div>
        </div>
      `;
    }

    this.renderFacilityFooterActions(tile);
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
        <button onclick="sellFacility(${tile.x}, ${tile.y})" class="py-2 px-2 rounded-xl bg-[#0b0e14] hover:bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer text-center" title="Ofertar ao mercado / concorrentes (+70% a 80% do valor)">
          🏷️ Vender (+$${val.sellValue.toLocaleString()})
        </button>
        <button onclick="demolishFacility(${tile.x}, ${tile.y})" class="py-2 px-2 rounded-xl bg-[#0b0e14] hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 font-bold flex items-center justify-center gap-1 transition shadow cursor-pointer text-center" title="Demolir edifício e desocupar lote (+40% sucata)">
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
        purple: 'bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] border-[#c9a86a]/40 shadow-black/40',
        emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-900/40',
        rose: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400/40 shadow-rose-900/40',
        sky: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/40 shadow-sky-900/40',
        amber: 'bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] border-[#c9a86a]/40 shadow-black/40'
      };
      btn.className = `px-4 py-2 rounded-xl text-xs font-bold border shadow-lg cursor-pointer transition flex items-center gap-1.5 ${themeClasses[confirmTheme] || themeClasses.purple}`;
    }

    const iconBadge = document.getElementById('confirm-modal-icon-badge');
    if (iconBadge) {
      const badgeClasses = {
        purple: 'bg-[#c9a86a]/20 border-[#c9a86a]/40 text-[#c9a86a]',
        emerald: 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300',
        rose: 'bg-rose-950/80 border-rose-600/60 text-rose-300',
        sky: 'bg-sky-950/80 border-sky-600/60 text-sky-300',
        amber: 'bg-[#c9a86a]/20 border-[#c9a86a]/40 text-[#c9a86a]'
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
  },

  calculateFacilityValue(tile) {
    let baseCost = 0;
    let stockValue = 0;
    let facilityName = '';

    const storeTypes = (typeof window !== 'undefined' && window.STORE_TYPES) ? window.STORE_TYPES : [];

    if (tile.store) {
      const sType = storeTypes.find(s => s.id === tile.store.storeTypeId);
      baseCost = sType ? sType.cost : 25000;
      facilityName = tile.store.name;
      if (tile.store.shelves) {
        for (const shelf of Object.values(tile.store.shelves)) {
          stockValue += (shelf.stock || 0) * (shelf.landedCost || 1);
        }
      }
    } else if (tile.mine) {
      baseCost = tile.mine.cost || 40000;
      facilityName = tile.mine.name;
      stockValue = (tile.mine.stock || 0) * (tile.mine.unitCost || 1);
    } else if (tile.farm) {
      baseCost = tile.farm.cost || 22000;
      facilityName = tile.farm.name;
      stockValue = (tile.farm.stock || 0) * (tile.farm.dailyOperatingCost || 0.5);
    } else if (tile.factory) {
      baseCost = 48000;
      facilityName = tile.factory.name;
      if (tile.factory.lines) {
        for (const line of Object.values(tile.factory.lines)) {
          stockValue += (line.finishedStock || 0) * (line.unitCost || 1);
        }
      }
    } else if (tile.rdCenter) {
      baseCost = tile.rdCenter.constructionCost || 80000;
      facilityName = tile.rdCenter.name;
      stockValue = 0;
    } else if (tile.warehouse) {
      baseCost = tile.warehouse.cost || 35000;
      facilityName = tile.warehouse.name;
      if (tile.warehouse.inventory) {
        for (const item of Object.values(tile.warehouse.inventory)) {
          stockValue += (item.stock || 0) * (item.avgUnitCost || 1);
        }
      }
    }

    const sellValue = Math.round(baseCost * 0.70 + stockValue);
    const salvageValue = Math.round(baseCost * 0.40);
    return { baseCost, stockValue, sellValue, salvageValue, facilityName };
  },

  sellFacility(x, y) {
    const grid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : [];
    const tile = grid[x] && grid[x][y];
    if (!tile || (!tile.store && !tile.mine && !tile.farm && !tile.factory && !tile.rdCenter && !tile.warehouse)) return;

    const val = this.calculateFacilityValue(tile);
    const isStore = !!tile.store;
    const traffic = tile.district?.trafficIndex || 30;
    const cityName = tile.city?.cityName || 'Metrópole';
    const competitorName = traffic > 60 ? 'OmniCorp Retail' : (traffic > 40 ? 'Titan Megastores' : 'Fundo Imobiliário Apex');

    if (isStore && traffic >= 35) {
      const finalCash = Math.round(val.baseCost * 0.80 + val.stockValue);
      this.openFacilityConfirmModal({
        icon: '🤝',
        title: 'PROPOSTA DE AQUISIÇÃO CORPORATIVA',
        subtitle: `Comprador Interessado: <strong class="text-amber-300">${competitorName}</strong>`,
        name: val.facilityName,
        detailsHtml: `
          <div class="space-y-1.5">
            <div class="flex justify-between text-slate-300">
              <span>• Oferta pelo Imóvel (80% da Obra):</span>
              <span class="font-bold text-slate-100">$${Math.round(val.baseCost * 0.80).toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>• Liquidação Integral de Estoque:</span>
              <span class="font-bold text-slate-100">$${Math.round(val.stockValue).toLocaleString()}</span>
            </div>
            <div class="border-t border-slate-700 pt-1.5 flex justify-between text-emerald-400 font-bold text-xs">
              <span>TOTAL A RECEBER EM CAIXA:</span>
              <span>+$${finalCash.toLocaleString()}</span>
            </div>
            <p class="text-[10px] text-slate-400 pt-1 leading-snug">Se aceitar, a ${competitorName} assumirá a loja e passará a operar como concorrente no lote.</p>
          </div>
        `,
        confirmText: 'Aceitar Proposta (+$$)',
        confirmClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40',
        onConfirm: () => {
          if (typeof window.cash !== 'undefined') window.cash += finalCash;
          else if (window.GameState) window.GameState.cash += finalCash;

          if (typeof window.addGameLog === 'function') {
            window.addGameLog(`🤝 ${competitorName} adquiriu ${val.facilityName} por +$${finalCash.toLocaleString()} e assumiu o ponto comercial!`, 'text-purple-400 font-bold');
          }
          tile.competitor = {
            name: `${competitorName} ${cityName}`,
            shelves: { ...tile.store.shelves },
            lastShare: 0.5
          };
          tile.store = null;
          tile.buildingHeight = 18;
          if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
          if (typeof window._indexTile === 'function') window._indexTile(tile);
          if (typeof window !== 'undefined') window.activeManagedTile = null;
          this.renderIdlePanel();
          this.renderTileInspector(tile);
          if (typeof window.scheduleRender === 'function') window.scheduleRender();
          if (typeof window.updateUI === 'function') window.updateUI();
        }
      });
    } else {
      const finalCash = val.sellValue;
      this.openFacilityConfirmModal({
        icon: '🏷️',
        title: 'VENDER IMÓVEL NO MERCADO',
        subtitle: `Instalação: <strong class="text-emerald-300">${val.facilityName}</strong>`,
        name: val.facilityName,
        detailsHtml: `
          <div class="space-y-1.5">
            <div class="flex justify-between text-slate-300">
              <span>• Obra Recuperada (70%):</span>
              <span class="font-bold text-slate-100">$${Math.round(val.baseCost * 0.70).toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>• Liquidação de Estoque Residual:</span>
              <span class="font-bold text-slate-100">$${Math.round(val.stockValue).toLocaleString()}</span>
            </div>
            <div class="border-t border-slate-700 pt-1.5 flex justify-between text-emerald-400 font-bold text-xs">
              <span>TOTAL A RECEBER EM CAIXA:</span>
              <span>+$${finalCash.toLocaleString()}</span>
            </div>
            <p class="text-[10px] text-slate-400 pt-1 leading-snug">O imóvel será desocupado e o aluguel diário cancelado.</p>
          </div>
        `,
        confirmText: 'Confirmar Venda (+$$)',
        confirmClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40',
        onConfirm: () => {
          if (typeof window.cash !== 'undefined') window.cash += finalCash;
          else if (window.GameState) window.GameState.cash += finalCash;

          if (typeof window.addGameLog === 'function') {
            window.addGameLog(`💰 ${val.facilityName} vendida no mercado! Caixa creditado em +$${finalCash.toLocaleString()}`, 'text-emerald-400 font-bold');
          }
          tile.store = null;
          tile.mine = null;
          tile.farm = null;
          tile.factory = null;
          tile.rdCenter = null;
          tile.warehouse = null;
          tile.buildingHeight = 0;
          if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
          if (typeof window._indexTile === 'function') window._indexTile(tile);
          if (typeof window !== 'undefined') window.activeManagedTile = null;
          this.renderIdlePanel();
          this.renderTileInspector(tile);
          if (typeof window.scheduleRender === 'function') window.scheduleRender();
          if (typeof window.updateUI === 'function') window.updateUI();
        }
      });
    }
  },

  demolishFacility(x, y) {
    const grid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : [];
    const tile = grid[x] && grid[x][y];
    if (!tile || (!tile.store && !tile.mine && !tile.farm && !tile.factory && !tile.rdCenter && !tile.warehouse)) return;

    const val = this.calculateFacilityValue(tile);
    this.openFacilityConfirmModal({
      icon: '🗑️',
      title: 'DEMOLIR EDIFÍCIO',
      subtitle: `Instalação: <strong class="text-rose-300">${val.facilityName}</strong>`,
      name: val.facilityName,
      detailsHtml: `
        <div class="space-y-1.5">
          <div class="flex justify-between text-slate-300">
            <span>• Recuperação de Sucata (40%):</span>
            <span class="font-bold text-emerald-400">+$${val.salvageValue.toLocaleString()}</span>
          </div>
          <div class="text-rose-400/90 text-[10px]">
            • Todo o estoque residual no local será descartado.
          </div>
          <div class="text-slate-400 text-[10px]">
            • A cobrança de aluguel diário do lote será cancelada.
          </div>
          <p class="text-[10px] text-amber-400/90 pt-1 leading-snug">A estrutura será completamente removida e o lote ficará livre para novas construções.</p>
        </div>
      `,
      confirmText: 'Confirmar Demolição',
      confirmClass: 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40',
      onConfirm: () => {
        if (typeof window.cash !== 'undefined') window.cash += val.salvageValue;
        else if (window.GameState) window.GameState.cash += val.salvageValue;

        if (typeof window.SoundEngine !== 'undefined' && typeof window.SoundEngine.playDemolish === 'function') {
          window.SoundEngine.playDemolish();
        }
        if (typeof window.addGameLog === 'function') {
          window.addGameLog('🗑️ ' + val.facilityName + ' demolida. Recuperado +$' + val.salvageValue.toLocaleString() + ' em sucata.', 'text-rose-400 font-bold');
        }
        tile.store = null;
        tile.mine = null;
        tile.farm = null;
        tile.factory = null;
        tile.rdCenter = null;
        tile.warehouse = null;
        tile.buildingHeight = 0;
        if (typeof window._indexTile === 'function') window._indexTile(tile);
        if (typeof window !== 'undefined') window.activeManagedTile = null;
        this.renderIdlePanel();
        this.renderTileInspector(tile);
        if (typeof window.scheduleRender === 'function') window.scheduleRender();
        if (typeof window.updateUI === 'function') window.updateUI();
      }
    });
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
  window.renderMinePanel = FacilityPanel.renderMinePanel.bind(FacilityPanel);
  window.renderFarmPanel = FacilityPanel.renderFarmPanel.bind(FacilityPanel);
  window.renderFactoryPanel = FacilityPanel.renderFactoryPanel.bind(FacilityPanel);
  window.setFactoryFacade = FacilityPanel.setFactoryFacade.bind(FacilityPanel);
  window.renderStorePanel = FacilityPanel.renderStorePanel.bind(FacilityPanel);
  window.renderRDCenterPanel = FacilityPanel.renderRDCenterPanel.bind(FacilityPanel);
  window.renderFacilityFooterActions = FacilityPanel.renderFacilityFooterActions.bind(FacilityPanel);
  window.toggleRDPatentsExpanded = FacilityPanel.toggleRDPatentsExpanded.bind(FacilityPanel);
  window.showCustomConfirmModal = FacilityPanel.showCustomConfirmModal.bind(FacilityPanel);
  window.closeCustomConfirmModal = FacilityPanel.closeCustomConfirmModal.bind(FacilityPanel);
  window.executeCustomConfirmModal = FacilityPanel.executeCustomConfirmModal.bind(FacilityPanel);
  window.checkWorkingCapitalSafety = FacilityPanel.checkWorkingCapitalSafety.bind(FacilityPanel);
  window.confirmBuildRDCenter = FacilityPanel.confirmBuildRDCenter.bind(FacilityPanel);
  window.openFacilityConfirmModal = FacilityPanel.openFacilityConfirmModal.bind(FacilityPanel);
  window.closeFacilityConfirmModal = FacilityPanel.closeFacilityConfirmModal.bind(FacilityPanel);
  window.calculateFacilityValue = FacilityPanel.calculateFacilityValue.bind(FacilityPanel);
  window.sellFacility = FacilityPanel.sellFacility.bind(FacilityPanel);
  window.demolishFacility = FacilityPanel.demolishFacility.bind(FacilityPanel);
}

export default FacilityPanel;
