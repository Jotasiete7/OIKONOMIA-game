/**
 * warehouse_system.js — Módulo de Interface e Gestão do Centro de Distribuição & Armazém Logístico
 * OIKONOMIA v0.8.5
 *
 * Encapsula a renderização da interface, gestão de upgrades,
 * alocação/desalocação de baias de produtos, toggles de coleta/porto e modal de construção.
 */

let activeWarehouseTile = null;

/**
 * Retorna uma referência segura ao worldGrid global
 */
function getWorldGrid() {
  return typeof window !== 'undefined' && window.worldGrid ? window.worldGrid : [];
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

        window.activeManagedTile = tile;
        if (typeof window.renderFacilityPanel === 'function') window.renderFacilityPanel(tile);
        const win = document.getElementById('floating-facility-window');
        if (win) win.classList.remove('hidden');

        if (typeof window.renderTileInspector === 'function') window.renderTileInspector(tile);
        if (typeof window.scheduleRender === 'function') window.scheduleRender();
        if (typeof window.updateUI === 'function') window.updateUI();
      }
    });
  }
}

/**
 * Renderiza o painel principal de gestão do armazém na janela de instalações
 */
export function renderWarehousePanel(tile) {
  const wh = tile?.warehouse;
  if (!wh) return;

  const iconEl = document.getElementById('facility-icon');
  if (iconEl) iconEl.innerHTML = `<img src="assets/logistica/warehouse_lvl${wh.level || 1}.png" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='🏢'">`;
  const titleEl = document.getElementById('facility-title');
  if (titleEl) titleEl.textContent = wh.name;
  const subtitleEl = document.getElementById('facility-subtitle');
  if (subtitleEl) subtitleEl.textContent = `${tile.district?.name || 'Interior'} · Centro de Distribuição & Silos Logísticos (Nível ${wh.level || 1})`;
  const badge = document.getElementById('facility-rent-badge');
  const whRent = wh.dailyRent || (tile.district ? tile.district.landRentDaily : 10);
  const totalDaily = whRent + (wh.dailyMaintenance || 60);
  if (badge) {
    badge.textContent = `-$${totalDaily}/dia (Solo $${whRent} + Logística $${wh.dailyMaintenance || 60})`;
    badge.classList.remove('hidden');
  }

  wh.inventory = wh.inventory || {};
  const totalCurrentStock = Object.values(wh.inventory).reduce((sum, item) => sum + (item.stock || 0), 0);
  const maxCap = wh.maxCapacity || 25000;
  const usedPct = Math.min(100, Math.round((totalCurrentStock / Math.max(1, maxCap)) * 100));

  const lvl = wh.level || 1;
  let upgradeBtnHtml = '';
  if (lvl === 1) {
    upgradeBtnHtml = `
      <button onclick="upgradeWarehouse(${tile.x}, ${tile.y})" class="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-sky-400/40 shadow cursor-pointer transition">
        ⚡ Ampliar p/ Nível 2 (60k un) -$40.000
      </button>
    `;
  } else if (lvl === 2) {
    upgradeBtnHtml = `
      <button onclick="upgradeWarehouse(${tile.x}, ${tile.y})" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-400/40 shadow cursor-pointer transition">
        ⚡ Ampliar p/ Nível 3 (150k un) -$80.000
      </button>
    `;
  } else {
    upgradeBtnHtml = `<span class="text-[9px] bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-600/40">🏆 Mega Hub Máximo (150k un)</span>`;
  }

  const invEntries = Object.entries(wh.inventory);
  let invHtml = '';
  if (invEntries.length === 0) {
    invHtml = `
      <div class="bg-slate-900/60 p-4 rounded-xl border border-dashed border-sky-800/60 text-center space-y-2 font-mono">
        <div class="text-2xl">📦</div>
        <p class="text-[11px] text-slate-300 font-bold">Nenhum produto alocado neste armazém.</p>
        <p class="text-[10px] text-slate-400">Adicione grãos, insumos ou manufaturas para coletar das suas fazendas/fábricas ou reabastecer do porto.</p>
        <button onclick="openAddWarehouseProductModal(${tile.x}, ${tile.y})" class="mt-1 py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg cursor-pointer transition">
          ➕ Alocar Produto / Insumo
        </button>
      </div>
    `;
  } else {
    const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : {};
    invHtml = `
      <div class="space-y-2.5">
        ${invEntries.map(([pId, item]) => {
          const pInfo = catalog[pId] || { name: pId, icon: '📦' };
          const pName = pInfo.name || pId;
          const pIcon = pInfo.emoji || pInfo.icon || '📦';
          const isCollect = item.collectMode === 'all_own';
          const isPort = !!item.autoRestockPort;
          const isRecession = !!item.buyOnRecessionOnly;

          return `
            <div class="bg-slate-900/90 border border-slate-800 hover:border-sky-800/80 rounded-xl p-3 space-y-2 font-mono text-xs transition">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-base">${pIcon}</span>
                  <div>
                    <strong class="text-slate-100 text-xs block leading-tight">${pName}</strong>
                    <span class="text-[9px] text-slate-400">Custo Médio: <strong class="text-emerald-400">$${(item.avgUnitCost || 0).toFixed(2)}/un</strong> · QR: <strong class="text-cyan-300">${item.quality || 60}</strong></span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-sky-300">${(item.stock || 0).toLocaleString()} un</div>
                  <button onclick="removeWarehouseProduct(${tile.x}, ${tile.y}, '${pId}')" class="text-[9px] text-rose-400 hover:text-rose-300 cursor-pointer" title="Remover lote do armazém">Desalocar</button>
                </div>
              </div>

              <!-- Controles de Inbound & Segurança -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] pt-1">
                <label class="flex items-center gap-1.5 cursor-pointer bg-slate-950 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
                  <input type="checkbox" ${isCollect ? 'checked' : ''} onchange="toggleWarehouseCollect(${tile.x}, ${tile.y}, '${pId}')" class="rounded text-sky-500 focus:ring-0">
                  <span class="text-slate-300">🌾 Coleta de Fontes Próprias</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer bg-slate-950 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
                  <input type="checkbox" ${isPort ? 'checked' : ''} onchange="toggleWarehousePortRestock(${tile.x}, ${tile.y}, '${pId}')" class="rounded text-sky-500 focus:ring-0">
                  <span class="text-slate-300">🚢 Reabastecer do Porto</span>
                </label>
              </div>

              <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400">Estoque Segurança:</span>
                  <input type="number" min="0" max="50000" step="500" value="${item.safetyStock || 0}" onchange="setWarehouseSafetyStock(${tile.x}, ${tile.y}, '${pId}', this.value)" class="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-amber-300 text-right focus:outline-none focus:border-sky-500">
                  <span class="text-slate-500">un</span>
                </div>

                <label class="flex items-center gap-1 cursor-pointer" title="Só compra do porto durante recessão/depressão (aproveita desconto de até 35%)">
                  <input type="checkbox" ${isRecession ? 'checked' : ''} onchange="toggleWarehouseRecessionOnly(${tile.x}, ${tile.y}, '${pId}')" class="rounded text-amber-500 focus:ring-0">
                  <span class="${isRecession ? 'text-amber-400 font-bold' : 'text-slate-400'} text-[9px]">📉 Modo Anticíclico</span>
                </label>
              </div>
            </div>
          `;
        }).join('')}

        <button onclick="openAddWarehouseProductModal(${tile.x}, ${tile.y})" class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-sky-300 font-bold text-xs border border-dashed border-sky-800/70 cursor-pointer transition flex items-center justify-center gap-1.5">
          ➕ Alocar Outro Produto ao Armazém
        </button>
      </div>
    `;
  }

  const contentPanel = document.getElementById('facility-content-panel');
  if (contentPanel) {
    contentPanel.innerHTML = `
      <div class="space-y-3 font-mono text-xs">
        <!-- Ocupação Geral do Hub -->
        <div class="bg-slate-950 p-3 rounded-xl border border-sky-800/80 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 font-bold text-slate-200 text-xs">
              <span>📊 Ocupação do Galpão:</span>
              <span class="text-sky-300">${totalCurrentStock.toLocaleString()} / ${maxCap.toLocaleString()} un</span>
            </div>
            <div>${upgradeBtnHtml}</div>
          </div>

          <div class="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div class="${usedPct > 90 ? 'bg-rose-500' : (usedPct > 70 ? 'bg-amber-500' : 'bg-sky-500')} h-full rounded-full transition-all duration-300" style="width:${usedPct}%"></div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Livre: <strong class="text-emerald-400">${Math.max(0, maxCap - totalCurrentStock).toLocaleString()} un</strong></span>
            <span>Ocupado: <strong class="text-slate-200">${usedPct}%</strong></span>
          </div>
        </div>

        <!-- Listagem de Produtos Gerenciados -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5">
            <span>Baias & Insumos Gerenciados:</span>
            <span class="text-[10px] text-slate-400">${invEntries.length} ${invEntries.length === 1 ? 'produto' : 'produtos'}</span>
          </div>
          ${invHtml}
        </div>
      </div>
    `;
  }

  if (typeof window.renderFacilityFooterActions === 'function') {
    window.renderFacilityFooterActions(tile);
  }
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

  renderWarehousePanel(tile);
  if (typeof window.updateUI === 'function') window.updateUI();
}

