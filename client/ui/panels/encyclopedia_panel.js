/**
 * OIKONOMIA - Specialized Corporate Encyclopedia & Wiki Controller
 * client/ui/panels/encyclopedia_panel.js
 *
 * Handles:
 * - Product catalog exploration, detailed technical specs & reverse production chain
 * - Factory assembly lines and recipes
 * - Retail store formats, capacity and licensing
 * - Natural resources, extractive mines and farm types
 * - City profiles and transportation logistics
 * - Industrial chain sizing calculator
 * - Core economic formulas and simulation concepts
 */

export const EncyclopediaPanel = {
  state: {
    currentTab: 'products',
    selectedItemId: null,
    searchQuery: '',
    selectedCategory: 'all',
    selectedTier: 'all',
    history: [],
    historyIndex: -1,
    calcProductId: 'bread',
    calcTargetAmount: 500
  },

  openEncyclopediaModal(tab = 'products', targetId = null) {
    const modal = document.getElementById('encyclopedia-modal');
    if (!modal) return;

    this.state.currentTab = tab;
    this.state.selectedItemId = targetId;
    this.state.searchQuery = '';
    const searchInput = document.getElementById('wiki-search-input');
    if (searchInput) searchInput.value = '';

    // Reseta histórico para este ponto de entrada
    this.state.history = [{ tab, targetId, search: '' }];
    this.state.historyIndex = 0;
    this.updateEncyclopediaHistoryButtons();

    modal.classList.remove('hidden');
    this.updateEncyclopediaTabButtons();
    this.renderEncyclopediaContent();
  },

  closeEncyclopediaModal() {
    const modal = document.getElementById('encyclopedia-modal');
    if (modal) modal.classList.add('hidden');
  },

  toggleEncyclopediaModal() {
    const modal = document.getElementById('encyclopedia-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
      this.openEncyclopediaModal(this.state.currentTab || 'products', this.state.selectedItemId);
    } else {
      this.closeEncyclopediaModal();
    }
  },

  navigateEncyclopedia(tab, targetId = null) {
    this.state.currentTab = tab;
    this.state.selectedItemId = targetId;
    this.state.searchQuery = '';
    const searchInput = document.getElementById('wiki-search-input');
    if (searchInput) searchInput.value = '';

    // Adiciona ao histórico
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    }
    this.state.history.push({ tab, targetId, search: '' });
    this.state.historyIndex = this.state.history.length - 1;
    this.updateEncyclopediaHistoryButtons();

    this.updateEncyclopediaTabButtons();
    this.renderEncyclopediaContent();
  },

  encyclopediaHistoryBack() {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      const item = this.state.history[this.state.historyIndex];
      this.state.currentTab = item.tab;
      this.state.selectedItemId = item.targetId;
      this.state.searchQuery = item.search || '';
      const searchInput = document.getElementById('wiki-search-input');
      if (searchInput) searchInput.value = this.state.searchQuery;

      this.updateEncyclopediaHistoryButtons();
      this.updateEncyclopediaTabButtons();
      this.renderEncyclopediaContent();
    }
  },

  encyclopediaHistoryForward() {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      const item = this.state.history[this.state.historyIndex];
      this.state.currentTab = item.tab;
      this.state.selectedItemId = item.targetId;
      this.state.searchQuery = item.search || '';
      const searchInput = document.getElementById('wiki-search-input');
      if (searchInput) searchInput.value = this.state.searchQuery;

      this.updateEncyclopediaHistoryButtons();
      this.updateEncyclopediaTabButtons();
      this.renderEncyclopediaContent();
    }
  },

  updateEncyclopediaHistoryButtons() {
    const btnBack = document.getElementById('wiki-history-back');
    const btnFwd = document.getElementById('wiki-history-forward');
    if (btnBack) btnBack.disabled = this.state.historyIndex <= 0;
    if (btnFwd) btnFwd.disabled = this.state.historyIndex >= this.state.history.length - 1;
  },

  switchEncyclopediaTab(tab) {
    this.state.currentTab = tab;
    this.state.selectedItemId = null;
    this.updateEncyclopediaTabButtons();
    this.renderEncyclopediaContent();
  },

  updateEncyclopediaTabButtons() {
    const tabs = ['products', 'factories', 'stores', 'resources', 'cities', 'calculator', 'concepts'];
    tabs.forEach(t => {
      const btn = document.getElementById(`wiki-tab-${t}`);
      if (!btn) return;
      if (t === this.state.currentTab) {
        btn.className = 'px-3 py-1.5 rounded-lg font-bold transition bg-blue-600 text-white shadow';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition';
      }
    });
  },

  onEncyclopediaSearch(query) {
    this.state.searchQuery = (query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('wiki-search-clear');
    if (clearBtn) {
      if (this.state.searchQuery) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    this.renderEncyclopediaContent();
  },

  clearEncyclopediaSearch() {
    this.state.searchQuery = '';
    const input = document.getElementById('wiki-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('wiki-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.renderEncyclopediaContent();
  },

  renderEncyclopediaContent() {
    const container = document.getElementById('encyclopedia-content-container');
    if (!container) return;

    switch (this.state.currentTab) {
      case 'products':
        container.innerHTML = this.renderEncyclopediaProductsView();
        break;
      case 'factories':
        container.innerHTML = this.renderEncyclopediaFactoriesView();
        break;
      case 'stores':
        container.innerHTML = this.renderEncyclopediaStoresView();
        break;
      case 'resources':
        container.innerHTML = this.renderEncyclopediaResourcesView();
        break;
      case 'cities':
        container.innerHTML = this.renderEncyclopediaCitiesView();
        break;
      case 'calculator':
        container.innerHTML = this.renderEncyclopediaCalculatorView();
        break;
      case 'concepts':
        container.innerHTML = this.renderEncyclopediaConceptsView();
        break;
      default:
        container.innerHTML = `<div class="text-slate-500 text-center py-10">Aba em desenvolvimento.</div>`;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 1: PRODUTOS & MERCADORIAS (COM FICHA TÉCNICA E CADEIA REVERSA)
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaProductsView() {
    const q = this.state.searchQuery;
    const selId = this.state.selectedItemId;
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
    const FARM_TYPES = window.FARM_TYPES || [];
    const NATURAL_MINES = window.NATURAL_MINES || [];
    const STORE_TYPES = window.STORE_TYPES || [];
    const STORE_CATEGORY_WHITELIST = window.STORE_CATEGORY_WHITELIST || {};
    const CoreMath = window.CoreMath;

    // Se há um produto selecionado, renderiza sua Ficha Técnica Detalhada
    if (selId && PRODUCT_CATALOG[selId]) {
      const prod = PRODUCT_CATALOG[selId];
      const recipe = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(prod.id) : FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id));
      const farm = FARM_TYPES.find(f => f.cropId === prod.id);
      const mine = NATURAL_MINES.find(m => m.resourceId === prod.id);
      const tier = CoreMath ? CoreMath.determineProductTier(prod.id, FACTORY_RECIPES) : 0;

      // Preço e Custos
      const baseCost = prod.baseCost || 1.0;
      const stdPrice = prod.standardPrice || (baseCost * 2.0);
      const factoryCost = recipe ? recipe.unitCost : (baseCost * 1.5);
      const wholesaleCost = Math.max(factoryCost * 1.15, stdPrice * 0.65);
      const landedCost = Number((wholesaleCost * 1.04).toFixed(2));
      const marginGross = Number((stdPrice - landedCost).toFixed(2));
      const marginPct = Math.round((marginGross / stdPrice) * 100);

      // Encontra onde é usado (Cadeia Reversa)
      const usedInRecipes = FACTORY_RECIPES.filter(r => r.inputs && r.inputs[prod.id]);

      // Lojas autorizadas a vender
      const allowedStores = STORE_TYPES.filter(st => {
        const cats = STORE_CATEGORY_WHITELIST[st.id] || [];
        return cats.includes(prod.category) && !prod.isIntermediate;
      });

      const qW = prod.qualityWeight || 40;
      const bW = prod.brandWeight || 20;
      const pW = Math.max(0, 100 - (qW + bW));

      return `
        <div class="space-y-4 max-w-4xl mx-auto">
          <!-- Header do Produto -->
          <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner shrink-0">
                ${prod.emoji || '📦'}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold text-slate-100">${prod.name}</h2>
                  <span class="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">Tier ${tier}</span>
                  <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">${prod.category}</span>
                </div>
                <div class="text-xs text-slate-400 font-mono mt-1">ID: <code class="text-cyan-300">${prod.id}</code> · Tipo: <strong class="${prod.isIntermediate ? 'text-amber-400' : 'text-emerald-400'}">${prod.isIntermediate ? 'Insumo Manufaturado (B2B)' : 'Produto de Consumo (Varejo)'}</strong></div>
              </div>
            </div>
            <button onclick="navigateEncyclopedia('products', null)" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono">
              ◄ Ver Todos os Produtos
            </button>
          </div>

          <!-- Grade de Métricas Econômicas -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Preço Padrão (Varejo)</span>
              <span class="text-sm font-bold text-emerald-400 font-mono">$${stdPrice.toFixed(2)}</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Custo Base: $${baseCost.toFixed(2)}</span>
            </div>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Margem Bruta Unitária</span>
              <span class="text-sm font-bold ${marginGross > 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono">${marginGross > 0 ? `+$${marginGross}` : `-$${Math.abs(marginGross)}`} (${marginPct}%)</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Custo Entrega: $${landedCost.toFixed(2)}</span>
            </div>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Demanda / Necessidade</span>
              <span class="text-sm font-bold text-cyan-400 font-mono">${(prod.perCapitaDailyDemand || 0.01).toFixed(3)} un/hab/dia</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Índice Necessidade: ${prod.necessityIndex || 50}/100</span>
            </div>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span class="text-[10px] text-slate-500 block uppercase">Pesos do Consumidor</span>
              <div class="text-[10px] font-mono text-slate-300 mt-1 flex justify-between">
                <span class="text-cyan-300">Qual: ${qW}%</span>
                <span class="text-indigo-300">Marca: ${bW}%</span>
                <span class="text-amber-300">Preço: ${pW}%</span>
              </div>
            </div>
          </div>

          <!-- Como Obter / Cadeia de Origem -->
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <span>🏭 Origem & Processo de Fabricação</span>
            </h3>
            ${recipe ? `
              <div class="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div>
                  <div class="font-bold text-orange-300 text-sm">${recipe.name}</div>
                  <div class="text-slate-400 text-[11px] mt-0.5">Capacidade: <strong class="text-slate-200">${recipe.dailyCap} un/dia</strong> · Custo de Linha: <strong class="text-emerald-400">$${recipe.unitCost.toFixed(2)}/un</strong></div>
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="openEncyclopediaModal('calculator', '${prod.id}')" class="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-[10px] font-mono font-bold">
                    📐 Calcular Linhas
                  </button>
                </div>
              </div>
              ${recipe.inputs && Object.keys(recipe.inputs).length > 0 ? `
                <div class="space-y-1.5">
                  <span class="text-[11px] text-slate-400 block">Insumos Necessários por Unidade:</span>
                  <div class="flex flex-wrap gap-2">
                    ${Object.entries(recipe.inputs).map(([inpId, qty]) => {
                      const inpProd = PRODUCT_CATALOG[inpId] || { name: inpId };
                      return `
                        <button onclick="navigateEncyclopedia('products', '${inpId}')"
                          class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition text-slate-200">
                          <span class="text-emerald-400 font-bold">${qty}x</span>
                          <span>${inpProd.name}</span>
                          <span class="text-[10px] text-slate-500">🔗</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : `<div class="text-xs text-slate-500">Esta receita utiliza matérias-primas diretas ou processamento próprio.</div>`}
            ` : (farm ? `
              <div class="bg-slate-900/90 p-3 rounded-xl border border-emerald-800/60 text-xs">
                <div class="font-bold text-emerald-300 text-sm">🌾 Produzido em: ${farm.name}</div>
                <div class="text-slate-400 text-[11px] mt-1">Rendimento Agrícola: <strong class="text-slate-200">${farm.dailyYield} un/dia</strong> · Custo Unitário: <strong class="text-emerald-400">$${farm.unitCost.toFixed(2)}/un</strong> · Solo: <strong class="text-amber-300">${farm.requiresFertileSoil ? 'Requer Solo Fértil' : 'Qualquer Terreno'}</strong></div>
              </div>
            ` : (mine ? `
              <div class="bg-slate-900/90 p-3 rounded-xl border border-amber-800/60 text-xs">
                <div class="font-bold text-amber-300 text-sm">⛏️ Extraído em: ${mine.name}</div>
                <div class="text-slate-400 text-[11px] mt-1">Rendimento de Extração: <strong class="text-slate-200">${mine.dailyYield} un/dia</strong> · Custo Unitário: <strong class="text-emerald-400">$${mine.unitCost.toFixed(2)}/un</strong></div>
              </div>
            ` : `
              <div class="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                ⚓ Disponível para importação nos Terminais Portuários Internacionais da Baía de Nova Atenas e Porto Real.
              </div>
            `))}
          </div>

          <!-- Cadeia Reversa ("Usado em Quais Produtos?") -->
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center justify-between">
              <span>🔄 Utilizado como Insumo nas Seguintes Cadeias (${usedInRecipes.length}):</span>
            </h3>
            ${usedInRecipes.length > 0 ? `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${usedInRecipes.map(r => {
                  const outProd = PRODUCT_CATALOG[r.outputProdId] || { name: r.outputName || r.id };
                  const qtyNeeded = r.inputs[prod.id] || 1;
                  return `
                    <div onclick="navigateEncyclopedia('products', '${r.outputProdId}')"
                      class="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition">
                      <div>
                        <div class="text-xs font-bold text-slate-200">${outProd.name}</div>
                        <div class="text-[10px] text-slate-400 font-mono">Receita: ${r.name}</div>
                      </div>
                      <div class="text-right font-mono">
                        <span class="text-[10px] text-amber-400 font-bold">Consome ${qtyNeeded}x</span>
                        <span class="text-[10px] text-slate-500 block">Abrir ➔</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="text-xs text-slate-500 font-mono">Este é um produto final de consumo direto e não é utilizado como insumo em outras receitas fabris.</div>
            `}
          </div>

          <!-- Onde Vender (Lojas de Varejo) -->
          ${!prod.isIntermediate ? `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wide">🏪 Estabelecimentos Comerciais Autorizados</h3>
              <div class="flex flex-wrap gap-2">
                ${allowedStores.map(st => `
                  <div class="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 font-mono text-xs">
                    <span>${st.emoji}</span>
                    <span class="font-bold text-slate-200">${st.name}</span>
                    <span class="text-[10px] text-slate-400">(${st.maxShelves} slots)</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Lista geral de produtos com busca e filtros
    let products = Object.values(PRODUCT_CATALOG);
    if (this.state.selectedCategory !== 'all') {
      products = products.filter(p => p.category === this.state.selectedCategory);
    }
    if (this.state.selectedTier !== 'all') {
      const t = parseInt(this.state.selectedTier);
      products = products.filter(p => CoreMath && CoreMath.determineProductTier(p.id, FACTORY_RECIPES) === t);
    }
    if (q) {
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    const categories = ['all', ...new Set(Object.values(PRODUCT_CATALOG).map(p => p.category))];

    return `
      <div class="space-y-4">
        <!-- Filtros de Categoria e Tier -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] text-slate-500 uppercase font-mono mr-1">Categoria:</span>
            ${categories.map(cat => `
              <button onclick="setEncyclopediaCategoryFilter('${cat}')"
                class="px-2 py-0.5 rounded-lg text-[10px] font-mono transition
                  ${this.state.selectedCategory === cat ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}">
                ${cat === 'all' ? 'Todas' : cat}
              </button>
            `).join('')}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500 uppercase font-mono mr-1">Tier:</span>
            ${['all', '0', '1', '2', '3', '4', '5'].map(t => `
              <button onclick="setEncyclopediaTierFilter('${t}')"
                class="px-2 py-0.5 rounded-lg text-[10px] font-mono transition
                  ${this.state.selectedTier === t ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}">
                ${t === 'all' ? 'Todos' : `T${t}`}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Total de Produtos Encontrados -->
        <div class="text-[11px] text-slate-400 font-mono flex justify-between">
          <span>Mostrando <strong>${products.length}</strong> produtos do catálogo</span>
          ${q ? `<span class="text-cyan-300">Filtrado por: "${q}"</span>` : ''}
        </div>

        <!-- Grade de Cards de Produto -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${products.map(prod => {
            const tier = CoreMath ? CoreMath.determineProductTier(prod.id, FACTORY_RECIPES) : 0;
            const stdPrice = prod.standardPrice || (prod.baseCost * 2.0);
            return `
              <div onclick="navigateEncyclopedia('products', '${prod.id}')"
                class="bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-blue-600/60 p-3 rounded-xl cursor-pointer transition flex flex-col justify-between gap-2 group">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl shrink-0">${prod.emoji || '📦'}</span>
                    <div>
                      <div class="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition">${prod.name}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${prod.category}</div>
                    </div>
                  </div>
                  <span class="text-[9px] bg-blue-950 text-blue-300 border border-blue-800/80 px-1.5 py-0.2 rounded font-mono font-bold">T${tier}</span>
                </div>
                <div class="border-t border-slate-850 pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Preço: <strong class="text-emerald-400">$${stdPrice.toFixed(2)}</strong></span>
                  <span class="text-blue-400 font-bold">Ver Detalhes ➔</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  setEncyclopediaCategoryFilter(cat) {
    this.state.selectedCategory = cat;
    this.renderEncyclopediaContent();
  },

  setEncyclopediaTierFilter(t) {
    this.state.selectedTier = t;
    this.renderEncyclopediaContent();
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 2: FÁBRICAS & RECEITAS INDUSTRIAIS
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaFactoriesView() {
    const q = this.state.searchQuery;
    const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};

    let recipes = FACTORY_RECIPES.slice();
    if (q) {
      recipes = recipes.filter(r => r.name.toLowerCase().includes(q) || (r.outputName && r.outputName.toLowerCase().includes(q)));
    }

    return `
      <div class="space-y-3">
        <div class="text-[11px] text-slate-400 font-mono">Catálogo de <strong>${recipes.length}</strong> Linhas de Montagem e Usinas Industriais</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${recipes.map(rec => {
            const outProd = PRODUCT_CATALOG[rec.outputProdId] || { name: rec.outputName || rec.id };
            const inputsList = rec.inputs ? Object.entries(rec.inputs) : [];
            return `
              <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between">
                    <div class="font-bold text-orange-300 text-xs">${rec.name}</div>
                    <span class="text-[10px] bg-orange-950 text-orange-300 px-1.5 py-0.2 rounded border border-orange-800 font-mono">Linha Industrial</span>
                  </div>
                  <div class="text-[11px] text-slate-300 mt-1">Produto Gerado: <button onclick="navigateEncyclopedia('products', '${rec.outputProdId}')" class="text-cyan-300 font-bold hover:underline">${outProd.name}</button></div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Capacidade Diária: <strong>${rec.dailyCap} un/dia</strong> · Custo de Operação: <strong>$${rec.unitCost.toFixed(2)}/un</strong></div>
                </div>

                ${inputsList.length > 0 ? `
                  <div class="space-y-1">
                    <span class="text-[10px] text-slate-500 uppercase">Insumos Consumidos:</span>
                    <div class="flex flex-wrap gap-1.5">
                      ${inputsList.map(([inpId, qty]) => {
                        const inpProd = PRODUCT_CATALOG[inpId] || { name: inpId };
                        return `
                          <button onclick="navigateEncyclopedia('products', '${inpId}')"
                            class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1">
                            <span class="text-amber-400 font-bold">${qty}x</span>
                            <span>${inpProd.name}</span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>
                ` : `<div class="text-[10px] text-slate-500">Sem insumos externos adicionais.</div>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 3: VAREJO & CONCESSÕES SETORIAIS
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaStoresView() {
    const STORE_TYPES = window.STORE_TYPES || [];
    const STORE_NICHE_LICENSES = window.STORE_NICHE_LICENSES || {};
    const STORE_CATEGORY_WHITELIST = window.STORE_CATEGORY_WHITELIST || {};
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const hasNicheLicense = typeof window.hasNicheLicense === 'function' ? window.hasNicheLicense : () => false;

    return `
      <div class="space-y-4">
        <div class="text-[11px] text-slate-400 font-mono">Os <strong>${STORE_TYPES.length}</strong> Formatos de Lojas Comerciais e suas Concessões Regulatórias</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${STORE_TYPES.map(st => {
            const lic = STORE_NICHE_LICENSES[st.id] || null;
            const hasLic = hasNicheLicense(st.id);
            const allowedCats = STORE_CATEGORY_WHITELIST[st.id] || [];
            const validProds = Object.values(PRODUCT_CATALOG).filter(p => allowedCats.includes(p.category) && !p.isIntermediate);

            return `
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">${st.emoji}</span>
                      <div>
                        <div class="font-bold text-slate-100 text-xs">${st.name}</div>
                        <div class="text-[10px] text-emerald-400 font-mono font-bold">Obra: $${st.cost.toLocaleString('en-US')}</div>
                      </div>
                    </div>
                    ${hasLic ? `
                      <span class="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">✓ Homologado</span>
                    ` : `
                      <span class="text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-mono font-bold">📜 Requer Licença</span>
                    `}
                  </div>

                  <div class="text-[11px] text-slate-400 mt-2">📦 ${st.maxShelves} Gôndolas de Venda · Mult. Aluguel: ${st.rentMultiplier}x</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">${st.desc}</div>

                  ${lic && lic.cost > 0 ? `
                    <div class="mt-2.5 bg-amber-950/30 border border-amber-800/60 p-2 rounded-lg text-[10px] text-amber-300/90 font-mono">
                      ${lic.icon} <strong>${lic.name}</strong>: ${lic.desc} (Taxa Corporativa: <strong>$${lic.cost.toLocaleString('en-US')}</strong>)
                    </div>
                  ` : ''}
                </div>

                <div class="border-t border-slate-850 pt-2 space-y-1">
                  <span class="text-[10px] text-slate-500 uppercase block">Produtos Autorizados (${validProds.length}):</span>
                  <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                    ${validProds.map(p => `
                      <button onclick="navigateEncyclopedia('products', '${p.id}')"
                        class="bg-slate-900 hover:bg-slate-800 border border-slate-750 px-1.5 py-0.5 rounded text-[9px] text-slate-300">
                        ${p.name}
                      </button>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 4: RECURSOS NATURAIS, MINAS & FAZENDAS
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaResourcesView() {
    const NATURAL_MINES = window.NATURAL_MINES || [];
    const FARM_TYPES = window.FARM_TYPES || [];
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};

    return `
      <div class="space-y-5">
        <!-- Minas Naturais -->
        <div class="space-y-2">
          <h3 class="text-xs font-bold text-amber-300 uppercase tracking-wide">⛏️ As 7 Jazidas Minerais & Extrativismo</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${NATURAL_MINES.map(m => {
              const prod = PRODUCT_CATALOG[m.resourceId] || { name: m.resourceName };
              return `
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">${m.emoji}</span>
                    <div>
                      <div class="text-xs font-bold text-slate-100">${m.name}</div>
                      <button onclick="navigateEncyclopedia('products', '${m.resourceId}')" class="text-[10px] text-amber-400 font-bold hover:underline font-mono">
                        Recurso: ${prod.name} ➔
                      </button>
                    </div>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono border-t border-slate-850 pt-1">
                    <div>Rendimento: <strong class="text-slate-200">${m.dailyYield} un/dia</strong></div>
                    <div>Custo Unitário: <strong class="text-emerald-400">$${m.unitCost.toFixed(2)}/un</strong> · Obra: $${m.cost.toLocaleString('en-US')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Fazendas Agrícolas -->
        <div class="space-y-2">
          <h3 class="text-xs font-bold text-emerald-300 uppercase tracking-wide">🌾 As 14 Culturas Agrícolas & Pecuária</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${FARM_TYPES.map(f => {
              const prod = PRODUCT_CATALOG[f.cropId] || { name: f.cropName };
              return `
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">${f.emoji}</span>
                    <div>
                      <div class="text-xs font-bold text-slate-100">${f.name}</div>
                      <button onclick="navigateEncyclopedia('products', '${f.cropId}')" class="text-[10px] text-emerald-400 font-bold hover:underline font-mono">
                        Colheita: ${prod.name} ➔
                      </button>
                    </div>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono border-t border-slate-850 pt-1">
                    <div>Rendimento: <strong class="text-slate-200">${f.dailyYield} un/dia</strong></div>
                    <div>Custo Unitário: <strong class="text-emerald-400">$${f.unitCost.toFixed(2)}/un</strong> · Obra: $${f.cost.toLocaleString('en-US')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 5: CIDADES & LOGÍSTICA
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaCitiesView() {
    const cities = [
      { id: 'nova_atenas', name: 'Nova Atenas', icon: '🏛️', subtitle: 'Metrópole de Serviços & Comércio Nobre', pop: '14.000 hab', req: 'Acesso Livre Inicial', desc: 'Centro financeiro e comercial de alta densidade.' },
      { id: 'porto_real', name: 'Porto Real', icon: '⚓', subtitle: 'Polo Portuário Internacional & Commodities', pop: '9.000 hab', req: 'Acesso Livre Inicial', desc: 'Porta de entrada do comércio exterior com tarifas alfandegárias atrativas.' },
      { id: 'montargis', name: 'Montargis', icon: '🏭', subtitle: 'Polo Industrial Pesado & Siderurgia', pop: '12.000 hab', req: '$500.000 em Patrimônio', desc: 'Berço da manufatura pesada com jazidas de minério e siderúrgicas.' },
      { id: 'varzea', name: 'Várzea', icon: '🌾', subtitle: 'Cinturão Agrícola & Pecuária de Alta Escala', pop: '6.000 hab', req: '1 Fazenda Própria Ativa', desc: 'Grandes planícies de solo fértil ideais para lavouras e pastagens.' }
    ];

    return `
      <div class="space-y-4">
        <div class="text-[11px] text-slate-400 font-mono">As <strong>4 Cidades</strong> do Mapa 128x128 e seus Distritos</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${cities.map(c => `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${c.icon}</span>
                  <div>
                    <div class="font-bold text-slate-100 text-xs">${c.name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${c.subtitle}</div>
                  </div>
                </div>
                <button onclick="closeEncyclopediaModal(); if (typeof jumpToCity === 'function') jumpToCity('${c.id}');" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono cursor-pointer">
                  Ir para Cidade ➔
                </button>
              </div>
              <div class="text-[11px] text-slate-400 font-mono border-t border-slate-850 pt-2 space-y-1">
                <div>População: <strong class="text-slate-200">${c.pop}</strong></div>
                <div>Requisito de Desbloqueio: <strong class="text-amber-300">${c.req}</strong></div>
                <div class="text-[10px] text-slate-500 pt-1">${c.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 6: CALCULADORA DE CADEIA PRODUTIVA INTEGRADA
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaCalculatorView() {
    const prodId = this.state.calcProductId || 'bread';
    const targetDaily = this.state.calcTargetAmount || 500;
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
    const FARM_TYPES = window.FARM_TYPES || [];
    const NATURAL_MINES = window.NATURAL_MINES || [];

    const prod = PRODUCT_CATALOG[prodId] || PRODUCT_CATALOG.bread || { id: 'bread', name: 'Pão de Forma', category: 'Alimentos' };
    const recipe = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(prod.id) : FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id));

    // Calcula requisitos de fábrica
    const factoryCap = recipe ? recipe.dailyCap : 400;
    const linesNeeded = Math.ceil(targetDaily / factoryCap);

    // Insumos de 1º Nível
    const level1Inputs = recipe && recipe.inputs ? Object.entries(recipe.inputs).map(([inpId, qty]) => {
      const inpProd = PRODUCT_CATALOG[inpId] || { name: inpId };
      const inpRecipe = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(inpId) : FACTORY_RECIPES.find(r => r.outputProdId === inpId || r.id === inpId));
      const inpFarm = FARM_TYPES.find(f => f.cropId === inpId);
      const inpMine = NATURAL_MINES.find(m => m.resourceId === inpId);
      const totalNeededDaily = targetDaily * qty;
      
      let facilityType = 'Indústria';
      let facilityLines = 1;
      if (inpRecipe) {
        facilityLines = Math.ceil(totalNeededDaily / inpRecipe.dailyCap);
      } else if (inpFarm) {
        facilityType = 'Fazenda';
        facilityLines = Math.ceil(totalNeededDaily / inpFarm.dailyYield);
      } else if (inpMine) {
        facilityType = 'Mina';
        facilityLines = Math.ceil(totalNeededDaily / inpMine.dailyYield);
      }

      return {
        id: inpId,
        name: inpProd.name,
        qtyPerUnit: qty,
        totalNeededDaily,
        facilityType,
        facilityLines,
        recipe: inpRecipe,
        farm: inpFarm,
        mine: inpMine
      };
    }) : [];

    return `
      <div class="space-y-4 max-w-3xl mx-auto">
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 class="text-xs font-bold text-blue-300 uppercase tracking-wide">📐 Calculadora de Planejamento Industrial</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label class="text-[10px] text-slate-400 block mb-1">Produto a Fabricar:</label>
              <select onchange="updateEncyclopediaCalcProduct(this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none">
                ${Object.values(PRODUCT_CATALOG).filter(p => FACTORY_RECIPES.some(r => r.outputProdId === p.id || r.id === p.id)).map(p => `
                  <option value="${p.id}" ${p.id === prod.id ? 'selected' : ''}>${p.name} (${p.category})</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block mb-1">Meta de Produção Diária (unidades/dia):</label>
              <input type="number" value="${targetDaily}" step="50" min="10" max="10000"
                oninput="updateEncyclopediaCalcAmount(parseInt(this.value) || 100)"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none">
            </div>
          </div>
        </div>

        <!-- Resultado do Dimensionamento -->
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <span class="font-bold text-slate-200">🎯 Meta Final: <strong>${targetDaily.toLocaleString()} un/dia</strong> de ${prod.name}</span>
            <span class="text-orange-400 font-bold">🏭 ${linesNeeded} Linha(s) de Montagem necessárias</span>
          </div>

          <div class="space-y-2">
            <span class="text-[11px] text-slate-400 uppercase block font-bold">Fluxo de Insumos & Instalações de Suporte Necessárias:</span>
            ${level1Inputs.length > 0 ? `
              <div class="space-y-2">
                ${level1Inputs.map(inp => `
                  <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <button onclick="navigateEncyclopedia('products', '${inp.id}')" class="font-bold text-slate-100 hover:text-blue-300 text-xs">${inp.name}</button>
                      <div class="text-[10px] text-slate-400 mt-0.5">Demanda diária: <strong class="text-amber-400">${inp.totalNeededDaily.toLocaleString()} un/dia</strong> (${inp.qtyPerUnit}x por unidade final)</div>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">
                        ${inp.facilityLines}x ${inp.facilityType}(s)
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-slate-500 text-xs">Este produto não consome insumos intermediários adicionais.</div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  updateEncyclopediaCalcProduct(prodId) {
    this.state.calcProductId = prodId;
    this.renderEncyclopediaContent();
  },

  updateEncyclopediaCalcAmount(amount) {
    this.state.calcTargetAmount = amount;
    this.renderEncyclopediaContent();
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ABA 7: CONCEITOS & FÓRMULAS ECONÔMICAS
  // ─────────────────────────────────────────────────────────────────────────
  renderEncyclopediaConceptsView() {
    return `
      <div class="space-y-4 max-w-3xl mx-auto font-mono text-xs text-slate-300">
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h3 class="text-xs font-bold text-cyan-300 uppercase">🧬 Curva Assintótica de Qualidade (P&D)</h3>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            O avanço tecnológico no OIKONOMIA não é linear. Quanto mais próxima a Qualidade Relativa (QR) estiver de 100, mais caro e lento se torna cada ponto adicional:
            <br><br>
            <code class="bg-slate-900 px-2 py-1 rounded text-cyan-300">Ganho_QR = [Orçamento / (Orçamento + $15.000)] × [(100 - QR_Atual) / 100]^1.65 × 1.85</code>
            <br><br>
            • <strong>Tech Level 1 (QR 50–59)</strong>: Básico de mercado.<br>
            • <strong>Tech Level 2 (QR 60–69)</strong>: Padrão comercial de qualidade.<br>
            • <strong>Tech Level 3 (QR 70–79)</strong>: Superioridade competitiva.<br>
            • <strong>Tech Level 4 (QR 80–89)</strong>: Alta nobreza corporativa.<br>
            • <strong>Tech Level 5 (QR 90–99)</strong>: Domínio tecnológico global.
          </p>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h3 class="text-xs font-bold text-amber-300 uppercase">🚚 Logística & Distância Manhattan</h3>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            O frete de entrega é calculado célula a célula no mapa:
            <br><br>
            <code class="bg-slate-900 px-2 py-1 rounded text-amber-300">Custo_Frete = Taxa_Base + (Distância_Manhattan × Tarifa_Por_Tile)</code>
            <br><br>
            Construir fábricas próximas de suas fazendas e lojas reduz o custo final da mercadoria e garante margens muito mais altas.
          </p>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h3 class="text-xs font-bold text-indigo-300 uppercase">📢 Brand Rating & Market Share Quadrático</h3>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            O consumidor escolhe sua loja através da atratividade quadrática (Preço, Qualidade e Marca):
            <br><br>
            <code class="bg-slate-900 px-2 py-1 rounded text-indigo-300">Market_Share = (Atratividade_Jogador)² / [(Atratividade_Jogador)² + (Atratividade_Rival)² + (Base)²]</code>
            <br><br>
            Campanhas de Mídia (Jornal, Rádio e TV) elevam o reconhecimento da sua marca e roubam clientes da concorrência no mesmo bairro.
          </p>
        </div>
      </div>
    `;
  }
};

// Global bindings for inline HTML event handlers
if (typeof window !== 'undefined') {
  window.EncyclopediaPanel = EncyclopediaPanel;
  window.encyclopediaState = EncyclopediaPanel.state;
  window.openEncyclopediaModal = EncyclopediaPanel.openEncyclopediaModal.bind(EncyclopediaPanel);
  window.closeEncyclopediaModal = EncyclopediaPanel.closeEncyclopediaModal.bind(EncyclopediaPanel);
  window.toggleEncyclopediaModal = EncyclopediaPanel.toggleEncyclopediaModal.bind(EncyclopediaPanel);
  window.navigateEncyclopedia = EncyclopediaPanel.navigateEncyclopedia.bind(EncyclopediaPanel);
  window.encyclopediaHistoryBack = EncyclopediaPanel.encyclopediaHistoryBack.bind(EncyclopediaPanel);
  window.encyclopediaHistoryForward = EncyclopediaPanel.encyclopediaHistoryForward.bind(EncyclopediaPanel);
  window.updateEncyclopediaHistoryButtons = EncyclopediaPanel.updateEncyclopediaHistoryButtons.bind(EncyclopediaPanel);
  window.switchEncyclopediaTab = EncyclopediaPanel.switchEncyclopediaTab.bind(EncyclopediaPanel);
  window.updateEncyclopediaTabButtons = EncyclopediaPanel.updateEncyclopediaTabButtons.bind(EncyclopediaPanel);
  window.onEncyclopediaSearch = EncyclopediaPanel.onEncyclopediaSearch.bind(EncyclopediaPanel);
  window.clearEncyclopediaSearch = EncyclopediaPanel.clearEncyclopediaSearch.bind(EncyclopediaPanel);
  window.renderEncyclopediaContent = EncyclopediaPanel.renderEncyclopediaContent.bind(EncyclopediaPanel);
  window.renderEncyclopediaProductsView = EncyclopediaPanel.renderEncyclopediaProductsView.bind(EncyclopediaPanel);
  window.setEncyclopediaCategoryFilter = EncyclopediaPanel.setEncyclopediaCategoryFilter.bind(EncyclopediaPanel);
  window.setEncyclopediaTierFilter = EncyclopediaPanel.setEncyclopediaTierFilter.bind(EncyclopediaPanel);
  window.renderEncyclopediaFactoriesView = EncyclopediaPanel.renderEncyclopediaFactoriesView.bind(EncyclopediaPanel);
  window.renderEncyclopediaStoresView = EncyclopediaPanel.renderEncyclopediaStoresView.bind(EncyclopediaPanel);
  window.renderEncyclopediaResourcesView = EncyclopediaPanel.renderEncyclopediaResourcesView.bind(EncyclopediaPanel);
  window.renderEncyclopediaCitiesView = EncyclopediaPanel.renderEncyclopediaCitiesView.bind(EncyclopediaPanel);
  window.renderEncyclopediaCalculatorView = EncyclopediaPanel.renderEncyclopediaCalculatorView.bind(EncyclopediaPanel);
  window.updateEncyclopediaCalcProduct = EncyclopediaPanel.updateEncyclopediaCalcProduct.bind(EncyclopediaPanel);
  window.updateEncyclopediaCalcAmount = EncyclopediaPanel.updateEncyclopediaCalcAmount.bind(EncyclopediaPanel);
  window.renderEncyclopediaConceptsView = EncyclopediaPanel.renderEncyclopediaConceptsView.bind(EncyclopediaPanel);
}

export default EncyclopediaPanel;
