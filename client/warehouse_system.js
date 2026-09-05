/**
 * warehouse_system.js — Módulo de Interface e Gestão do Centro de Distribuição & Armazém Logístico
 * OIKONOMIA v0.8.5
 *
 * Encapsula o Modal Dedicado (#warehouse-modal), Smart Sourcing (detecção automática de insumos próprios),
 * sliders de cotas máximas e mínimas, radar de fluxos (Inbound/Outbound) e estratégias anticíclicas.
 */

let activeWarehouseTile = null;
let currentWarehouseTab = 'inventory'; // 'inventory' | 'flow' | 'anticyclic'

/**
 * Retorna uma referência segura ao worldGrid global
 */
function getWorldGrid() {
  return typeof window !== 'undefined' && window.worldGrid ? window.worldGrid : [];
}

/**
 * Retorna o mapa de instalações ativas
 */
function getActiveFacilitySet() {
  return typeof window !== 'undefined' && window.activeFacilitySet ? window.activeFacilitySet : new Map();
}

/**
 * Retorna o saldo de caixa atual
 */
function getCash() {
  return typeof window !== 'undefined' ? (window.cash ?? 0) : 0;
}

/**
 * Debita valor do caixa da empresa
 */
function deductCash(amount) {
  if (typeof window !== 'undefined') {
    window.cash = (window.cash ?? 0) - amount;
  }
}

/**
 * Abre modal de confirmação para construção de um novo Armazém Logístico
 */
export function confirmBuildWarehouse(x, y) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  if (!tile || tile.isWater || tile.isRoad || tile.store || tile.mine || tile.farm || tile.factory || tile.rdCenter || tile.warehouse) return;

  const cost = 35000;
  const currentCash = getCash();

  if (currentCash < cost) {
    if (typeof window.showCustomConfirmModal === 'function') {
      window.showCustomConfirmModal({
        icon: '❌',
        title: 'Saldo Insuficiente',
        subtitle: 'Centro de Distribuição & Armazém',
        description: `Seu saldo em caixa é insuficiente para a obra civil deste galpão logístico. Você precisa de <strong>$${cost.toLocaleString('en-US')}</strong>.`,
        details: [
          { label: 'Custo de Construção', value: `-$${cost.toLocaleString('en-US')}`, color: 'text-rose-400 font-bold' },
          { label: 'Seu Caixa Atual', value: `$${currentCash.toLocaleString('en-US')}`, color: 'text-amber-400 font-bold' },
          { label: 'Déficit', value: `-$${(cost - currentCash).toLocaleString('en-US')}`, color: 'text-rose-500 font-bold' }
        ],
        confirmText: 'Entendido',
        confirmTheme: 'rose',
        onConfirm: null
      });
    } else {
      alert(`Saldo insuficiente! São necessários $${cost.toLocaleString('en-US')}.`);
    }
    return;
  }

  const d = tile.district || { name: 'Interior', landRentDaily: 10 };
  const cityName = tile.city ? (tile.city.cityName || tile.city.name || 'Interior') : 'Interior';
  const dailyRent = Math.round(d.landRentDaily * 1.1);
  const remainingCash = currentCash - cost;

  if (typeof window.showCustomConfirmModal === 'function') {
    window.showCustomConfirmModal({
      icon: '🏢',
      title: 'Construir Centro de Distribuição & Armazém',
      subtitle: `Local: ${d.name} (${x}, ${y}) · ${cityName}`,
      description: `Deseja inaugurar um <strong>Centro de Distribuição & Armazém Logístico</strong> neste lote? Funciona como hub central: unifica safras de múltiplas fazendas, supre indústrias e lojas e estoca insumos anticiclicamente.`,
      details: [
        { label: 'Custo de Obra (Capex)', value: `-$${cost.toLocaleString('en-US')}`, color: 'text-rose-400 font-bold' },
        { label: 'Manutenção + Solo', value: `-$${dailyRent + 60}/dia`, color: 'text-amber-400' },
        { label: 'Capacidade Base Nível 1', value: '25.000 un', color: 'text-sky-300 font-bold' },
        { label: 'Saldo de Caixa Restante', value: `$${remainingCash.toLocaleString('en-US')}`, color: 'text-emerald-400 font-bold' }
      ],
      confirmText: `✅ Autorizar Construção (-$${cost.toLocaleString('en-US')})`,
      confirmTheme: 'sky',
      onConfirm: () => {
        deductCash(cost);
        tile.warehouse = {
          id: `warehouse_${tile.x}_${tile.y}`,
          name: `CD & Silos Logísticos (${tile.x}, ${tile.y})`,
          level: 1,
          maxCapacity: 25000,
          cost: cost,
          dailyRent: dailyRent,
          dailyMaintenance: 60,
          builtAt: {
            day: window.day || 1,
            month: window.month || 1,
            year: window.year || 1
          },
          inventory: {}
        };
        tile.buildingHeight = 20;
        if (typeof window._indexTile === 'function') window._indexTile(tile);

        if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
        if (typeof window.addGameLog === 'function') {
          window.addGameLog(`🏢 Centro de Distribuição & Armazém inaugurado em ${cityName}! (-$${cost.toLocaleString('en-US')})`, 'text-sky-400 font-bold');
        }

        // Auto-sincroniza insumos próprios para conveniência imediata
        syncOwnProductionProducts(tile);

        openWarehouseModal(tile);
        if (typeof window.renderTileInspector === 'function') window.renderTileInspector(tile);
        if (typeof window.scheduleRender === 'function') window.scheduleRender();
        if (typeof window.updateUI === 'function') window.updateUI();
      }
    });
  }
}

