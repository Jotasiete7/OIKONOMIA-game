/**
 * OIKONOMIA - Store Wizard & Retail Shelves Controller
 * client/ui/wizards/store_wizard.js
 *
 * Gerencia os assistentes de varejo e expansão comercial:
 * - Wizard de Fundação de Lojas em 2 Etapas (Tipos de Ponto Comercial e Seleção de Gôndolas Iniciais)
 * - Homologação e Cobrança de Licenças de Nicho (Supermercado, Farmácia, Concessionária, etc.)
 * - Gestão de Gôndolas e Adição de Novos Produtos (com abastecimento prioritário de conglomerado)
 * - Compras de Estoque Emergencial / Reposição Imediata (drenagem de armazéns, granjas e fábricas da holding)
 * - Atualização Reativa de Preços de Venda e Cotas Diárias de Reposição
 */

import {
  STORE_TYPES,
  STORE_NICHE_LICENSES,
  STORE_CATEGORY_WHITELIST,
  PRODUCT_CATALOG
} from '../../data_catalogs.js';

export const StoreWizard = {
  pendingStoreTile: null,
  pendingStoreType: null,
  selectedProductsMap: new Map(),
  activeCategoryTab: 'Alimentos',
  activeSearchQuery: '',
  addProductTargetTile: null,
  activeAddProductCategoryTab: 'Alimentos',

  get pendingTile() {
    return this.pendingStoreTile;
  },
  set pendingTile(tile) {
    this.pendingStoreTile = tile;
  },

  get cash() {
    if (typeof window !== 'undefined' && window.cash !== undefined) return window.cash;
    if (typeof window !== 'undefined' && window.GameState) return window.GameState.cash;
    return 0;
  },
  set cash(val) {
    if (typeof window !== 'undefined') {
      window.cash = val;
      if (window.GameState) window.GameState.cash = val;
    }
  },

  get worldGrid() {
    return (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : [];
  },

  get acquiredLicenses() {
    if (typeof window !== 'undefined' && window.acquiredLicenses) return window.acquiredLicenses;
    if (typeof window !== 'undefined' && window.GameState?.acquiredLicenses) return window.GameState.acquiredLicenses;
    return new Set();
  },

  get playerProfile() {
    if (typeof window !== 'undefined' && window.playerProfile) return window.playerProfile;
    if (typeof window !== 'undefined' && window.GameState?.playerProfile) return window.GameState.playerProfile;
    return { companyName: 'Holding' };
  },

  get year() {
    if (typeof window !== 'undefined' && window.year !== undefined) return window.year;
    if (typeof window !== 'undefined' && window.GameState?.year !== undefined) return window.GameState.year;
    return 1;
  },

  hasNicheLicense(typeId) {
    if (typeId === 'kombini') return true;
    return this.acquiredLicenses.has(typeId);
  },

  getNicheLicenseCost(typeId) {
    if (this.hasNicheLicense(typeId)) return 0;
    const licenses = (typeof STORE_NICHE_LICENSES !== 'undefined' ? STORE_NICHE_LICENSES : window.STORE_NICHE_LICENSES) || {};
    return licenses[typeId]?.cost || 0;
  },

  getSupplierOffers(prodId, tile) {
    if (typeof window !== 'undefined' && typeof window.getSupplierOffersForProduct === 'function') {
      return window.getSupplierOffersForProduct(prodId, tile);
    }
    return [];
  },

  checkWorkingCapitalSafety(cost, onProceed, name = 'este empreendimento') {
    if (typeof window !== 'undefined' && typeof window.checkWorkingCapitalSafety === 'function') {
      window.checkWorkingCapitalSafety(cost, onProceed, name);
    } else {
      onProceed();
    }
  },

  _indexTile(tile) {
    if (typeof window !== 'undefined' && typeof window._indexTile === 'function') {
      window._indexTile(tile);
    }
  },

  addLog(msg, cls) {
    if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
      window.addLog(msg, cls);
    }
  },

  scheduleRender() {
    if (typeof window !== 'undefined' && typeof window.scheduleRender === 'function') {
      window.scheduleRender();
    }
  },

  updateUI() {
    if (typeof window !== 'undefined' && typeof window.updateUI === 'function') {
      window.updateUI();
    }
  },

  renderFacility(tile) {
    if (typeof window !== 'undefined') {
      if (window.FacilityPanel && typeof window.FacilityPanel.renderFacilityPanel === 'function') {
        window.FacilityPanel.renderFacilityPanel(tile);
      } else if (typeof window.renderFacilityPanel === 'function') {
        window.renderFacilityPanel(tile);
      }
      if (window.FacilityPanel && typeof window.FacilityPanel.renderTileInspector === 'function') {
        window.FacilityPanel.renderTileInspector(tile);
      } else if (typeof window.renderTileInspector === 'function') {
        window.renderTileInspector(tile);
      }
    }
  },

  getProductEmoji(id) {
    if (typeof window !== 'undefined' && typeof window.getProductEmoji === 'function') {
      return window.getProductEmoji(id);
    }
    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};
    return catalog[id]?.emoji || '📦';
  },

  // =========================================================================
  // 1. WIZARD DE INAUGURAÇÃO DE LOJAS (ETAPAS 1 E 2)
  // =========================================================================

  openStoreWizard(tile) {
    this.pendingTile = tile;
    this.pendingStoreType = null;
    this.selectedProductsMap.clear();
    this.activeCategoryTab = 'Alimentos';
    this.activeSearchQuery = '';

    const d = tile.district || { name: 'Metrópole', trafficIndex: 50, population: 100000, landRentDaily: 50 };
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = `Inaugurar Estabelecimento em ${d.name}`;
    const subEl = document.getElementById('modal-subtitle');
    if (subEl) subEl.textContent = `Tráfego: ${d.trafficIndex}/100 · Pop: ${d.population.toLocaleString()} hab · Aluguel base: $${d.landRentDaily}/dia`;

    this.updateStepIndicator(1);
    this.renderStoreTypeCards();

    const step1 = document.getElementById('wizard-step1');
    if (step1) step1.classList.remove('hidden');
    const step2 = document.getElementById('wizard-step2');
    if (step2) step2.classList.add('hidden');
    const modal = document.getElementById('store-modal');
    if (modal) modal.classList.remove('hidden');
  },

  updateStepIndicator(step) {
    const dot1 = document.getElementById('step-dot-1');
    if (dot1) dot1.className = `w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-emerald-400' : 'bg-slate-600'}`;
    const dot2 = document.getElementById('step-dot-2');
    if (dot2) dot2.className = `w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-emerald-400' : 'bg-slate-600'}`;
    const line = document.getElementById('step-line-fill');
    if (line) line.style.width = step >= 2 ? '100%' : '0%';
    const label = document.getElementById('step-label');
    if (label) label.textContent = `Etapa ${step}/2`;
  },

  renderStoreTypeCards() {
    if (!this.pendingTile) return;
    const d = this.pendingTile.district || { landRentDaily: 50, population: 100000, trafficIndex: 50 };
    const container = document.getElementById('store-type-cards');
    if (!container) return;

    const storeTypes = (typeof STORE_TYPES !== 'undefined' ? STORE_TYPES : window.STORE_TYPES) || [];
    const licenses = (typeof STORE_NICHE_LICENSES !== 'undefined' ? STORE_NICHE_LICENSES : window.STORE_NICHE_LICENSES) || {};

    container.innerHTML = storeTypes.map(st => {
      const actualRent = (d.landRentDaily * st.rentMultiplier).toFixed(0);
      const isSelected = this.pendingStoreType?.id === st.id;
      const lic = licenses[st.id] || null;
      const hasLicense = this.hasNicheLicense(st.id);
      const licCost = hasLicense ? 0 : (lic?.cost || 0);
      const totalInvestment = st.cost + licCost;
      const estMonthlyVolume = Math.round(d.population * 0.035 * (d.trafficIndex / 100) * st.maxShelves * 30);
      const estMonthlyProfit = Math.max(600, Math.round(estMonthlyVolume * 1.6 - (actualRent * 30) - (st.maxShelves * 40 * 30)));
      const paybackMonthsMin = Math.max(2, Math.round(totalInvestment / (estMonthlyProfit * 1.25)));
      const paybackMonthsMax = Math.max(paybackMonthsMin + 2, Math.round(totalInvestment / (estMonthlyProfit * 0.75)));
      const estRoi = Math.min(250, Math.max(15, Math.round((estMonthlyProfit * 12 / totalInvestment) * 100)));

      return `
        <div onclick="selectStoreType('${st.id}')"
          class="store-type-card cursor-pointer rounded-xl border p-3 flex flex-col gap-1.5 transition
            ${isSelected ? 'border-[#c9a86a] bg-[#c9a86a]/10 ring-1 ring-[#c9a86a]' : 'border-white/[0.08] bg-[#0b0e14] hover:border-white/[0.16] shadow-md'}">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-[#0d1017] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              <img src="assets/lojas/${st.id}.png" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
              <span class="text-lg hidden">${st.emoji}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-100 truncate">${st.name}</div>
                ${hasLicense ? `
                  <span class="text-[9px] bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded-full font-mono font-bold">✓ Homologado</span>
                ` : `
                  <span class="text-[9px] bg-amber-950/60 text-amber-300 border border-amber-700/60 px-1.5 py-0.2 rounded-full font-mono font-bold">📜 Requer Licença</span>
                `}
              </div>
              <div class="text-[10px] font-bold text-emerald-400 font-mono mt-0.5">
                Obra: $${st.cost.toLocaleString('en-US')} ${!hasLicense && licCost > 0 ? `<span class="text-amber-400 font-bold">+ Licença: $${licCost.toLocaleString('en-US')}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>📦 ${st.maxShelves} gôndolas</span>
            <span>Aluguel: <strong class="text-rose-400">$${actualRent}/dia</strong></span>
          </div>
          <div class="text-[9px] font-mono text-[#c9a86a] bg-[#c9a86a]/10 p-1.5 rounded-lg border border-[#c9a86a]/20 flex items-center justify-between">
            <span>⏱ Payback: <strong>${paybackMonthsMin} a ${paybackMonthsMax} meses</strong></span>
            <span class="text-slate-400">ROI Est.: <strong class="text-emerald-400 font-bold">~${estRoi}%/ano</strong></span>
          </div>
          ${!hasLicense && lic && lic.cost > 0 ? `
            <div class="text-[9px] text-amber-300/90 bg-amber-950/40 border border-amber-800/60 rounded p-1.5 font-mono leading-tight">
              ${lic.icon} <strong>${lic.name}</strong>: ${lic.desc} (Taxa única corporativa: <strong class="text-amber-300">$${lic.cost.toLocaleString('en-US')}</strong>)
            </div>
          ` : ''}
          <div class="text-[9px] text-slate-400 border-t border-white/[0.06] pt-1 leading-tight">${st.desc}</div>
        </div>
      `;
    }).join('');
  },

  selectStoreType(typeId) {
    const storeTypes = (typeof STORE_TYPES !== 'undefined' ? STORE_TYPES : window.STORE_TYPES) || [];
    this.pendingStoreType = storeTypes.find(s => s.id === typeId);
    this.renderStoreTypeCards();
    const btn = document.getElementById('btn-to-step2');
    if (btn) btn.disabled = false;
  },

  advanceToStep2() {
    if (!this.pendingStoreType) return;
    this.updateStepIndicator(2);

    const step1 = document.getElementById('wizard-step1');
    if (step1) step1.classList.add('hidden');
    const step2 = document.getElementById('wizard-step2');
    if (step2) step2.classList.remove('hidden');

    const whitelist = (typeof STORE_CATEGORY_WHITELIST !== 'undefined' ? STORE_CATEGORY_WHITELIST : window.STORE_CATEGORY_WHITELIST) || {};
    const allowedCats = whitelist[this.pendingStoreType.id]
      ? whitelist[this.pendingStoreType.id]
      : (this.pendingStoreType.category !== 'all' ? [this.pendingStoreType.category] : ['Alimentos']);

    this.activeCategoryTab = allowedCats[0] || 'Alimentos';
    this.renderProductSelector();
  },

  backToStep1() {
    this.updateStepIndicator(1);
    const step2 = document.getElementById('wizard-step2');
    if (step2) step2.classList.add('hidden');
    const step1 = document.getElementById('wizard-step1');
    if (step1) step1.classList.remove('hidden');
  },

  filterProductSelectorSearch(q) {
    this.activeSearchQuery = q.toLowerCase().trim();
    this.renderProductSelector();
  },

  renderProductSelector() {
    const whitelist = (typeof STORE_CATEGORY_WHITELIST !== 'undefined' ? STORE_CATEGORY_WHITELIST : window.STORE_CATEGORY_WHITELIST) || {};
    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};

    const allowedCats = (this.pendingStoreType?.id && whitelist[this.pendingStoreType.id])
      ? whitelist[this.pendingStoreType.id]
      : [...new Set(Object.values(catalog).map(p => p.category))];

    if (!allowedCats.includes(this.activeCategoryTab)) {
      this.activeCategoryTab = allowedCats[0] || 'Alimentos';
    }

    const tabsContainer = document.getElementById('category-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = allowedCats.map(cat => `
        <button onclick="setCategoryTab('${cat}')"
          class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition
            ${this.activeCategoryTab === cat ? 'bg-[#c9a86a] text-[#080a0d] font-bold shadow-sm' : 'text-slate-400 hover:text-[#f1f5f9] bg-white/[0.03] border border-white/[0.05]'}">
          ${cat}
        </button>
      `).join('');
    }

    let products = Object.values(catalog).filter(p => allowedCats.includes(p.category));
    if (this.activeSearchQuery) {
      products = products.filter(p => p.name.toLowerCase().includes(this.activeSearchQuery) || p.category.toLowerCase().includes(this.activeSearchQuery));
    } else {
      products = products.filter(p => p.category === this.activeCategoryTab);
    }

    // Ordenar: produtos do conglomerado próprio no topo!
    products.sort((a, b) => {
      const offersA = this.getSupplierOffers(a.id, this.pendingTile);
      const offersB = this.getSupplierOffers(b.id, this.pendingTile);
      const aInternal = offersA[0]?.type?.startsWith('internal_') ? 1 : 0;
      const bInternal = offersB[0]?.type?.startsWith('internal_') ? 1 : 0;
      if (aInternal !== bInternal) return bInternal - aInternal;
      return a.name.localeCompare(b.name);
    });

    const usedSlots = this.selectedProductsMap.size;
    const maxSlots  = this.pendingStoreType ? this.pendingStoreType.maxShelves : 4;
    const compName = this.playerProfile.companyName || 'Holding';

    const productListEl = document.getElementById('product-list');
    if (productListEl) {
      productListEl.innerHTML = products.map(prod => {
        const offers = this.getSupplierOffers(prod.id, this.pendingTile);
        const hasOffer = offers.length > 0;
        const currentOffer = this.selectedProductsMap.get(prod.id) || (offers[0] || null);
        const isSelected = this.selectedProductsMap.has(prod.id);
        const isDisabled = (!isSelected && usedSlots >= maxSlots) || !hasOffer;
        const isInternal = !!currentOffer?.type?.startsWith('internal_');
        const initStockCost = currentOffer ? Math.round(100 * (isInternal ? (currentOffer.freight || 0) : currentOffer.landedCost)) : 0;
        const prodEmoji = this.getProductEmoji(prod.id);

        return `
          <div class="product-card rounded-xl border p-2.5 flex flex-col gap-1.5 transition ${isSelected ? 'border-[#c9a86a] bg-[#c9a86a]/10 shadow-[0_0_15px_rgba(201,168,106,0.12)]' : (isInternal ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/[0.07] bg-[#0b0e14] hover:border-white/20')}">
            ${isInternal ? `
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="bg-gradient-to-r from-amber-600 to-[#c9a86a] text-[#080a0d] font-black text-[9px] uppercase px-1.5 py-0.5 rounded shadow tracking-wide">
                  🏛️ CONGLOMERADO: ${compName}
                </span>
                <span class="bg-amber-950/80 text-[#c9a86a] font-bold text-[8px] px-1 py-0.5 rounded border border-[#c9a86a]/40">
                  ${currentOffer.ownerTag || (currentOffer.type === 'internal_warehouse' ? '📦 ARMAZÉM' : '✨ PRÓPRIO')}
                </span>
              </div>
            ` : ''}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <input type="checkbox" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}
                  onchange="toggleProductInWizard('${prod.id}')" class="w-4 h-4 rounded text-[#c9a86a] accent-[#c9a86a] focus:ring-0 cursor-pointer">
                <span class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span class="text-sm">${prodEmoji}</span>
                  <span>${prod.name}</span>
                </span>
                <span class="text-[9px] bg-white/[0.05] text-[#94a3b8] border border-white/[0.08] px-1.5 py-0.5 rounded font-mono">${prod.category}</span>
              </div>
              <div class="text-right text-[10px] font-mono">
                <span class="text-slate-400">1º Estoque (100 un): </span>
                <strong class="${isInternal ? 'text-emerald-400' : 'text-rose-400'} font-bold">-${initStockCost > 0 ? `$${initStockCost.toLocaleString()}` : '$0 (Interno)'}</strong>
              </div>
            </div>

            ${hasOffer ? `
              <div class="bg-[#080a0d] rounded-lg p-1.5 text-[10px] font-mono border ${isInternal ? 'border-amber-500/30 bg-amber-950/10' : 'border-white/[0.06]'} flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <span class="${isInternal ? 'text-[#c9a86a] font-bold' : 'text-amber-300'}">${currentOffer.supplierName.split('(')[0].trim()}</span>
                  <span class="text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">QR: ${currentOffer.quality}</span>
                </div>
                <span>${isInternal ? 'Frete' : 'Custo'}: <strong class="text-emerald-400 font-bold">$${(isInternal ? currentOffer.freight : currentOffer.landedCost).toFixed(2)}</strong></span>
              </div>
            ` : `<div class="text-[10px] text-rose-400 font-mono">❌ Sem fornecedores disponíveis.</div>`}
          </div>
        `;
      }).join('');
    }

    this.updateCostSummary();
  },

  setCategoryTab(cat) {
    this.activeCategoryTab = cat;
    this.activeSearchQuery = '';
    const searchInput = document.getElementById('prod-search-input');
    if (searchInput) searchInput.value = '';
    this.renderProductSelector();
  },

  toggleProductInWizard(prodId) {
    if (this.selectedProductsMap.has(prodId)) {
      this.selectedProductsMap.delete(prodId);
    } else {
      if (this.pendingStoreType && this.selectedProductsMap.size >= this.pendingStoreType.maxShelves) return;
      const offers = this.getSupplierOffers(prodId, this.pendingTile);
      if (offers.length > 0) this.selectedProductsMap.set(prodId, offers[0]);
    }
    this.renderProductSelector();
  },

  updateCostSummary() {
    if (!this.pendingStoreType) return;
    const buildCost = this.pendingStoreType.cost;
    const licenseCost = this.getNicheLicenseCost(this.pendingStoreType.id);
    let stockCost = 0;
    for (const [prodId, offer] of this.selectedProductsMap.entries()) {
      const isInternal = !!offer.type?.startsWith('internal_');
      stockCost += Math.round(100 * (isInternal ? (offer.freight || 0) : offer.landedCost));
    }
    const totalCost  = buildCost + licenseCost + stockCost;
    const currentCash = this.cash;
    const remaining  = currentCash - totalCost;
    const usedSlots  = this.selectedProductsMap.size;
    const maxSlots   = this.pendingStoreType.maxShelves;
    const canConfirm = this.selectedProductsMap.size > 0 && remaining >= 0;

    const summaryBar = document.getElementById('cost-summary-bar');
    if (summaryBar) {
      summaryBar.innerHTML = `
        <div class="flex flex-wrap gap-4 text-[11px] font-mono w-full">
          <span>🏗 Obra: <strong class="text-rose-400">-$${buildCost.toLocaleString('en-US')}</strong></span>
          ${licenseCost > 0 ? `<span>📜 Licença de Nicho: <strong class="text-amber-400">-$${licenseCost.toLocaleString('en-US')}</strong></span>` : ''}
          <span>📦 Estoque: <strong class="text-rose-400">-$${stockCost.toLocaleString('en-US')}</strong></span>
          <span class="font-bold">Total: <strong class="text-rose-300">-$${totalCost.toLocaleString('en-US')}</strong></span>
          <span class="ml-auto">Gôndolas: <strong class="${usedSlots >= maxSlots ? 'text-amber-400' : 'text-slate-200'}">${usedSlots}/${maxSlots}</strong></span>
          <span>Saldo após: <strong class="${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}">$${remaining.toLocaleString('en-US')}</strong></span>
        </div>
      `;
    }

    const btnConfirm = document.getElementById('btn-confirm-store');
    if (btnConfirm) {
      btnConfirm.disabled = !canConfirm;
      btnConfirm.textContent = canConfirm
        ? (licenseCost > 0
            ? `📜 Homologar Licença & Abrir ${this.pendingStoreType.name} (-$${totalCost.toLocaleString('en-US')})`
            : `✅ Confirmar e Abrir ${this.pendingStoreType.name} (-$${totalCost.toLocaleString('en-US')})`)
        : (remaining < 0 ? '❌ Caixa insuficiente' : 'Selecione ao menos 1 produto');
    }
  },

  confirmOpenStore() {
    if (this.selectedProductsMap.size === 0 || !this.pendingStoreType || !this.pendingTile) return;
    const buildCost = this.pendingStoreType.cost;
    const licenseCost = this.getNicheLicenseCost(this.pendingStoreType.id);
    let stockCost = 0;
    for (const [prodId, offer] of this.selectedProductsMap.entries()) {
      stockCost += Math.round(100 * offer.landedCost);
    }
    const totalCost = buildCost + licenseCost + stockCost;
    if (this.cash < totalCost) {
      alert(`Fundos insuficientes! São necessários $${totalCost.toLocaleString('en-US')} para esta inauguração.`);
      return;
    }

    const targetTile = this.pendingTile;
    const targetStoreType = this.pendingStoreType;
    const targetProductsMap = new Map(this.selectedProductsMap);

    this.checkWorkingCapitalSafety(totalCost, () => {
      this.cash -= totalCost;

      // Se a corporação ainda não possuía a licença do nicho, registra e emite log
      if (licenseCost > 0) {
        this.acquiredLicenses.add(targetStoreType.id);
        const licenses = (typeof STORE_NICHE_LICENSES !== 'undefined' ? STORE_NICHE_LICENSES : window.STORE_NICHE_LICENSES) || {};
        const lic = licenses[targetStoreType.id] || null;
        this.addLog(`📜 [LICENCIAMENTO] Corporação homologada com a "${lic ? lic.name : targetStoreType.name}" por $${licenseCost.toLocaleString('en-US')}! Próximas filiais pagarão apenas a obra civil.`, 'text-amber-300 font-bold');
      }

      const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};
      const shelves = {};
      for (const [prodId, offer] of targetProductsMap.entries()) {
        const prod = catalog[prodId];
        shelves[prodId] = {
          price: prod.standardPrice,
          stock: 100,
          maxCapacity: 1000,
          dailyRestock: Math.max(10, Math.round((prod.perCapitaDailyDemand || 0.05) * (targetTile.district?.population || 100000) * 0.5)),
          quality: offer.quality,
          supplierId: offer.supplierId,
          supplierName: offer.supplierName,
          wholesalePrice: offer.wholesalePrice,
          unitFreight: offer.freight,
          landedCost: offer.landedCost
        };
      }

      const rentMult = targetStoreType.rentMultiplier || 1.0;
      const actualRent = (targetTile.district?.landRentDaily || 50) * rentMult;
      const storeName  = `${targetStoreType.emoji} ${targetStoreType.name} (${targetTile.district?.name || 'Metrópole'})`;

      targetTile.store = {
        storeTypeId:     targetStoreType.id,
        name:            storeName,
        maxShelves:      targetStoreType.maxShelves,
        rentMultiplier:  rentMult,
        dailyRent:       actualRent,
        shelves,
      };
      targetTile.buildingHeight = 20;
      this._indexTile(targetTile);

      this.addLog(`🏗️ ${storeName} inaugurada por $${totalCost.toLocaleString()}!`, 'text-emerald-400 font-bold');
      if (typeof window !== 'undefined' && window.SoundEngine && typeof window.SoundEngine.playBuild === 'function') {
        window.SoundEngine.playBuild();
      }

      this.closeStoreWizard();
      if (typeof window !== 'undefined') window.activeManagedTile = targetTile;
      this.renderFacility(targetTile);
      this.scheduleRender();
      this.updateUI();
    }, targetStoreType.name);
  },

  closeStoreWizard() {
    const modal = document.getElementById('store-modal');
    if (modal) modal.classList.add('hidden');
    this.pendingStoreTile = null;
    this.pendingStoreType = null;
    this.selectedProductsMap.clear();
  },

  // =========================================================================
  // 2. MODAL DE ADIÇÃO DE PRODUTO ÀS GÔNDOLAS (GÔNDOLAS VAZIAS)
  // =========================================================================

  openAddProductModal(x, y) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.store) return;
    this.addProductTargetTile = tile;

    const whitelist = (typeof STORE_CATEGORY_WHITELIST !== 'undefined' ? STORE_CATEGORY_WHITELIST : window.STORE_CATEGORY_WHITELIST) || {};
    const allowedCats = whitelist[tile.store.storeTypeId] || ['Alimentos'];
    this.activeAddProductCategoryTab = allowedCats[0];
    this.renderAddProductModalList();

    const modal = document.getElementById('add-product-modal');
    if (modal) modal.classList.remove('hidden');
  },

  setAddProductCategoryTab(cat) {
    this.activeAddProductCategoryTab = cat;
    this.renderAddProductModalList();
  },

  renderAddProductModalList() {
    if (!this.addProductTargetTile?.store) return;
    const tile = this.addProductTargetTile;
    const store = tile.store;

    const whitelist = (typeof STORE_CATEGORY_WHITELIST !== 'undefined' ? STORE_CATEGORY_WHITELIST : window.STORE_CATEGORY_WHITELIST) || {};
    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};

    const allowedCats = whitelist[store.storeTypeId];
    const categories = allowedCats && allowedCats.length > 0 
      ? allowedCats 
      : [...new Set(Object.values(catalog).map(p => p.category))];

    if (!categories.includes(this.activeAddProductCategoryTab)) {
      this.activeAddProductCategoryTab = categories[0];
    }

    const tabsContainer = document.getElementById('add-prod-category-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = categories.map(cat => `
        <button onclick="setAddProductCategoryTab('${cat}')"
          class="px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer
            ${this.activeAddProductCategoryTab === cat ? 'bg-emerald-700 text-slate-100 font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}">
          ${cat}
        </button>
      `).join('');
    }

    const list = document.getElementById('add-prod-available-list');
    if (!list) return;

    const availableProds = Object.values(catalog)
      .filter(p => p.category === this.activeAddProductCategoryTab && !p.isIntermediate && !store.shelves[p.id]);

    if (availableProds.length === 0) {
      list.innerHTML = `<p class="text-xs text-slate-500 font-mono text-center py-6">Todos os produtos desta categoria já estão em suas gôndolas ou não há itens disponíveis.</p>`;
      return;
    }

    // Ordenar produtos: primeiro os que o CONGLOMERADO do jogador produz ou armazena!
    availableProds.sort((a, b) => {
      const offersA = this.getSupplierOffers(a.id, tile);
      const offersB = this.getSupplierOffers(b.id, tile);
      const aInternal = offersA[0]?.type?.startsWith('internal_') ? 1 : 0;
      const bInternal = offersB[0]?.type?.startsWith('internal_') ? 1 : 0;
      if (aInternal !== bInternal) return bInternal - aInternal;
      return a.name.localeCompare(b.name);
    });

    const compName = this.playerProfile.companyName || 'Holding';
    const currentCash = this.cash;

    list.innerHTML = availableProds.map(prod => {
      const offers = this.getSupplierOffers(prod.id, tile);
      const bestOffer = offers[0] || null;
      if (!bestOffer) return '';

      const isInternal = !!bestOffer.type?.startsWith('internal_');
      const initCost = Math.round(50 * (isInternal ? (bestOffer.freight || 0) : bestOffer.landedCost));
      const canAfford = isInternal || (currentCash >= initCost);

      if (isInternal) {
        return `
          <div class="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-3 rounded-xl border-2 border-emerald-500/70 shadow-lg shadow-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between text-xs font-mono gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded shadow tracking-wider">
                  🏛️ CONGLOMERADO: ${compName}
                </span>
                <span class="bg-emerald-950 text-emerald-300 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-700">
                  ${bestOffer.ownerTag || (bestOffer.type === 'internal_warehouse' ? '📦 ARMAZÉM CENTRAL' : '✨ PRODUÇÃO PRÓPRIA')}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-100">${prod.name}</span>
                <span class="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">QR: ${bestOffer.quality}</span>
              </div>
              <div class="text-[10px] text-emerald-300 font-bold flex items-center gap-1.5 flex-wrap">
                <span>🏢 Origem: <strong>${bestOffer.facilityName || bestOffer.supplierName}</strong></span>
                <span class="text-slate-400">· Frete: <strong class="text-emerald-400">$${(bestOffer.freight || 0).toFixed(2)}/un</strong></span>
                <span class="text-slate-400">· Disponível: <strong class="text-slate-200">${bestOffer.stockLabel || 'Estoque da Holding'}</strong></span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-[10px] text-slate-300 mb-1">
                1º Estoque (50 un): <strong class="text-emerald-400 font-bold">${initCost > 0 ? `Frete -$${initCost.toLocaleString()}` : '$0.00 (Transferência Própria)'}</strong>
              </div>
              <button onclick="confirmAddNewProductToStore('${prod.id}')"
                class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-emerald-900/40 transition flex items-center gap-1.5 ml-auto">
                <span>➕ Abastecer da Holding</span>
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between text-xs font-mono gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="bg-sky-950 text-sky-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-sky-800/80">🚢 IMPORTAÇÃO MARÍTIMA</span>
              <span class="font-bold text-slate-100">${prod.name}</span>
              <span class="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">QR: ${bestOffer.quality}</span>
            </div>
            <div class="text-[10px] text-slate-400">
              Terminal: <strong class="text-slate-300">${bestOffer.supplierName.split('(')[0].trim()}</strong> · Atacado + Frete: <strong class="text-emerald-400">$${bestOffer.landedCost.toFixed(2)}/un</strong>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-[10px] text-slate-400 mb-1">
              1º Lote (50 un): <strong class="${canAfford ? 'text-rose-400' : 'text-rose-500'} font-bold">$${initCost.toLocaleString()}</strong>
            </div>
            ${!canAfford ? `
              <div class="flex flex-col items-end gap-1">
                <span class="text-[9px] text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/80">
                  🔒 Caixa Insuficiente ($${currentCash.toLocaleString()} / $${initCost.toLocaleString()})
                </span>
                <button disabled title="Você não possui $${initCost.toLocaleString()} em caixa para pagar este lote de importação à vista."
                  class="bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700">
                  🔒 Sem Saldo
                </button>
              </div>
            ` : `
              <button onclick="confirmAddNewProductToStore('${prod.id}')"
                class="bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow transition">
                ➕ Comprar e Adicionar
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  confirmAddNewProductToStore(prodId) {
    if (!this.addProductTargetTile?.store) return;
    const tile = this.addProductTargetTile;
    const store = tile.store;

    const offers = this.getSupplierOffers(prodId, tile);
    if (offers.length === 0) return;
    const offer = offers[0];

    const isInternal = !!offer.type?.startsWith('internal_');
    const initCost = Math.round(50 * (isInternal ? (offer.freight || 0) : offer.landedCost));

    if (!isInternal && this.cash < initCost) {
      this.addLog(`⚠ Saldo insuficiente para importar 50 un de ${prodId} ($${initCost.toLocaleString()})!`, 'text-rose-400');
      return;
    }

    if (this.cash >= initCost) {
      this.cash -= initCost;
    }

    // Se for fornecimento interno e a fonte tiver estoque físico, transfere até 50 un da fonte
    let initialStock = 50;
    if (offer.supplierId?.startsWith('farm_')) {
      const parts = offer.supplierId.split('_');
      const fx = Number(parts[1]), fy = Number(parts[2]);
      const farmTile = this.worldGrid[fx]?.[fy];
      if (farmTile?.farm && farmTile.farm.stock > 0) {
        const drain = Math.min(farmTile.farm.stock, 50);
        farmTile.farm.stock -= drain;
      }
    } else if (offer.supplierId?.startsWith('factory_')) {
      const parts = offer.supplierId.split('_');
      const fx = Number(parts[1]), fy = Number(parts[2]), rId = parts.slice(3).join('_');
      const facTile = this.worldGrid[fx]?.[fy];
      const line = facTile?.factory?.lines?.[rId];
      if (line && line.finishedStock > 0) {
        const drain = Math.min(line.finishedStock, 50);
        line.finishedStock -= drain;
      }
    } else if (offer.supplierId?.startsWith('warehouse_')) {
      const parts = offer.supplierId.split('_');
      const wx = Number(parts[1]), wy = Number(parts[2]);
      const whTile = this.worldGrid[wx]?.[wy];
      const whItem = whTile?.warehouse?.inventory?.[prodId];
      if (whItem && whItem.stock > 0) {
        const drain = Math.min(whItem.stock, 50);
        whItem.stock -= drain;
      }
    }

    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};
    const prod = catalog[prodId];

    store.shelves[prodId] = {
      price: prod.standardPrice,
      stock: initialStock,
      maxCapacity: 1000,
      dailyRestock: Math.max(10, Math.round((prod.perCapitaDailyDemand || 0.05) * (tile.district?.population || 100000) * 0.5)),
      quality: offer.quality,
      supplierId: offer.supplierId,
      supplierName: offer.supplierName,
      wholesalePrice: offer.wholesalePrice,
      unitFreight: offer.freight,
      landedCost: offer.landedCost
    };

    const compName = this.playerProfile.companyName || 'Holding';
    if (isInternal) {
      this.addLog(`✨ [${compName}] ${prod.name} abastecido nas gôndolas de ${store.name} via ${offer.supplierName}!`, 'text-emerald-400 font-bold');
    } else {
      this.addLog(`✨ ${prod.name} importado e adicionado às gôndolas de ${store.name} (-$${initCost.toLocaleString()})!`, 'text-sky-400 font-bold');
    }

    this.renderAddProductModalList();
    this.renderFacility(tile);
    this.updateUI();
  },

  closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) modal.classList.add('hidden');
    this.addProductTargetTile = null;
  },

  // =========================================================================
  // 3. OPERAÇÕES DE GÔNDOLAS (PREÇOS, REPOSIÇÃO, REMOÇÃO & COMPRA IMEDIATA)
  // =========================================================================

  removeProductFromStore(x, y, prodId) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.store?.shelves?.[prodId]) return;
    delete tile.store.shelves[prodId];
    this.renderFacility(tile);
  },

  updateShelfPrice(x, y, prodId, val) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.store?.shelves?.[prodId]) return;
    const p = parseFloat(val);
    if (p > 0) {
      tile.store.shelves[prodId].price = p;
      if (typeof window !== 'undefined' && window.activeManagedTile?.x === x && window.activeManagedTile?.y === y) {
        this.renderFacility(tile);
      }
    }
  },

  updateShelfRestock(x, y, prodId, val) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.store?.shelves?.[prodId]) return;
    const q = parseInt(val);
    if (q >= 0) tile.store.shelves[prodId].dailyRestock = q;
  },

  buyInstantStock(x, y, prodId, qty) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.store?.shelves?.[prodId]) return;

    const shelf = tile.store.shelves[prodId];
    const maxPossible = shelf.maxCapacity - shelf.stock;
    const actualQty = Math.min(qty, maxPossible);
    if (actualQty <= 0) return;

    let transferredInternal = 0;
    let internalSourceName = '';

    // 1. Se o fornecedor configurado for uma fazenda/granja própria, drena primeiro do silo interno
    if (shelf.supplierId?.startsWith('farm_')) {
      const parts = shelf.supplierId.split('_');
      const fx = Number(parts[1]), fy = Number(parts[2]);
      const farmTile = this.worldGrid[fx]?.[fy];
      if (farmTile?.farm && farmTile.farm.stock > 0) {
        transferredInternal = Math.min(farmTile.farm.stock, actualQty);
        farmTile.farm.stock = Math.max(0, farmTile.farm.stock - transferredInternal);
        internalSourceName = farmTile.farm.name;
      }
    }
    // 2. Se for uma fábrica própria, drena do estoque de produtos acabados da linha
    else if (shelf.supplierId?.startsWith('factory_')) {
      const parts = shelf.supplierId.split('_');
      const fx = Number(parts[1]), fy = Number(parts[2]), rId = parts.slice(3).join('_');
      const facTile = this.worldGrid[fx]?.[fy];
      const line = facTile?.factory?.lines?.[rId];
      if (line && line.finishedStock > 0) {
        transferredInternal = Math.min(line.finishedStock, actualQty);
        line.finishedStock = Math.max(0, line.finishedStock - transferredInternal);
        internalSourceName = `${facTile.factory.name} (${line.productName || 'Fábrica'})`;
      }
    }
    // 3. Se for um armazém logístico próprio, drena do estoque consolidado
    else if (shelf.supplierId?.startsWith('warehouse_')) {
      const parts = shelf.supplierId.split('_');
      const wx = Number(parts[1]), wy = Number(parts[2]);
      const whTile = this.worldGrid[wx]?.[wy];
      const whItem = whTile?.warehouse?.inventory?.[prodId];
      if (whItem && whItem.stock > 0) {
        transferredInternal = Math.min(whItem.stock, actualQty);
        whItem.stock = Math.max(0, whItem.stock - transferredInternal);
        internalSourceName = `${whTile.warehouse.name} (Armazém)`;
      }
    }

    const neededFromMarket = actualQty - transferredInternal;
    let costMarket = 0;
    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};

    if (neededFromMarket > 0) {
      const macroWholesaleMult = (typeof window !== 'undefined' && window.MacroCycleSystem) ? window.MacroCycleSystem.getWholesaleCostMultiplier(this.year) : 1.0;
      const unitCost = (shelf.landedCost || catalog[prodId]?.baseCost || 1) * macroWholesaleMult;
      costMarket = Math.round(neededFromMarket * unitCost);
      if (this.cash < costMarket) {
        if (transferredInternal > 0) {
          shelf.stock += transferredInternal;
          this.addLog(`📦 Transferidas ${transferredInternal} un de ${catalog[prodId]?.name || prodId} de ${internalSourceName} (Custo $0)!`, 'text-emerald-400 font-bold');
          this.renderFacility(tile);
          this.updateUI();
        } else {
          this.addLog(`⚠ Caixa insuficiente para comprar ${neededFromMarket} un ($${costMarket.toLocaleString()})!`, 'text-amber-400');
        }
        return;
      }
      this.cash -= costMarket;
    }

    shelf.stock += actualQty;

    if (transferredInternal > 0 && neededFromMarket > 0) {
      this.addLog(`📦 Transferidas ${transferredInternal} un de ${internalSourceName} + ${neededFromMarket} un compradas (-$${costMarket.toLocaleString()})!`, 'text-emerald-400 font-bold');
    } else if (transferredInternal > 0) {
      this.addLog(`📦 Transferidas ${transferredInternal} un de ${catalog[prodId]?.name || prodId} direto de ${internalSourceName} (Custo $0)!`, 'text-emerald-400 font-bold');
    } else {
      const macroWholesaleMult = (typeof window !== 'undefined' && window.MacroCycleSystem) ? window.MacroCycleSystem.getWholesaleCostMultiplier(this.year) : 1.0;
      const macroDiscountStr = macroWholesaleMult < 1.0 ? ` (Estoque Estratégico com -${Math.round((1 - macroWholesaleMult)*100)}% de desconto macro)` : '';
      this.addLog(`📦 Compradas ${actualQty} un de ${catalog[prodId]?.name || prodId} do fornecedor (-$${costMarket.toLocaleString()})${macroDiscountStr}!`, 'text-emerald-400 font-bold');
    }

    this.renderFacility(tile);
    this.updateUI();
  }
};

if (typeof window !== 'undefined') {
  window.StoreWizard = StoreWizard;
  window.hasNicheLicense = (typeId) => StoreWizard.hasNicheLicense(typeId);
  window.getNicheLicenseCost = (typeId) => StoreWizard.getNicheLicenseCost(typeId);
  window.openStoreModal = (tile) => StoreWizard.openStoreWizard(tile);
  window.openStoreWizard = (tile) => StoreWizard.openStoreWizard(tile);
  window.selectStoreType = (typeId) => StoreWizard.selectStoreType(typeId);
  window.advanceToStep2 = () => StoreWizard.advanceToStep2();
  window.backToStep1 = () => StoreWizard.backToStep1();
  window.setCategoryTab = (cat) => StoreWizard.setCategoryTab(cat);
  window.toggleProductInWizard = (prodId) => StoreWizard.toggleProductInWizard(prodId);
  window.confirmOpenStore = () => StoreWizard.confirmOpenStore();
  window.closeStoreWizard = () => StoreWizard.closeStoreWizard();
  window.openAddProductModal = (x, y) => StoreWizard.openAddProductModal(x, y);
  window.setAddProductCategoryTab = (cat) => StoreWizard.setAddProductCategoryTab(cat);
  window.confirmAddNewProductToStore = (prodId) => StoreWizard.confirmAddNewProductToStore(prodId);
  window.closeAddProductModal = () => StoreWizard.closeAddProductModal();
  window.removeProductFromStore = (x, y, prodId) => StoreWizard.removeProductFromStore(x, y, prodId);
  window.updateShelfPrice = (x, y, prodId, val) => StoreWizard.updateShelfPrice(x, y, prodId, val);
  window.updateShelfRestock = (x, y, prodId, val) => StoreWizard.updateShelfRestock(x, y, prodId, val);
  window.updateStepIndicator = (step) => StoreWizard.updateStepIndicator(step);
  window.renderStoreTypeCards = () => StoreWizard.renderStoreTypeCards();
  window.updateCostSummary = () => StoreWizard.updateCostSummary();
  window.filterProductSelectorSearch = (query) => StoreWizard.filterProductSelectorSearch(query);
  window.renderProductSelector = (container) => StoreWizard.renderProductSelector(container);
  window.buyInstantStock = (x, y, prodId, qty) => StoreWizard.buyInstantStock(x, y, prodId, qty);

  try {
    Object.defineProperty(window, 'selectedProductsMap', {
      get() { return StoreWizard.selectedProductsMap; },
      set(v) { StoreWizard.selectedProductsMap = v; },
      configurable: true
    });
    Object.defineProperty(window, 'pendingStoreType', {
      get() { return StoreWizard.pendingStoreType; },
      set(v) { StoreWizard.pendingStoreType = v; },
      configurable: true
    });
    Object.defineProperty(window, 'pendingTile', {
      get() { return StoreWizard.pendingTile; },
      set(v) { StoreWizard.pendingTile = v; },
      configurable: true
    });
  } catch (e) {}
}

export default StoreWizard;