/**
 * Abre o modal de alocação de novo produto ao armazém
 */
export function openAddWarehouseProductModal(x, y) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
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
  activeWarehouseTile = null;
}

/**
 * Renderiza os produtos disponíveis para inclusão no armazém
 */
export function renderWarehouseAddProductList(query = '') {
  const listEl = document.getElementById('warehouse-add-products-list');
  if (!listEl || !activeWarehouseTile?.warehouse) return;

  const wh = activeWarehouseTile.warehouse;
  wh.inventory = wh.inventory || {};
  const q = (query || '').trim().toLowerCase();

  const allItems = [];
  const prodCatalog = typeof window !== 'undefined' ? window.PRODUCT_CATALOG : null;
  const farmTypes = typeof window !== 'undefined' ? window.FARM_TYPES : null;
  const mineTypes = typeof window !== 'undefined' ? window.MINE_TYPES : null;

  if (prodCatalog) {
    for (const [id, prod] of Object.entries(prodCatalog)) {
      allItems.push({
        id,
        name: prod.name || id,
        category: prod.category || 'Geral',
        emoji: prod.emoji || prod.icon || '📦',
        baseCost: prod.baseCost || 1.0
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
          baseCost: ft.unitCost || 0.45
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
          baseCost: mt.unitCost || 10.0
        });
      }
    }
  }

  const filtered = allItems.filter(item => {
    if (wh.inventory[item.id]) return false;
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="text-xs text-slate-400 font-mono text-center py-4">Nenhum produto disponível encontrado.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => `
    <div class="flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition font-mono text-xs">
      <div class="flex items-center gap-2.5">
        <span class="text-base">${item.emoji}</span>
        <div>
          <div class="font-bold text-slate-200">${item.name}</div>
          <div class="text-[10px] text-slate-400">${item.category} · Custo Base $${item.baseCost.toFixed(2)}</div>
        </div>
      </div>
      <button onclick="addWarehouseProduct(${activeWarehouseTile.x}, ${activeWarehouseTile.y}, '${item.id}')" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition">
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
    safetyStock: 1000,
    autoRestockPort: false,
    buyOnRecessionOnly: false
  };

  closeAddWarehouseProductModal();
  renderWarehousePanel(tile);
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
  renderWarehousePanel(tile);
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
  renderWarehousePanel(tile);
}

/**
 * Define a meta de estoque de segurança
 */
export function setWarehouseSafetyStock(x, y, prodId, val) {
  const worldGrid = getWorldGrid();
  const tile = worldGrid[x] && worldGrid[x][y];
  const item = tile?.warehouse?.inventory?.[prodId];
  if (!item) return;
  item.safetyStock = Math.max(0, parseInt(val, 10) || 0);
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
  renderWarehousePanel(tile);
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
  renderWarehousePanel(tile);
}
