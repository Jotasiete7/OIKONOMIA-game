/**
 * OIKONOMIA - Specialized Tech Tree Panel Controller
 * client/ui/panels/tech_tree_panel.js
 *
 * Handles:
 * - Tech tree modal open/close
 * - Downstream lineage inspection & filtering
 * - Tier filtering (Tiers 0 to 5)
 * - Dynamic research unlocked check & execution
 * - Product tech research costs and requirements
 */

export const TechTreePanel = {
  currentTechTreeTierFilter: 'all',
  activeTechLineageRoot: null,
  techLineageFilter: 'all', // 'all' | 'can_unlock' | 'retail' | 'b2b' | 'unlocked'

  isProductUnlocked(productId) {
    if (!productId) return false;
    const unlocked = window.unlockedProducts;
    if (unlocked && unlocked.has(productId)) return true;

    const CoreMath = window.CoreMath;
    const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
    if (CoreMath && typeof CoreMath.calculateProductionTier === 'function') {
      const tier = CoreMath.calculateProductionTier(productId, FACTORY_RECIPES);
      if (tier === 0) {
        if (unlocked) unlocked.add(productId);
        return true;
      }
    }
    return false;
  },

  openTechTreeModal(filterCategory = 'all', filterTier = 'all', lineageRoot = null) {
    this.currentTechTreeTierFilter = filterTier;
    this.activeTechLineageRoot = lineageRoot;
    this.techLineageFilter = 'all';

    if (typeof window !== 'undefined') {
      window.currentTechTreeTierFilter = filterTier;
      window.activeTechLineageRoot = lineageRoot;
      window.techLineageFilter = 'all';
    }

    const modal = document.getElementById('tech-tree-modal');
    if (modal) modal.classList.remove('hidden');
    this.filterTechTree(filterTier);
  },

  closeTechTreeModal() {
    const modal = document.getElementById('tech-tree-modal');
    if (modal) modal.classList.add('hidden');
    this.activeTechLineageRoot = null;
    this.techLineageFilter = 'all';

    if (typeof window !== 'undefined') {
      window.activeTechLineageRoot = null;
      window.techLineageFilter = 'all';
    }
  },

  focusTechLineage(prodId) {
    this.activeTechLineageRoot = prodId;
    this.techLineageFilter = 'all';
    if (typeof window !== 'undefined') {
      window.activeTechLineageRoot = prodId;
      window.techLineageFilter = 'all';
    }

    const searchInput = document.getElementById('tt-search-input');
    if (searchInput) searchInput.value = '';
    this.renderTechTree();
  },

  clearTechLineage() {
    this.activeTechLineageRoot = null;
    this.techLineageFilter = 'all';
    if (typeof window !== 'undefined') {
      window.activeTechLineageRoot = null;
      window.techLineageFilter = 'all';
    }
    this.renderTechTree();
  },

  setTechLineageFilter(filter) {
    this.techLineageFilter = filter;
    if (typeof window !== 'undefined') {
      window.techLineageFilter = filter;
    }
    this.renderTechTree();
  },

  filterTechTree(tier) {
    this.activeTechLineageRoot = null;
    this.currentTechTreeTierFilter = tier;
    if (typeof window !== 'undefined') {
      window.activeTechLineageRoot = null;
      window.currentTechTreeTierFilter = tier;
    }

    ['all', '0', '1', '2', '3'].forEach(t => {
      const btn = document.getElementById(`tt-filter-${t}`);
      if (btn) {
        btn.className = (t === tier)
          ? 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#c9a86a]/20 text-[#c9a86a] border border-[#c9a86a]/50 shadow-sm cursor-pointer'
          : 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#121620] hover:bg-white/[0.04] text-[#94a3b8] hover:text-[#f1f5f9] border border-white/[0.08] cursor-pointer';
      }
    });
    this.renderTechTree('tech-tree-grid');
  },

  renderTechTree(targetContainerId = 'tech-tree-grid') {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const unlockedProducts = window.unlockedProducts || new Set();
    const CoreMath = window.CoreMath;
    const cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);

    const searchInput = document.getElementById('tt-search-input');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const tierBadgeColors = {
      0: 'bg-white/[0.04] text-[#94a3b8] border-white/[0.08]',
      1: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
      2: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
      3: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
      4: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      5: 'bg-rose-950/60 text-rose-300 border-rose-800/60'
    };

    // =========================================================================
    // MODO 1: LINHAGEM A JUSANTE (DOWNSTREAM BRANCHES & FUTURE PRODUCTS)
    // =========================================================================
    if (this.activeTechLineageRoot) {
      const rootProd = PRODUCT_CATALOG[this.activeTechLineageRoot] || { id: this.activeTechLineageRoot, name: this.activeTechLineageRoot, category: 'Geral' };
      const rootCat = RD_CATEGORIES[rootProd.category] || { icon: '📦' };
      const rootTier = CoreMath ? CoreMath.calculateProductionTier(this.activeTechLineageRoot, FACTORY_RECIPES) : 0;
      const isRootUnlocked = this.isProductUnlocked(this.activeTechLineageRoot);

      let branches = (CoreMath && CoreMath.getDownstreamBranches)
        ? CoreMath.getDownstreamBranches(this.activeTechLineageRoot, FACTORY_RECIPES, PRODUCT_CATALOG, unlockedProducts)
        : [];

      const totalDerivatives = branches.length;
      const totalUnlockedCount = branches.filter(b => b.isUnlocked).length;
      const totalCanUnlockCount = branches.filter(b => b.canUnlock).length;
      const totalRetailCount = branches.filter(b => !b.isIntermediate).length;
      const totalB2BCount = branches.filter(b => b.isIntermediate).length;

      // Atualiza contador de tecnologias no header
      const countEl = document.getElementById('tech-tree-unlocked-count');
      if (countEl) {
        countEl.textContent = `Linhagem: ${totalDerivatives} Derivados (${totalUnlockedCount} Desbloqueados)`;
      }

      // Filtro da linhagem
      if (this.techLineageFilter === 'can_unlock') {
        branches = branches.filter(b => b.canUnlock);
      } else if (this.techLineageFilter === 'retail') {
        branches = branches.filter(b => !b.isIntermediate);
      } else if (this.techLineageFilter === 'b2b') {
        branches = branches.filter(b => b.isIntermediate);
      } else if (this.techLineageFilter === 'unlocked') {
        branches = branches.filter(b => b.isUnlocked);
      }

      if (searchQuery) {
        branches = branches.filter(b =>
          b.name.toLowerCase().includes(searchQuery) ||
          b.category.toLowerCase().includes(searchQuery) ||
          b.id.toLowerCase().includes(searchQuery)
        );
      }

      let lineageHtml = `
        <!-- Header de Foco da Linhagem -->
        <div class="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-4 rounded-2xl border-2 border-amber-500/80 shadow-xl shadow-amber-950/30 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-amber-800/40 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-teal-950 border-2 border-teal-500 flex items-center justify-center text-2xl shadow-inner shrink-0">
                ${rootCat.icon || '🪨'}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="bg-teal-950 text-teal-300 border border-teal-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">🌱 RAIZ INVESTIGADA</span>
                  <span class="text-xs font-mono text-slate-400">Tier ${rootTier}</span>
                  <span class="text-[9px] px-2 py-0.5 rounded border ${isRootUnlocked ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'} font-bold">
                    ${isRootUnlocked ? '✓ Desbloqueado' : '🔒 Bloqueado'}
                  </span>
                </div>
                <h3 class="text-base font-black text-amber-200 flex items-center gap-2 mt-0.5">
                  ${rootProd.name}
                  <span class="text-xs font-normal text-slate-400">➔ Desdobramentos & Oportunidades Futuras</span>
                </h3>
              </div>
            </div>
            <button onclick="clearTechLineage()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow">
              <span>✕ Sair da Linhagem</span>
              <span class="text-[10px] text-slate-400">(Ver Árvore Geral)</span>
            </button>
          </div>

          <!-- Resumo Executivo / Métricas -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
            <div class="bg-slate-950/80 p-2 rounded-xl border border-amber-900/40">
              <div class="text-slate-400 text-[10px]">Total de Derivados</div>
              <div class="text-amber-300 font-bold text-sm">${totalDerivatives} produtos</div>
            </div>
            <div class="bg-slate-950/80 p-2 rounded-xl border border-amber-900/40">
              <div class="text-slate-400 text-[10px]">Prontos p/ P&D Agora</div>
              <div class="text-emerald-400 font-bold text-sm">${totalCanUnlockCount} itens</div>
            </div>
            <div class="bg-slate-950/80 p-2 rounded-xl border border-amber-900/40">
              <div class="text-slate-400 text-[10px]">Bens Finais (Varejo)</div>
              <div class="text-sky-300 font-bold text-sm">${totalRetailCount} itens</div>
            </div>
            <div class="bg-slate-950/80 p-2 rounded-xl border border-amber-900/40">
              <div class="text-slate-400 text-[10px]">Insumos B2B (Fábrica)</div>
              <div class="text-purple-300 font-bold text-sm">${totalB2BCount} itens</div>
            </div>
          </div>

          <!-- Filtros Rápidos da Linhagem -->
          <div class="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
            <span class="text-slate-400 font-bold">Filtrar:</span>
            <button onclick="setTechLineageFilter('all')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${this.techLineageFilter === 'all' ? 'bg-amber-600 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">Todos (${totalDerivatives})</button>
            <button onclick="setTechLineageFilter('can_unlock')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${this.techLineageFilter === 'can_unlock' ? 'bg-emerald-600 text-white font-black shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">⚡ Prontos para P&D (${totalCanUnlockCount})</button>
            <button onclick="setTechLineageFilter('retail')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${this.techLineageFilter === 'retail' ? 'bg-sky-600 text-white font-black shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">🏆 Bens Finais / Varejo (${totalRetailCount})</button>
            <button onclick="setTechLineageFilter('b2b')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${this.techLineageFilter === 'b2b' ? 'bg-purple-600 text-white font-black shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">🏭 Insumos Industriais B2B (${totalB2BCount})</button>
            <button onclick="setTechLineageFilter('unlocked')" class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${this.techLineageFilter === 'unlocked' ? 'bg-teal-600 text-white font-black shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">✅ Já Desbloqueados (${totalUnlockedCount})</button>
          </div>
        </div>
      `;

      if (branches.length === 0) {
        lineageHtml += `
          <div class="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 font-mono text-slate-400 text-xs">
            Nenhum produto derivado encontrado com os filtros selecionados.
          </div>
        `;
      } else {
        lineageHtml += `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">`;

        for (const node of branches) {
          const canAfford = cash >= node.cost;
          const statusBtn = node.isUnlocked
            ? `<div class="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-700/80 text-[10px] font-bold flex items-center gap-1 shrink-0">✅ Desbloqueado</div>`
            : (node.canUnlock
              ? `<button onclick="researchProductTech('${node.id}')"
                  class="px-3 py-1.5 rounded-xl font-bold text-xs ${canAfford ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-lg cursor-pointer' : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'} transition shrink-0">
                  🔬 Desbloquear ($${node.cost.toLocaleString('en-US')})
                </button>`
              : `<div class="bg-slate-900 text-amber-400/80 px-2.5 py-1 rounded-lg border border-amber-900/60 text-[10px] font-bold shrink-0" title="Desbloqueie os insumos pré-requisitos primeiro">🔒 Requisitos Pendentes</div>`
            );

          const degreeBadge = node.degree === 1
            ? `<span class="bg-amber-900/80 text-amber-200 border border-amber-600 px-1.5 py-0.5 rounded text-[9px] font-bold">⚡ Grau 1 · Refino Direto</span>`
            : (node.degree === 2
              ? `<span class="bg-purple-900/80 text-purple-200 border border-purple-600 px-1.5 py-0.5 rounded text-[9px] font-bold">⚙️ Grau 2 · Montagem / Subconjunto</span>`
              : `<span class="bg-rose-900/80 text-rose-200 border border-rose-600 px-1.5 py-0.5 rounded text-[9px] font-bold">🏆 Grau ${node.degree} · Bem de Alto Valor</span>`);

          const valueBadge = !node.isIntermediate
            ? `<span class="text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/80 text-[10px]">💰 Varejo: $${node.standardPrice.toLocaleString()}/un</span>`
            : `<span class="text-sky-300 font-bold bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-700/80 text-[10px]">🏭 Insumo B2B</span>`;

          lineageHtml += `
            <div class="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-2 border-amber-500/70 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 transition shadow-lg shadow-amber-950/20 hover:border-amber-400">
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${degreeBadge}
                    <span class="text-[9px] px-1.5 py-0.5 rounded border font-mono ${tierBadgeColors[node.tier] || 'bg-slate-800 text-slate-300 border-slate-700'}">Tier ${node.tier}</span>
                    ${valueBadge}
                  </div>
                  <div class="flex items-center gap-2 pt-0.5">
                    <span class="text-lg">${node.emoji}</span>
                    <span class="font-black text-sm text-slate-100">${node.name}</span>
                  </div>
                  <div class="text-[10px] text-slate-400">
                    ${node.category} · Custo P&D: <strong class="text-amber-300">$${node.cost.toLocaleString('en-US')}</strong>
                  </div>
                </div>
                ${statusBtn}
              </div>

              <!-- Conexão / Caminho da Linhagem -->
              <div class="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-[9px] font-mono space-y-1">
                <div class="text-amber-400 font-bold flex items-center gap-1">
                  <span>🔗 Rota a partir de ${rootProd.name}:</span>
                </div>
                <div class="text-slate-300 text-[10px] flex items-center gap-1 flex-wrap font-bold">
                  ${node.path.map((pId, idx) => {
                    const p = PRODUCT_CATALOG[pId] || { name: pId };
                    const isLast = idx === node.path.length - 1;
                    return `<span class="${isLast ? 'text-amber-300 font-black underline' : (idx === 0 ? 'text-teal-400' : 'text-slate-400')}">${p.name}</span>`;
                  }).join('<span class="text-slate-600 font-normal"> ➔ </span>')}
                </div>
              </div>

              <!-- Gargalos & Insumos Obrigatórios da Receita -->
              <div class="pt-1.5 border-t border-slate-900 space-y-1">
                <div class="text-[9px] text-slate-400 font-bold flex items-center justify-between">
                  <span>Gargalos & Insumos da Receita:</span>
                  <span class="text-[9px] ${node.allSiblingsUnlocked ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">
                    ${node.allSiblingsUnlocked ? '✓ Todos os Insumos Prontos' : '⚠️ Faltam Insumos Externos'}
                  </span>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                  ${node.siblingInputs.map(s => {
                    if (s.isFromLineage) {
                      return `<span class="bg-amber-950/90 text-amber-300 border border-amber-600/80 px-1.5 py-0.5 rounded font-bold" title="Insumo vindo da linhagem desta pesquisa">🌿 ${s.name} (${s.qty} un)</span>`;
                    }
                    if (s.isUnlocked) {
                      return `<span class="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded" title="Insumo já desbloqueado na holding">✓ ${s.name} (${s.qty} un)</span>`;
                    }
                    return `<span class="bg-rose-950/90 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-bold" title="Gargalo: Este insumo precisa ser desbloqueado para liberar a fabricação">❌ ${s.name} (Falta Desbloquear)</span>`;
                  }).join('')}
                </div>
              </div>

              <!-- Botão de Re-foco -->
              <div class="pt-1 flex items-center justify-end">
                <button onclick="focusTechLineage('${node.id}')" class="text-[9px] text-slate-400 hover:text-amber-300 font-mono underline cursor-pointer flex items-center gap-1 transition">
                  <span>↳ Explorar linhagem a partir de ${node.name}</span>
                </button>
              </div>
            </div>
          `;
        }

        lineageHtml += `</div>`;
      }

      container.innerHTML = lineageHtml;
      return;
    }

    // =========================================================================
    // MODO 2: VISÃO GERAL COMPLETA DA ÁRVORE TECNOLÓGICA (COM ATALHO DE LINHAGEM)
    // =========================================================================
    const productList = Object.values(PRODUCT_CATALOG);
    let totalUnlocked = 0;
    const tierGroups = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };

    for (const prod of productList) {
      const tier = CoreMath ? CoreMath.calculateProductionTier(prod.id, FACTORY_RECIPES) : 0;
      const roots = CoreMath ? CoreMath.getRootBranches(prod.id, FACTORY_RECIPES) : [];
      const bonus = CoreMath ? CoreMath.calculateConvergenceBonus(prod.id, FACTORY_RECIPES) : 0;
      const cost = CoreMath ? CoreMath.calculateResearchCost(tier, bonus) : 0;
      const unlocked = this.isProductUnlocked(prod.id);
      const canUnlock = !unlocked && CoreMath && CoreMath.canResearch(prod.id, unlockedProducts, FACTORY_RECIPES);

      if (unlocked) totalUnlocked++;

      // Encontra insumos requeridos pela receita
      const recipe = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(prod.id) : FACTORY_RECIPES.find(r => r.outputProdId === prod.id || r.id === prod.id));
      const inputReqs = [];
      if (recipe && recipe.inputs) {
        for (const [inpId, qty] of Object.entries(recipe.inputs)) {
          const inpProd = PRODUCT_CATALOG[inpId] || { name: inpId, category: 'Insumo' };
          inputReqs.push({
            id: inpId,
            name: inpProd.name,
            qty,
            isUnlocked: this.isProductUnlocked(inpId)
          });
        }
      }

      const item = {
        prod,
        tier,
        roots: Array.from(roots),
        bonus,
        cost,
        unlocked,
        canUnlock,
        inputReqs
      };

      if (tierGroups[tier]) {
        tierGroups[tier].push(item);
      }
    }

    // Atualiza contador de tecnologias no header
    const countEl = document.getElementById('tech-tree-unlocked-count');
    if (countEl) {
      countEl.textContent = `${totalUnlocked}/${productList.length} Desbloqueadas`;
    }

    // Filtra por Tier selecionado e busca
    let html = '';
    const tiersToRender = this.currentTechTreeTierFilter === 'all'
      ? [0, 1, 2, 3, 4, 5]
      : [parseInt(this.currentTechTreeTierFilter)];

    for (const t of tiersToRender) {
      let items = tierGroups[t] || [];
      if (searchQuery) {
        items = items.filter(it =>
          it.prod.name.toLowerCase().includes(searchQuery) ||
          it.prod.category.toLowerCase().includes(searchQuery) ||
          it.prod.id.toLowerCase().includes(searchQuery)
        );
      }
      if (items.length === 0) continue;

      const tierNames = {
        0: 'Tier 0 — Matérias-Primas & Extração Natural (Livre)',
        1: 'Tier 1 — Insumos Básicos & Refino Primário',
        2: 'Tier 2 — Bens de Consumo & Manufatura Intermediária',
        3: 'Tier 3 — Alta Complexidade & Montadoras Avançadas',
        4: 'Tier 4 — Manufatura de Precisão & Sistemas Integrados',
        5: 'Tier 5 — Síntese Tecnológica Suprema'
      };

      html += `
        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1 pt-2">
            <h4 class="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${t === 0 ? 'bg-slate-500' : (t === 1 ? 'bg-emerald-500' : (t === 2 ? 'bg-sky-500' : 'bg-purple-500'))}"></span>
              ${tierNames[t] || `Tier ${t}`}
            </h4>
            <span class="text-[10px] text-slate-500">${items.filter(i => i.unlocked).length}/${items.length} Prontos</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      `;

      for (const item of items) {
        const { prod, tier, roots, bonus, cost, unlocked, canUnlock } = item;
        const cat = RD_CATEGORIES[prod.category] || { icon: '📦' };
        const canAfford = cash >= cost;
        const currentQR = (typeof window.getProductBestRDQuality === 'function' ? window.getProductBestRDQuality(prod.id) : 0) || (unlocked ? 60 : 50);
        const techLvl = (CoreMath && CoreMath.getTechLevelLabel)
          ? CoreMath.getTechLevelLabel(currentQR)
          : { level: 1, label: 'Padrão', icon: '🥉', color: 'text-slate-300 border-slate-700 bg-slate-900' };

        const downstreamBranches = (CoreMath && CoreMath.getDownstreamBranches)
          ? CoreMath.getDownstreamBranches(prod.id, FACTORY_RECIPES, PRODUCT_CATALOG)
          : [];
        const downstreamCount = downstreamBranches.length;

        // Função recursiva para renderizar a cadeia de insumos completa até a raiz (Tier 0)
        const getFullChainHtml = (pId) => {
          const rec = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(pId) : FACTORY_RECIPES.find(r => r.outputProdId === pId || r.id === pId));
          if (!rec || !rec.inputs || Object.keys(rec.inputs).length === 0) {
            const p = PRODUCT_CATALOG[pId] || { name: pId };
            const isUnl = this.isProductUnlocked(pId);
            return `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono border ${isUnl ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80' : 'bg-slate-900 text-slate-400 border-slate-700'}">${isUnl ? '✓' : '•'} ${p.name} (T0)</span>`;
          }
          const parts = Object.entries(rec.inputs).map(([inpId, qty]) => {
            const inpProd = PRODUCT_CATALOG[inpId] || { name: inpId };
            const isUnl = this.isProductUnlocked(inpId);
            const parentTree = getFullChainHtml(inpId);
            return `${parentTree} <span class="text-slate-500 font-bold">➔</span> <span class="px-1.5 py-0.5 rounded text-[9px] font-mono border ${isUnl ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80' : 'bg-rose-950/70 text-rose-300 border-rose-800/80 font-bold'}">${isUnl ? '✓' : '✗'} ${inpProd.name}</span>`;
          });
          return parts.join(' <span class="text-slate-600 font-mono">+</span> ');
        };

        const statusBtn = unlocked
          ? `<div class="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-700/80 text-[10px] font-bold flex items-center gap-1 shrink-0 font-mono">✅ Desbloqueado</div>`
          : (canUnlock
            ? `<button onclick="researchProductTech('${prod.id}')"
                class="px-3 py-1.5 rounded-xl font-bold text-xs ${canAfford ? 'bg-[#c9a86a] hover:bg-[#dfba76] text-[#080a0d] font-bold shadow-md cursor-pointer' : 'bg-white/[0.04] text-[#94a3b8]/50 border border-white/[0.08] cursor-not-allowed'} transition shrink-0 font-mono">
                🔬 Desbloquear ($${cost.toLocaleString('en-US')})
              </button>`
            : `<div class="bg-white/[0.03] text-[#94a3b8]/60 px-2.5 py-1 rounded-lg border border-white/[0.06] text-[10px] font-bold flex items-center gap-1 shrink-0 font-mono" title="Desbloqueie os insumos pré-requisitos primeiro">🔒 Requisitos Pendentes</div>`
          );

        html += `
          <div class="bg-[#0b0e14] border ${unlocked ? 'border-emerald-500/30 bg-emerald-950/10' : (canUnlock ? 'border-[#c9a86a]/40 bg-[#c9a86a]/5' : 'border-white/[0.06] opacity-75')} rounded-xl p-3 flex flex-col justify-between gap-2.5 transition shadow-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-lg bg-[#121620] border border-white/[0.08] flex items-center justify-center text-base shrink-0 shadow-inner">
                  ${prod.emoji || cat.icon || '📦'}
                </div>
                <div>
                  <div class="font-bold text-[#f1f5f9] text-xs flex items-center gap-1.5 flex-wrap">
                    <span>${prod.name}</span>
                    <span class="text-[8px] px-1.5 py-0.5 rounded border font-mono ${tierBadgeColors[tier] || 'bg-white/[0.04] text-[#94a3b8] border-white/[0.08]'}">Tier ${tier}</span>
                    <span class="text-[8px] px-1.5 py-0.5 rounded border font-bold font-mono ${techLvl.color}">${techLvl.icon} Tech Lvl ${techLvl.level} · QR ${currentQR.toFixed(0)}</span>
                  </div>
                  <div class="text-[10px] text-[#94a3b8] mt-0.5 font-mono">${prod.category} · Custo Desbloqueio: <strong class="text-[#c9a86a] font-mono">$${cost.toLocaleString('en-US')}</strong> ${bonus > 0 ? `<span class="text-[9px] text-purple-400" title="Bônus de Convergência de ${roots.length} Ramos (+ $${bonus})">(+${roots.length} ramos)</span>` : ''}</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                ${downstreamCount > 0 ? `
                  <button onclick="focusTechLineage('${prod.id}')"
                    class="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30 hover:bg-[#c9a86a]/25 hover:border-[#c9a86a] cursor-pointer flex items-center gap-1 transition shadow-sm shrink-0"
                    title="Explorar todos os produtos e tecnologias que derivam deste item">
                    🌿 Linhagem (${downstreamCount})
                  </button>
                ` : ''}
                ${statusBtn}
              </div>
            </div>

            <!-- Cadeia Produtiva Completa (da raiz ao produto) -->
            <div class="pt-1.5 border-t border-white/[0.04] space-y-1">
              <div class="text-[9px] text-[#94a3b8] font-bold flex items-center justify-between">
                <span>Cadeia de Insumos:</span>
                ${downstreamCount > 0 ? `
                  <button onclick="focusTechLineage('${prod.id}')" class="text-[9px] text-[#c9a86a] hover:text-[#dfba76] font-mono font-bold underline cursor-pointer">
                    Ver ${downstreamCount} desdobramentos futuros ➔
                  </button>
                ` : `<span class="text-[9px] text-[#94a3b8]/70 font-mono">${tier > 0 ? `Profundidade: ${tier} etapas` : 'Matéria-prima livre'}</span>`}
              </div>
              <div class="flex items-center gap-1 flex-wrap text-[9px]">
                ${getFullChainHtml(prod.id)}
              </div>
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    if (html === '') {
      html = '<div class="text-center py-12 text-slate-500 font-mono text-xs">Nenhuma tecnologia encontrada com os filtros atuais.</div>';
    }

    container.innerHTML = html;
  },

  researchProductTech(productId) {
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
    const unlockedProducts = window.unlockedProducts;
    const CoreMath = window.CoreMath;
    let cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);

    const prod = PRODUCT_CATALOG[productId];
    if (!prod) return;

    if (this.isProductUnlocked(productId)) {
      alert(`A tecnologia "${prod.name}" já está desbloqueada!`);
      return;
    }

    if (!CoreMath || !CoreMath.canResearch(productId, unlockedProducts, FACTORY_RECIPES)) {
      const recipe = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(productId) : FACTORY_RECIPES.find(r => r.outputProdId === productId || r.id === productId));
      const missing = [];
      if (recipe && recipe.inputs) {
        for (const inpId of Object.keys(recipe.inputs)) {
          if (!this.isProductUnlocked(inpId)) {
            const inpProd = PRODUCT_CATALOG[inpId] || { name: inpId };
            missing.push(inpProd.name);
          }
        }
      }
      alert(`Pré-requisitos pendentes! Você precisa desbloquear primeiro os insumos: ${missing.join(', ')}.`);
      return;
    }

    const tier = CoreMath.calculateProductionTier(productId, FACTORY_RECIPES);
    const bonus = CoreMath.calculateConvergenceBonus(productId, FACTORY_RECIPES);
    const cost = CoreMath.calculateResearchCost(tier, bonus);

    if (cash < cost) {
      alert(`Caixa insuficiente! Você precisa de $${cost.toLocaleString('en-US')} para pesquisar esta tecnologia.`);
      return;
    }

    if (typeof window.cash !== 'undefined') {
      window.cash -= cost;
    } else if (window.GameState) {
      window.GameState.cash -= cost;
    }
    if (unlockedProducts) unlockedProducts.add(productId);

    if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
    if (typeof window.addGameLog === 'function') {
      window.addGameLog(`🧬 P&D CONCLUÍDO: Tecnologia "${prod.name}" (Tier ${tier}) desbloqueada com sucesso! (-$${cost.toLocaleString('en-US')})`, 'text-teal-300 font-bold', { actionType: 'OPEN_RD' });
    }
    if (typeof window.updateUI === 'function') window.updateUI();

    this.renderTechTree('tech-tree-grid');
    if (window.currentRDTab === 'techtree') this.renderTechTree('rd-embedded-tech-tree');

    if (window.activeFactoryTile?.factory && typeof window.openFactoryRecipeModal === 'function') {
      window.openFactoryRecipeModal(window.activeFactoryTile.x, window.activeFactoryTile.y);
    }
  }
};

// Global bindings for inline HTML event handlers
if (typeof window !== 'undefined') {
  window.TechTreePanel = TechTreePanel;
  window.openTechTreeModal = TechTreePanel.openTechTreeModal.bind(TechTreePanel);
  window.closeTechTreeModal = TechTreePanel.closeTechTreeModal.bind(TechTreePanel);
  window.focusTechLineage = TechTreePanel.focusTechLineage.bind(TechTreePanel);
  window.clearTechLineage = TechTreePanel.clearTechLineage.bind(TechTreePanel);
  window.setTechLineageFilter = TechTreePanel.setTechLineageFilter.bind(TechTreePanel);
  window.filterTechTree = TechTreePanel.filterTechTree.bind(TechTreePanel);
  window.renderTechTree = TechTreePanel.renderTechTree.bind(TechTreePanel);
  window.researchProductTech = TechTreePanel.researchProductTech.bind(TechTreePanel);
  window.isProductUnlocked = TechTreePanel.isProductUnlocked.bind(TechTreePanel);
}

export default TechTreePanel;