/**
 * Abre o Modal Dedicado do Armazém Logístico
 */
export function openWarehouseModal(tile) {
  if (!tile) {
    const worldGrid = getWorldGrid();
    if (activeWarehouseTile) tile = activeWarehouseTile;
    else return;
  }
  if (!tile?.warehouse) return;

  activeWarehouseTile = tile;
  const modal = document.getElementById('warehouse-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  renderWarehouseModal();
}

/**
 * Fecha o Modal Dedicado do Armazém Logístico
 */
export function closeWarehouseModal() {
  const modal = document.getElementById('warehouse-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Renomeia o armazém ativo
 */
export function renameWarehouse(x, y) {
  const tile = activeWarehouseTile || (typeof x === 'number' && getWorldGrid()[x]?.[y]);
  if (!tile?.warehouse) return;

  const currentName = tile.warehouse.name || 'Centro de Distribuição';
  const newName = prompt('Digite o novo nome do seu Centro de Distribuição:', currentName);
  if (newName && newName.trim() && newName.trim() !== currentName) {
    tile.warehouse.name = newName.trim();
    if (typeof window.addGameLog === 'function') {
      window.addGameLog(`✏️ Instalação renomeada para "${tile.warehouse.name}"`, 'text-sky-300');
    }
    renderWarehouseModal();
    if (typeof window.renderTileInspector === 'function') window.renderTileInspector(tile);
  }
}

/**
 * Alterna entre as abas do modal
 */
export function switchWarehouseTab(tabName) {
  currentWarehouseTab = tabName;

  const tabs = [
    { id: 'inventory', btn: 'wh-tab-inventory-btn', content: 'wh-tab-inventory-content' },
    { id: 'flow', btn: 'wh-tab-flow-btn', content: 'wh-tab-flow-content' },
    { id: 'anticyclic', btn: 'wh-tab-anticyclic-btn', content: 'wh-tab-anticyclic-content' }
  ];

  for (const t of tabs) {
    const btn = document.getElementById(t.btn);
    const content = document.getElementById(t.content);
    const isActive = (t.id === tabName);

    if (btn) {
      if (isActive) {
        btn.className = 'px-3 py-1.5 rounded-lg font-bold bg-sky-700 text-white border border-sky-500 shadow text-[10px] cursor-pointer transition';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] cursor-pointer transition';
      }
    }

    if (content) {
      if (isActive) content.classList.remove('hidden');
      else content.classList.add('hidden');
    }
  }

  renderWarehouseModal();
}

/**
 * Renderiza todo o conteúdo do modal ativo
 */
export function renderWarehouseModal() {
  const tile = activeWarehouseTile;
  if (!tile?.warehouse) return;

  renderWarehouseHeaderAndStats(tile);

  if (currentWarehouseTab === 'inventory') {
    renderWarehouseInventoryTab(tile);
  } else if (currentWarehouseTab === 'flow') {
    renderWarehouseFlowTab(tile);
  } else if (currentWarehouseTab === 'anticyclic') {
    renderWarehouseAnticyclicTab(tile);
  }
}

/**
 * Atualiza o cabeçalho executivo e estatísticas do modal
 */
function renderWarehouseHeaderAndStats(tile) {
  const wh = tile.warehouse;
  wh.inventory = wh.inventory || {};

  // Título e subtítulo
  const titleEl = document.getElementById('wh-modal-title');
  if (titleEl) titleEl.textContent = wh.name;

  const subtitleEl = document.getElementById('wh-modal-subtitle');
  const dName = tile.district?.name || 'Interior';
  const cityName = tile.city ? (tile.city.cityName || tile.city.name || 'Metrópole') : 'Zona Rural';
  if (subtitleEl) subtitleEl.textContent = `${cityName} (${dName}) · Lote (${tile.x}, ${tile.y}) · Hub Multimodal de Estocagem`;

  // Badge de Nível
  const lvl = wh.level || 1;
  const levelBadge = document.getElementById('wh-modal-level-badge');
  if (levelBadge) {
    levelBadge.textContent = `Nível ${lvl}`;
    levelBadge.className = lvl === 3 
      ? 'text-[9px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-600/60'
      : (lvl === 2 
        ? 'text-[9px] bg-purple-950 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-700/60'
        : 'text-[9px] bg-sky-950 text-sky-300 font-bold px-2 py-0.5 rounded border border-sky-700/60');
  }

  // Botão de Upgrade
  const upgradeSlot = document.getElementById('wh-modal-upgrade-slot');
  if (upgradeSlot) {
    if (lvl === 1) {
      upgradeSlot.innerHTML = `
        <button onclick="upgradeWarehouse(${tile.x}, ${tile.y})" class="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg border border-sky-400/50 shadow cursor-pointer transition flex items-center gap-1">
          ⚡ Ampliar p/ Nível 2 (60k un) -$40.000
        </button>
      `;
    } else if (lvl === 2) {
      upgradeSlot.innerHTML = `
        <button onclick="upgradeWarehouse(${tile.x}, ${tile.y})" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg border border-purple-400/50 shadow cursor-pointer transition flex items-center gap-1">
          ⚡ Ampliar p/ Nível 3 (150k un) -$80.000
        </button>
      `;
    } else {
      upgradeSlot.innerHTML = `
        <span class="text-[10px] bg-slate-800/90 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-600/40 flex items-center gap-1">
          🏆 Mega Hub Máximo (150k un)
        </span>
      `;
    }
  }

  // Ocupação e Métricas
  const totalStock = Object.values(wh.inventory).reduce((s, i) => s + (i.stock || 0), 0);
  const maxCap = wh.maxCapacity || 25000;
  const usedPct = Math.min(100, Math.round((totalStock / Math.max(1, maxCap)) * 100));

  const stockSummaryEl = document.getElementById('wh-modal-stock-summary');
  if (stockSummaryEl) stockSummaryEl.textContent = `${totalStock.toLocaleString()} / ${maxCap.toLocaleString()} un (${usedPct}%)`;

  const stockBarEl = document.getElementById('wh-modal-stock-bar');
  if (stockBarEl) {
    stockBarEl.style.width = `${usedPct}%`;
    stockBarEl.className = `h-full rounded-full transition-all duration-300 ${usedPct > 90 ? 'bg-rose-500' : (usedPct > 70 ? 'bg-amber-500' : 'bg-sky-500')}`;
  }

  const freeSpaceEl = document.getElementById('wh-modal-free-space');
  if (freeSpaceEl) freeSpaceEl.textContent = `Livre: ${Math.max(0, maxCap - totalStock).toLocaleString()} un`;

  const whRent = wh.dailyRent || (tile.district ? tile.district.landRentDaily : 10);
  const whMaint = wh.dailyMaintenance || 60;
  const dailyCostEl = document.getElementById('wh-modal-daily-cost');
  if (dailyCostEl) dailyCostEl.textContent = `-$${whRent + whMaint}/dia (Solo $${whRent} + Logística $${whMaint})`;

  // Valuation do Estoque
  const totalValuation = Object.values(wh.inventory).reduce((sum, item) => sum + ((item.stock || 0) * (item.avgUnitCost || 1)), 0);
  const valEl = document.getElementById('wh-modal-valuation');
  if (valEl) valEl.textContent = `$${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const slotsCountEl = document.getElementById('wh-modal-slots-count');
  const count = Object.keys(wh.inventory).length;
  if (slotsCountEl) slotsCountEl.textContent = `${count} ${count === 1 ? 'insumo' : 'insumos'}`;
}

/**
 * Aba 1: Inventário & Sliders de Cotas Máximas e Mínimas
 */
function renderWarehouseInventoryTab(tile) {
  const container = document.getElementById('wh-tab-inventory-content');
  if (!container) return;

  const wh = tile.warehouse;
  const invEntries = Object.entries(wh.inventory || {});
  const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};
  const maxCap = wh.maxCapacity || 25000;

  if (invEntries.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-950/70 p-8 rounded-2xl border border-dashed border-sky-800/60 text-center space-y-3 font-mono">
        <div class="text-4xl">📦</div>
        <h4 class="text-sm font-bold text-slate-200">Nenhum produto alocado neste Centro de Distribuição</h4>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          Você pode sincronizar instantaneamente todos os insumos que suas fazendas, minas e fábricas produzem, ou adicionar produtos manualmente pelo catálogo.
        </p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button onclick="syncOwnProductionProducts()" class="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg cursor-pointer transition flex items-center gap-1.5">
            ⚡ Sincronizar Produção Própria
          </button>
          <button onclick="openAddWarehouseProductModal()" class="py-2.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-lg cursor-pointer transition flex items-center gap-1.5">
            ➕ Alocar Manualmente
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="space-y-3 font-mono">
      <div class="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
        <span>Baias de Estocagem & Configurações de Fluxo</span>
        <span class="text-[10px] text-slate-400">Total: ${invEntries.length} itens</span>
      </div>

      ${invEntries.map(([pId, item]) => {
        const pInfo = catalog[pId] || { name: pId, icon: '📦' };
        const pName = pInfo.name || pId;
        const pIcon = pInfo.emoji || pInfo.icon || '📦';
        const isCollect = item.collectMode === 'all_own';
        const isPort = !!item.autoRestockPort;
        const isRecession = !!item.buyOnRecessionOnly;

        const maxQuota = (item.maxQuota && item.maxQuota > 0) ? item.maxQuota : maxCap;
        const safetyStock = item.safetyStock || 0;
        const currentStock = item.stock || 0;
        const quotaPct = Math.min(100, Math.round((currentStock / Math.max(1, maxQuota)) * 100));

        return `
          <div class="bg-slate-950/90 border border-slate-800 hover:border-sky-700/80 rounded-2xl p-3.5 space-y-3 transition shadow">
            <!-- Cabeçalho do Card do Produto -->
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div class="flex items-center gap-3">
                <span class="text-2xl p-1.5 bg-slate-900 rounded-xl border border-slate-800">${pIcon}</span>
                <div>
                  <div class="flex items-center gap-2">
                    <strong class="text-slate-100 text-sm">${pName}</strong>
                    <span class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">${pInfo.category || 'Geral'}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    Custo Médio: <strong class="text-emerald-400">$${(item.avgUnitCost || 0).toFixed(2)}/un</strong> · QR: <strong class="text-cyan-300">${item.quality || 60}</strong>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-sm font-bold text-sky-300">${currentStock.toLocaleString()} un</div>
                <div class="text-[9px] text-slate-400">${quotaPct}% da cota (${maxQuota.toLocaleString()} un)</div>
                <button onclick="removeWarehouseProduct(${tile.x}, ${tile.y}, '${pId}')" class="text-[9px] text-rose-400 hover:text-rose-300 cursor-pointer mt-1" title="Desalocar produto e liberar baia">
                  🗑️ Desalocar
                </button>
              </div>
            </div>

            <!-- Sliders de Controle Fino: Cota Máxima & Estoque Mínimo -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-xs">
              <!-- Slider 1: Cota Máxima de Armazenamento (Teto) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-300 flex items-center gap-1 font-bold">
                    <span>🛑 Cota Máxima (Teto):</span>
                  </span>
                  <span id="wh-val-maxquota-${pId}" class="font-bold text-sky-300">${maxQuota.toLocaleString()} un</span>
                </div>
                <input type="range" min="500" max="${maxCap}" step="500" value="${maxQuota}"
                  oninput="setWarehouseProductMaxQuota(${tile.x}, ${tile.y}, '${pId}', this.value)"
                  class="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg">
                <div class="flex items-center justify-between text-[9px] text-slate-500">
                  <span>Mín: 500 un</span>
                  <span>Teto do Armazém: ${maxCap.toLocaleString()} un</span>
                </div>
              </div>

              <!-- Slider 2: Estoque Mínimo de Segurança (Buffer) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-300 flex items-center gap-1 font-bold">
                    <span>🛡️ Estoque de Segurança:</span>
                  </span>
                  <span id="wh-val-safety-${pId}" class="font-bold text-amber-300">${safetyStock.toLocaleString()} un</span>
                </div>
                <input type="range" min="0" max="${Math.min(maxQuota, 25000)}" step="500" value="${safetyStock}"
                  oninput="setWarehouseSafetyStock(${tile.x}, ${tile.y}, '${pId}', this.value)"
                  class="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg">
                <div class="flex items-center justify-between text-[9px] text-slate-500">
                  <span>Mín: 0 un (Desligado)</span>
                  <span>Reserva: ${Math.min(maxQuota, 25000).toLocaleString()} un</span>
                </div>
              </div>
            </div>

            <!-- Toggles de Operação Logística -->
            <div class="flex items-center justify-between flex-wrap gap-2 pt-1 text-[10px]">
              <div class="flex items-center gap-2 flex-wrap">
                <label class="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
                  <input type="checkbox" ${isCollect ? 'checked' : ''} onchange="toggleWarehouseCollect(${tile.x}, ${tile.y}, '${pId}')" class="rounded text-sky-500 focus:ring-0">
                  <span class="text-slate-300 font-bold">🌾 Coleta de Fontes Próprias</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
                  <input type="checkbox" ${isPort ? 'checked' : ''} onchange="toggleWarehousePortRestock(${tile.x}, ${tile.y}, '${pId}')" class="rounded text-sky-500 focus:ring-0">
                  <span class="text-slate-300 font-bold">🚢 Repor do Porto</span>
                </label>
              </div>

              <label class="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700" title="Só compra do porto durante recessão ou depressão econômica">
                <input type="checkbox" ${isRecession ? 'checked' : ''} onchange="toggleWarehouseRecessionOnly(${tile.x}, ${tile.y}, '${pId}')" class="rounded text-amber-500 focus:ring-0">
                <span class="${isRecession ? 'text-amber-400 font-bold' : 'text-slate-400'}">📉 Modo Anticíclico</span>
              </label>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Aba 2: Radar de Fluxo Inbound (Origens) vs Outbound (Destinos)
 */
function renderWarehouseFlowTab(tile) {
  const container = document.getElementById('wh-tab-flow-content');
  if (!container) return;

  const wh = tile.warehouse;
  const whId = `warehouse_${tile.x}_${tile.y}`;
  const activeFacilities = getActiveFacilitySet();
  const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};

  const inboundSources = [];
  const outboundDestinations = [];

  // 1. Mapeia fontes de entrada (Inbound)
  for (const srcTile of activeFacilities.values()) {
    if (srcTile.farm) {
      const pId = srcTile.farm.cropId;
      if (wh.inventory?.[pId]) {
        const dist = Math.abs(tile.x - srcTile.x) + Math.abs(tile.y - srcTile.y);
        inboundSources.push({
          facilityName: srcTile.farm.name,
          type: 'Fazenda Agropecuária',
          icon: '🌾',
          product: catalog[pId]?.name || pId,
          dailyRate: srcTile.farm.effectiveYield || srcTile.farm.dailyYield || 0,
          currentStock: srcTile.farm.stock || 0,
          dist: dist,
          active: wh.inventory[pId].collectMode === 'all_own'
        });
      }
    }
    if (srcTile.mine) {
      const pId = srcTile.mine.resourceId;
      if (wh.inventory?.[pId]) {
        const dist = Math.abs(tile.x - srcTile.x) + Math.abs(tile.y - srcTile.y);
        inboundSources.push({
          facilityName: srcTile.mine.name,
          type: 'Mineração / Extração',
          icon: '⛏️',
          product: catalog[pId]?.name || pId,
          dailyRate: srcTile.mine.effectiveYield || srcTile.mine.dailyYield || 0,
          currentStock: srcTile.mine.stock || 0,
          dist: dist,
          active: wh.inventory[pId].collectMode === 'all_own'
        });
      }
    }
  }

  // 2. Mapeia clientes de saída (Outbound)
  for (const dstTile of activeFacilities.values()) {
    // Granja ou Pecuária alimentada por este CD
    if (dstTile.farm && dstTile.farm.feedConfig?.active && dstTile.farm.feedConfig.supplierId === whId) {
      const pId = dstTile.farm.feedConfig.grainProdId;
      const feedNeeded = Math.ceil((dstTile.farm.dailyYield || 500) * 0.20);
      const available = wh.inventory?.[pId]?.stock || 0;
      outboundDestinations.push({
        facilityName: dstTile.farm.name,
        type: 'Granja / Pecuária',
        icon: '🐔',
        product: catalog[pId]?.name || pId,
        dailyRate: feedNeeded,
        status: available >= feedNeeded ? '✅ 100% Suprido' : '⚠️ Déficit / Sem Estoque',
        statusColor: available >= feedNeeded ? 'text-emerald-400' : 'text-rose-400 font-bold'
      });
    }

    // Fábrica consumindo deste CD
    if (dstTile.factory && dstTile.factory.lines) {
      for (const line of Object.values(dstTile.factory.lines)) {
        if (line.ingredients) {
          for (const [inpId, cfg] of Object.entries(line.ingredients)) {
            if (cfg.supplierId === whId) {
              const needed = Math.ceil((line.dailyOutputTarget || 50) * (cfg.ratio || 1));
              const available = wh.inventory?.[inpId]?.stock || 0;
              outboundDestinations.push({
                facilityName: dstTile.factory.name,
                type: `Fábrica · Linha ${line.outputProductId}`,
                icon: '🏭',
                product: catalog[inpId]?.name || inpId,
                dailyRate: needed,
                status: available >= needed ? '✅ 100% Suprido' : '⚠️ Déficit / Sem Estoque',
                statusColor: available >= needed ? 'text-emerald-400' : 'text-rose-400 font-bold'
              });
            }
          }
        }
      }
    }

    // Loja de varejo abastecida por este CD
    if (dstTile.store && dstTile.store.shelves) {
      for (const shelf of Object.values(dstTile.store.shelves)) {
        if (shelf.supplierId === whId) {
          const pId = shelf.productId;
          const salesRate = Math.round(shelf.dailySales || 0);
          const available = wh.inventory?.[pId]?.stock || 0;
          outboundDestinations.push({
            facilityName: dstTile.store.name,
            type: 'Varejo / Loja',
            icon: '🏪',
            product: catalog[pId]?.name || pId,
            dailyRate: salesRate,
            status: available >= salesRate ? '✅ 100% Suprido' : '⚠️ Déficit / Sem Estoque',
            statusColor: available >= salesRate ? 'text-emerald-400' : 'text-rose-400 font-bold'
          });
        }
      }
    }
  }

  const totalInboundRate = inboundSources.filter(s => s.active).reduce((sum, s) => sum + s.dailyRate, 0);
  const totalOutboundRate = outboundDestinations.reduce((sum, d) => sum + d.dailyRate, 0);
  const netRate = totalInboundRate - totalOutboundRate;

  container.innerHTML = `
    <div class="space-y-4 font-mono text-xs">
      <!-- Balanço Diário Geral -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-sky-800/60">
        <div class="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">📥 Entrada Diária (Inbound):</span>
          <strong class="text-sm text-emerald-400">+${totalInboundRate.toLocaleString()} un/dia</strong>
        </div>
        <div class="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">📤 Saída Diária (Outbound):</span>
          <strong class="text-sm text-rose-400">-${totalOutboundRate.toLocaleString()} un/dia</strong>
        </div>
        <div class="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">⚖️ Balanço Líquido:</span>
          <strong class="text-sm ${netRate >= 0 ? 'text-cyan-300' : 'text-amber-400'}">${netRate >= 0 ? '+' : ''}${netRate.toLocaleString()} un/dia</strong>
        </div>
      </div>

      <!-- Tabela Inbound: Fontes de Abastecimento -->
      <div class="space-y-2">
        <div class="flex items-center justify-between font-bold text-slate-200">
          <span>📥 Fontes de Entrada (Fazendas & Minas Conectadas)</span>
          <span class="text-[10px] text-slate-400">${inboundSources.length} fontes</span>
        </div>

        ${inboundSources.length === 0 ? `
          <div class="bg-slate-950/60 p-4 rounded-xl text-center text-slate-500 text-xs border border-dashed border-slate-800">
            Nenhuma fazenda ou mina própria cadastrada produzindo os itens deste armazém.
          </div>
        ` : `
          <div class="space-y-1.5">
            ${inboundSources.map(s => `
              <div class="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-lg">${s.icon}</span>
                  <div>
                    <strong class="text-slate-200 text-xs block">${s.facilityName}</strong>
                    <span class="text-[9px] text-slate-400">${s.type} · Produto: <span class="text-sky-300">${s.product}</span> · Distância: ${s.dist} blocos</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-emerald-400">+${s.dailyRate.toLocaleString()} un/dia</div>
                  <span class="text-[9px] ${s.active ? 'text-sky-400' : 'text-slate-500'}">${s.active ? 'Coleta Ativa' : 'Pausada'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Tabela Outbound: Clientes Internos da Holding -->
      <div class="space-y-2">
        <div class="flex items-center justify-between font-bold text-slate-200">
          <span>📤 Destinos de Saída (Granjas, Indústrias & Lojas Abastecidas)</span>
          <span class="text-[10px] text-slate-400">${outboundDestinations.length} clientes</span>
        </div>

        ${outboundDestinations.length === 0 ? `
          <div class="bg-slate-950/60 p-4 rounded-xl text-center text-slate-500 text-xs border border-dashed border-slate-800">
            Nenhuma fábrica, granja ou loja está configurada para consumir deste Armazém no momento.<br>
            <span class="text-[10px] text-slate-400">Abra a sua granja ou fábrica e selecione este Armazém no dropdown de fornecedores de insumo!</span>
          </div>
        ` : `
          <div class="space-y-1.5">
            ${outboundDestinations.map(d => `
              <div class="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-lg">${d.icon}</span>
                  <div>
                    <strong class="text-slate-200 text-xs block">${d.facilityName}</strong>
                    <span class="text-[9px] text-slate-400">${d.type} · Insumo: <span class="text-sky-300">${d.product}</span></span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-rose-400">-${d.dailyRate.toLocaleString()} un/dia</div>
                  <span class="text-[9px] ${d.statusColor}">${d.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Aba 3: Compras Portuárias & Estratégia Anticíclica
 */
function renderWarehouseAnticyclicTab(tile) {
  const container = document.getElementById('wh-tab-anticyclic-content');
  if (!container) return;

  const currentYear = (typeof window !== 'undefined' && window.year) ? window.year : 1;
  const cycleInfo = (typeof MacroCycleSystem !== 'undefined') ? MacroCycleSystem.getCurrentCycle(currentYear) : { phase: 'boom' };
  const phase = cycleInfo.phase || 'boom';
  const isDiscount = (phase === 'recession' || phase === 'depression');
  const discountPct = phase === 'depression' ? 35 : (phase === 'recession' ? 25 : 0);

  container.innerHTML = `
    <div class="space-y-4 font-mono text-xs">
      <!-- Status do Ciclo Macroeconômico -->
      <div class="bg-slate-950 p-4 rounded-2xl border ${isDiscount ? 'border-amber-600/80 bg-amber-950/10' : 'border-sky-800/60'} space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${isDiscount ? '📉' : '📈'}</span>
            <div>
              <strong class="text-sm ${isDiscount ? 'text-amber-300' : 'text-sky-300'}">
                Ciclo Atual: ${phase.toUpperCase()}
              </strong>
              <p class="text-[10px] text-slate-400 mt-0.5">
                ${isDiscount ? `Oportunidade anticíclica ativa! Preço de insumos no atacado portuário com até <strong>-${discountPct}% de desconto</strong>.` : 'Economia em alta. Os insumos no porto estão sendo negociados ao preço padrão de mercado.'}
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold px-2.5 py-1 rounded-lg ${isDiscount ? 'bg-amber-500/20 text-amber-300 border border-amber-600/40' : 'bg-sky-500/20 text-sky-300 border border-sky-600/40'}">
              ${isDiscount ? `Desconto de -${discountPct}%` : 'Preço Normal'}
            </span>
          </div>
        </div>
      </div>

      <!-- Guia Estratégico de Compras Anticíclicas -->
      <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
        <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>💡 Como Funciona o Modo Anticíclico:</span>
        </h4>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Quando o toggle <strong class="text-amber-400">"Modo Anticíclico"</strong> está ativo em um produto:
        </p>
        <ul class="text-[10px] text-slate-300 space-y-1.5 list-disc pl-4">
          <li>O Armazém <strong>não comprará do porto</strong> durante períodos de Expansão e Boom (quando os preços estão inflacionados).</li>
          <li>Assim que a cidade entrar em <strong>Recessão ou Depressão</strong>, o Armazém acionará automaticamente a importação de lotes com grande desconto até preencher a cota estipulada pelo slider.</li>
          <li>Isso garante que suas fábricas e granjas continuem operando a custo mínimo mesmo em crises!</li>
        </ul>
      </div>
    </div>
  `;
}

/**
 * Smart Sourcing: Escaneia instalações da empresa e auto-cadastra todos os produtos produzidos
 */
export function syncOwnProductionProducts(targetTile) {
  const tile = targetTile || activeWarehouseTile;
  if (!tile?.warehouse) return;

  const wh = tile.warehouse;
  wh.inventory = wh.inventory || {};
  const activeFacilities = getActiveFacilitySet();
  const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};
  let addedCount = 0;

  for (const srcTile of activeFacilities.values()) {
    // Fazendas
    if (srcTile.farm) {
      const pId = srcTile.farm.cropId;
      if (pId && !wh.inventory[pId]) {
        const baseCost = srcTile.farm.dailyOperatingCost || 0.45;
        const pName = catalog[pId]?.name || srcTile.farm.cropName || pId;
        wh.inventory[pId] = {
          productId: pId,
          productName: pName,
          stock: 0,
          avgUnitCost: baseCost,
          quality: srcTile.farm.effectiveQuality || srcTile.farm.quality || 60,
          collectMode: 'all_own',
          maxQuota: Math.min(10000, wh.maxCapacity || 25000),
          safetyStock: 1000,
          autoRestockPort: false,
          buyOnRecessionOnly: false
        };
        addedCount++;
      }
    }

    // Minas
    if (srcTile.mine) {
      const pId = srcTile.mine.resourceId;
      if (pId && !wh.inventory[pId]) {
        const baseCost = srcTile.mine.unitCost || 10.0;
        const pName = catalog[pId]?.name || srcTile.mine.resourceName || pId;
        wh.inventory[pId] = {
          productId: pId,
          productName: pName,
          stock: 0,
          avgUnitCost: baseCost,
          quality: srcTile.mine.quality || 60,
          collectMode: 'all_own',
          maxQuota: Math.min(10000, wh.maxCapacity || 25000),
          safetyStock: 500,
          autoRestockPort: false,
          buyOnRecessionOnly: false
        };
        addedCount++;
      }
    }

    // Fábricas
    if (srcTile.factory && srcTile.factory.lines) {
      for (const line of Object.values(srcTile.factory.lines)) {
        const pId = line.outputProductId;
        if (pId && !wh.inventory[pId]) {
          const baseCost = line.unitCost || 2.0;
          const pName = catalog[pId]?.name || pId;
          wh.inventory[pId] = {
            productId: pId,
            productName: pName,
            stock: 0,
            avgUnitCost: baseCost,
            quality: line.outputQuality || 65,
            collectMode: 'all_own',
            maxQuota: Math.min(10000, wh.maxCapacity || 25000),
            safetyStock: 500,
            autoRestockPort: false,
            buyOnRecessionOnly: false
          };
          addedCount++;
        }
      }
    }
  }

  if (addedCount > 0) {
    if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
    if (typeof window.addGameLog === 'function') {
      window.addGameLog(`⚡ Smart Sourcing: ${addedCount} novos insumos da sua cadeia alocados no Armazém!`, 'text-emerald-400 font-bold');
    }
  } else {
    if (typeof window.addGameLog === 'function') {
      window.addGameLog(`⚡ Smart Sourcing: Todas as suas produções já estavam alocadas no Armazém.`, 'text-sky-300');
    }
  }

  renderWarehouseModal();
  if (typeof window.updateUI === 'function') window.updateUI();
}

/**
 * Atualiza o slider de Cota Máxima de Armazenamento
 */
export function setWarehouseProductMaxQuota(x, y, prodId, val) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  const item = tile?.warehouse?.inventory?.[prodId];
  if (!item) return;

  item.maxQuota = Math.max(500, parseInt(val, 10) || 500);
  const displayEl = document.getElementById(`wh-val-maxquota-${prodId}`);
  if (displayEl) displayEl.textContent = `${item.maxQuota.toLocaleString()} un`;
}

/**
 * Atualiza o slider de Estoque Mínimo de Segurança
 */
export function setWarehouseSafetyStock(x, y, prodId, val) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  const item = tile?.warehouse?.inventory?.[prodId];
  if (!item) return;

  item.safetyStock = Math.max(0, parseInt(val, 10) || 0);
  const displayEl = document.getElementById(`wh-val-safety-${prodId}`);
  if (displayEl) displayEl.textContent = `${item.safetyStock.toLocaleString()} un`;
}

/**
 * Expande o nível e capacidade do armazém
 */
export function upgradeWarehouse(x, y) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  if (!tile?.warehouse) return;
  const wh = tile.warehouse;
  const curLvl = wh.level || 1;
  const cost = curLvl === 1 ? 40000 : 80000;
  const nextCap = curLvl === 1 ? 60000 : 150000;
  const currentCash = getCash();

  if (currentCash < cost) {
    alert(`Saldo insuficiente! São necessários $${cost.toLocaleString('en-US')} para expandir o armazém.`);
    return;
  }

  deductCash(cost);
  wh.level = curLvl + 1;
  wh.maxCapacity = nextCap;
  wh.dailyMaintenance = (wh.dailyMaintenance || 60) + 30;

  if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
  if (typeof window.addGameLog === 'function') {
    window.addGameLog(`⚡ ${wh.name} expandido para o Nível ${wh.level}! Nova capacidade: ${nextCap.toLocaleString()} un (-$${cost.toLocaleString('en-US')}).`, 'text-sky-300 font-bold');
  }

  renderWarehouseModal();
  if (typeof window.updateUI === 'function') window.updateUI();
}

/**
 * Abre o modal de alocação de novo produto ao armazém
 */
export function openAddWarehouseProductModal(x, y) {
  const worldGrid = getWorldGrid();
  const tile = (typeof x === 'number' && typeof y === 'number') ? worldGrid[x]?.[y] : activeWarehouseTile;
  if (!tile?.warehouse) return;
  activeWarehouseTile = tile;

  const modal = document.getElementById('warehouse-add-product-modal');
  const searchInput = document.getElementById('warehouse-add-search-input');
  if (searchInput) searchInput.value = '';
  renderWarehouseAddProductList('');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Fecha o modal de alocação de produto
 */
export function closeAddWarehouseProductModal() {
  const modal = document.getElementById('warehouse-add-product-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Renderiza a lista de produtos destacando no topo os produzidos pela empresa
 */
export function renderWarehouseAddProductList(query = '') {
  const listEl = document.getElementById('warehouse-add-products-list');
  if (!listEl || !activeWarehouseTile?.warehouse) return;

  const wh = activeWarehouseTile.warehouse;
  wh.inventory = wh.inventory || {};
  const q = (query || '').trim().toLowerCase();

  const prodCatalog = typeof window !== 'undefined' ? window.PRODUCT_CATALOG : null;
  const farmTypes = typeof window !== 'undefined' ? window.FARM_TYPES : null;
  const mineTypes = typeof window !== 'undefined' ? window.MINE_TYPES : null;
  const activeFacilities = getActiveFacilitySet();

  // Mapeia o que a empresa já produz
  const ownProducedIds = new Set();
  for (const fTile of activeFacilities.values()) {
    if (fTile.farm?.cropId) ownProducedIds.add(fTile.farm.cropId);
    if (fTile.mine?.resourceId) ownProducedIds.add(fTile.mine.resourceId);
    if (fTile.factory?.lines) {
      for (const line of Object.values(fTile.factory.lines)) {
        if (line.outputProductId) ownProducedIds.add(line.outputProductId);
      }
    }
  }

  const allItems = [];
  if (prodCatalog) {
    for (const [id, prod] of Object.entries(prodCatalog)) {
      allItems.push({
        id,
        name: prod.name || id,
        category: prod.category || 'Geral',
        emoji: prod.emoji || prod.icon || '📦',
        baseCost: prod.baseCost || 1.0,
        isOwn: ownProducedIds.has(id)
      });
    }
  }

  if (farmTypes) {
    for (const ft of farmTypes) {
      if (!allItems.some(i => i.id === ft.cropId)) {
        allItems.push({
          id: ft.cropId,
          name: ft.cropName,
          category: 'Agropecuária',
          emoji: ft.emoji || '🌾',
          baseCost: ft.unitCost || 0.45,
          isOwn: ownProducedIds.has(ft.cropId)
        });
      }
    }
  }

  if (mineTypes) {
    for (const mt of mineTypes) {
      if (!allItems.some(i => i.id === mt.resourceId)) {
        allItems.push({
          id: mt.resourceId,
          name: mt.resourceName,
          category: 'Mineração',
          emoji: mt.emoji || '⛏️',
          baseCost: mt.unitCost || 10.0,
          isOwn: ownProducedIds.has(mt.resourceId)
        });
      }
    }
  }

  const filtered = allItems.filter(item => {
    if (wh.inventory[item.id]) return false;
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  // Ordena: produtos próprios no topo absoluto
  filtered.sort((a, b) => {
    if (a.isOwn && !b.isOwn) return -1;
    if (!a.isOwn && b.isOwn) return 1;
    return a.name.localeCompare(b.name);
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="text-xs text-slate-400 font-mono text-center py-4">Nenhum produto disponível encontrado.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => `
    <div class="flex items-center justify-between p-2.5 ${item.isOwn ? 'bg-emerald-950/40 border-emerald-700/60 hover:bg-emerald-900/50' : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800'} rounded-xl border transition font-mono text-xs">
      <div class="flex items-center gap-2.5">
        <span class="text-base">${item.emoji}</span>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-200">${item.name}</span>
            ${item.isOwn ? `<span class="text-[8px] bg-emerald-900 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-600/60">⚡ SUA PRODUÇÃO</span>` : ''}
          </div>
          <div class="text-[10px] text-slate-400">${item.category} · Custo Base $${item.baseCost.toFixed(2)}</div>
        </div>
      </div>
      <button onclick="addWarehouseProduct(${activeWarehouseTile.x}, ${activeWarehouseTile.y}, '${item.id}')" class="${item.isOwn ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'} text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition">
        Alocar
      </button>
    </div>
  `).join('');
}

/**
 * Aloca uma nova baia de produto no armazém
 */
export function addWarehouseProduct(x, y, prodId) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  if (!tile?.warehouse) return;
  tile.warehouse.inventory = tile.warehouse.inventory || {};

  const prodCatalog = typeof window !== 'undefined' ? window.PRODUCT_CATALOG : null;
  const pInfo = prodCatalog ? prodCatalog[prodId] : null;
  const baseCost = pInfo?.baseCost || 1.0;
  const pName = pInfo?.name || prodId;

  tile.warehouse.inventory[prodId] = {
    productId: prodId,
    productName: pName,
    stock: 0,
    avgUnitCost: baseCost,
    quality: 60,
    collectMode: 'all_own',
    maxQuota: Math.min(10000, tile.warehouse.maxCapacity || 25000),
    safetyStock: 1000,
    autoRestockPort: false,
    buyOnRecessionOnly: false
  };

  closeAddWarehouseProductModal();
  renderWarehouseModal();
  if (typeof window.updateUI === 'function') window.updateUI();
  if (typeof window.addGameLog === 'function') {
    window.addGameLog(`📦 ${pName} alocado no Armazém (${x}, ${y})!`, 'text-sky-300 font-bold');
  }
}

/**
 * Remove uma baia de produto do armazém
 */
export function removeWarehouseProduct(x, y, prodId) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  if (!tile?.warehouse?.inventory?.[prodId]) return;
  delete tile.warehouse.inventory[prodId];
  renderWarehouseModal();
  if (typeof window.updateUI === 'function') window.updateUI();
}

/**
 * Alterna a coleta automática de instalações próprias
 */
export function toggleWarehouseCollect(x, y, prodId) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  const item = tile?.warehouse?.inventory?.[prodId];
  if (!item) return;
  item.collectMode = item.collectMode === 'all_own' ? 'none' : 'all_own';
  renderWarehouseModal();
}

/**
 * Alterna a reposição automática de estoque via porto marítimo
 */
export function toggleWarehousePortRestock(x, y, prodId) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  const item = tile?.warehouse?.inventory?.[prodId];
  if (!item) return;
  item.autoRestockPort = !item.autoRestockPort;
  renderWarehouseModal();
}

/**
 * Alterna a restrição anticíclica de compras portuárias
 */
export function toggleWarehouseRecessionOnly(x, y, prodId) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  const item = tile?.warehouse?.inventory?.[prodId];
  if (!item) return;
  item.buyOnRecessionOnly = !item.buyOnRecessionOnly;
  renderWarehouseModal();
}

/**
 * Fallback para quando o armazém é inspecionado na janela lateral padrão
 */
export function renderWarehousePanel(tile) {
  if (!tile?.warehouse) return;
  activeWarehouseTile = tile;
  openWarehouseModal(tile);
}
