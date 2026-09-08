/**
 * OIKONOMIA - Specialized Research & Development (R&D) Panel Controller
 * client/ui/panels/rd_panel.js
 *
 * Handles:
 * - R&D Center modal & project wizard
 * - Lab capacity, bench allocations and budget management
 * - Asymptotic quality growth simulation & ROI calculations
 * - Patent market (competitor tech buyout with macro discounts)
 * - Factory line and retail shelf quality propagation
 */

export const RDPanel = {
  rdProjectsFilter: 'all',
  currentRDTab: 'projects',
  currentSelectedLabsCount: 1,
  currentRDWizardFilterType: 'scope',
  currentRDWizardFilterValue: 'all',
  currentRDWizardSearchText: '',

  openRDCenterModal() {
    const modal = document.getElementById('rd-center-modal');
    if (modal) modal.classList.remove('hidden');
    this.renderRDProjectsList();
  },

  closeRDCenterModal() {
    const modal = document.getElementById('rd-center-modal');
    if (modal) modal.classList.add('hidden');
  },

  /** Retorna a contagem de Centros de P&D (prédios físicos) construídos */
  getBuiltRDCentersCount() {
    let count = 0;
    const activeFacilitySet = window.activeFacilitySet || new Set();
    for (const tile of activeFacilitySet.values()) {
      if (tile.rdCenter) count++;
    }
    return count;
  },

  /** Cada Centro de P&D construído dá 4 bancadas de laboratório */
  getRDTotalLabCapacity() {
    return this.getBuiltRDCentersCount() * 4;
  },

  /** Contagem total de bancadas ocupadas em projetos ativos */
  getRDUsedLabSlots() {
    const rdLabs = window.rdLabs || {};
    return Object.values(rdLabs)
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + (p.labsCount || 1), 0);
  },

  /** Retorna o melhor QR já pesquisado pelo jogador para um dado produto */
  getProductBestRDQuality(prodId) {
    let best = 0;
    const rdLabs = window.rdLabs || {};
    for (const proj of Object.values(rdLabs)) {
      if (proj.productId === prodId && proj.currentQR > best) {
        best = proj.currentQR;
      }
    }
    return best;
  },

  setRDProjectsFilter(filter) {
    this.rdProjectsFilter = filter;
    this.renderRDProjectsList();
  },

  /** Popula e renderiza todos os projetos de P&D ativos/pausados/concluídos */
  renderRDProjectsList() {
    const list = document.getElementById('rd-projects-list');
    const subtitle = document.getElementById('rd-header-subtitle');
    const budgetDisplay = document.getElementById('rd-total-budget-display');
    if (!list) return;

    const totalCapacity = this.getRDTotalLabCapacity();
    const usedSlots = this.getRDUsedLabSlots();
    const centersCount = this.getBuiltRDCentersCount();

    const rdLabs = window.rdLabs || {};
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const CoreMath = window.CoreMath;

    const allProjects = Object.values(rdLabs);
    const activeProjects = allProjects.filter(p => p.status === 'active');
    const inProgressProjects = allProjects.filter(p => p.status !== 'completed');
    const completedProjects = allProjects.filter(p => p.status === 'completed');

    const totalBudget = activeProjects.reduce((s, p) => s + (p.monthlyBudget || 0), 0);
    if (budgetDisplay) budgetDisplay.textContent = `$${totalBudget.toLocaleString('en-US')} / mês`;
    if (subtitle) subtitle.textContent = `Centros de P&D: ${centersCount} · Bancadas: ${usedSlots}/${totalCapacity} ativas · Verba Total: $${totalBudget.toLocaleString('en-US')}/mês`;

    if (centersCount === 0) {
      list.innerHTML = `
        <div class="text-center py-10 px-4 space-y-3 font-mono">
          <div class="text-3xl">🔬</div>
          <div class="text-xs font-bold text-purple-300">Nenhum Centro de P&D Inaugurado</div>
          <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
            Para realizar pesquisas de produtos e contratar cientistas, construa um <strong>Centro de P&D</strong> no mapa da cidade.
          </p>
          <div class="text-[10px] text-slate-500">Custo: $80.000 · Aluguel: -$10/dia · Capacidade: +4 Bancadas</div>
        </div>
      `;
      return;
    }

    if (allProjects.length === 0) {
      list.innerHTML = '<p class="text-xs text-slate-500 text-center py-8 font-mono">Nenhum projeto de pesquisa em andamento.<br>Clique em "➕ Novo Projeto" para alocar bancadas.</p>';
      return;
    }

    // Barra de Filtros Rápidos (Todas / Em Andamento / Patentes Concluídas)
    const filterBarHtml = `
      <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/[0.08] flex-wrap">
        <div class="flex items-center gap-1.5">
          <button onclick="setRDProjectsFilter('all')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${this.rdProjectsFilter === 'all' ? 'bg-[#c9a86a] text-[#080a0d] shadow-sm border border-[#c9a86a]' : 'bg-[#0b0e14] hover:bg-white/[0.05] text-[#94a3b8] hover:text-[#f1f5f9] border border-white/[0.08]'}">
            🏢 Todas (${allProjects.length})
          </button>
          <button onclick="setRDProjectsFilter('active')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${this.rdProjectsFilter === 'active' ? 'bg-[#c9a86a] text-[#080a0d] shadow-sm border border-[#c9a86a]' : 'bg-[#0b0e14] hover:bg-white/[0.05] text-[#94a3b8] hover:text-[#f1f5f9] border border-white/[0.08]'}">
            🟢 Em Andamento (${inProgressProjects.length})
          </button>
          <button onclick="setRDProjectsFilter('completed')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${this.rdProjectsFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm border border-emerald-500' : 'bg-[#0b0e14] hover:bg-white/[0.05] text-[#94a3b8] hover:text-[#f1f5f9] border border-white/[0.08]'}">
            🏆 Patentes Concluídas (${completedProjects.length})
          </button>
        </div>
        <div class="text-[10px] text-slate-400 font-mono">
          Patentes: <strong class="text-emerald-400">${completedProjects.length}</strong>
        </div>
      </div>
    `;

    let filteredProjects = allProjects;
    if (this.rdProjectsFilter === 'active') {
      filteredProjects = inProgressProjects;
    } else if (this.rdProjectsFilter === 'completed') {
      filteredProjects = completedProjects;
    }

    list.innerHTML = filterBarHtml;

    if (filteredProjects.length === 0) {
      const emptyMsg = this.rdProjectsFilter === 'active'
        ? 'Nenhuma pesquisa em andamento no momento. Todas as pesquisas foram concluídas ou as bancadas estão ociosas.'
        : (this.rdProjectsFilter === 'completed'
          ? 'Nenhuma patente concluída ainda. Inicie pesquisas para aprimorar o QR dos seus produtos.'
          : 'Nenhum projeto encontrado.');
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'text-xs text-[#94a3b8] text-center py-8 font-mono bg-[#0b0e14]/40 rounded-xl border border-dashed border-white/[0.08]';
      emptyDiv.innerHTML = `<p>${emptyMsg}</p>`;
      list.appendChild(emptyDiv);
      return;
    }

    for (const proj of filteredProjects.sort((a, b) => (b.status === 'active' ? 1 : 0) - (a.status === 'active' ? 1 : 0))) {
      const prod = PRODUCT_CATALOG[proj.productId];
      const cat = RD_CATEGORIES[proj.category] || { icon: '🔬', baseCost: 3000 };
      const currentQR = proj.currentQR || 40;
      const targetQR = proj.targetQR || 80;
      const minCostSingle = CoreMath ? CoreMath.calculateRDMonthlyCost(currentQR, prod?.rdBaseCost || cat.baseCost) : 3000;
      const labsCount = Math.max(1, proj.labsCount || 1);
      const minCostTotal = minCostSingle * labsCount;

      const pct = Math.min(100, Math.round(((proj.currentQR - 40) / Math.max(1, proj.targetQR - 40)) * 100));

      const isActive = proj.status === 'active';
      const isDone = proj.status === 'completed';
      const statusBadge = isDone
        ? '<span class="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 text-[9px] font-bold">🏆 PATENTE CONCLUÍDA</span>'
        : (isActive
          ? '<span class="bg-[#c9a86a]/15 text-[#c9a86a] px-2 py-0.5 rounded border border-[#c9a86a]/30 text-[9px] font-bold">🟢 ATIVO</span>'
          : '<span class="bg-white/[0.04] text-slate-400 px-2 py-0.5 rounded border border-white/[0.08] text-[9px] font-bold">⏸ PAUSADO</span>');

      const gainSingle = CoreMath ? CoreMath.calculateRDQualityGain(proj.currentQR, proj.targetQR, (proj.monthlyBudget || minCostTotal) / labsCount, minCostSingle) : 0;
      const gainTotal = gainSingle * labsCount;
      const monthsLeft = gainTotal > 0 ? Math.ceil((proj.targetQR - proj.currentQR) / gainTotal) : '∞';
      const barColor = isDone ? 'bg-emerald-500' : (isActive ? 'bg-[#c9a86a]' : 'bg-slate-600');

      const prodEmoji = (typeof window !== 'undefined' && window.getProductEmoji) ? window.getProductEmoji(proj.productId) : (prod?.emoji || cat.icon || '🔬');

      const card = document.createElement('div');
      card.className = `bg-[#0b0e14] border rounded-xl p-3 space-y-2.5 font-mono text-xs ${isDone ? 'border-emerald-600/40' : (isActive ? 'border-[#c9a86a]/40' : 'border-white/[0.08]')}`;
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">${prodEmoji}</span>
            <div>
              <div class="font-bold text-slate-100 text-[11px] flex items-center gap-1.5">
                <span>${prod ? prod.name : proj.productId}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30">${labsCount} Lab${labsCount > 1 ? 's' : ''}</span>
              </div>
              <div class="text-[9px] text-[#94a3b8]">${proj.category} · Meses investidos: ${proj.monthsInvested}</div>
            </div>
          </div>
          ${statusBadge}
        </div>
        <div>
          <div class="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>QR: <strong class="text-amber-300">${proj.currentQR.toFixed(1)}</strong> → <strong class="text-[#c9a86a]">${proj.targetQR}</strong></span>
            <span>${pct}% completo</span>
          </div>
          <div class="h-2 bg-[#080a0d] rounded-full overflow-hidden border border-white/[0.08]">
            <div class="${barColor} h-full rounded-full transition-all" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
          <div>Verba: <strong class="text-emerald-400">${isDone ? 'Consolidada ($0/mês)' : `$${(proj.monthlyBudget || 0).toLocaleString('en-US')}/mês`}</strong></div>
          <div>Ganho: <strong class="text-[#c9a86a]">${isDone ? 'Concluído' : `+${gainTotal.toFixed(2)} QR/mês`}</strong></div>
          <div>ETA: <strong class="text-slate-200">${isDone ? '🏆 Concluído' : (monthsLeft === '∞' ? '∞' : monthsLeft + ' meses')}</strong></div>
        </div>
        ${isDone ? `
          <div class="flex items-center justify-between pt-1 border-t border-emerald-900/40">
            <span class="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span>⭐</span> Patente Conquistada & Ativa nas Fábricas
            </span>
            <button onclick="cancelRDProject('${proj.id}')" class="px-2.5 py-1 bg-white/[0.04] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg text-[9px] font-bold border border-white/[0.08] cursor-pointer transition flex items-center gap-1" title="Arquivar esta patente do laboratório">
              🗑️ Arquivar
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/[0.08]">
            ${isActive ? `<button onclick="pauseRDProject('${proj.id}')" class="py-1 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-lg text-[9px] font-bold border border-white/[0.08] cursor-pointer">⏸ Pausar</button>` : `<button onclick="resumeRDProject('${proj.id}')" class="py-1 bg-[#c9a86a]/20 hover:bg-[#c9a86a]/30 text-[#c9a86a] rounded-lg text-[9px] font-bold border border-[#c9a86a]/40 cursor-pointer">▶ Retomar</button>`}
            <button onclick="adjustRDBudget('${proj.id}')" class="py-1 bg-white/[0.04] hover:bg-white/[0.08] text-[#c9a86a] rounded-lg text-[9px] font-bold border border-white/[0.08] cursor-pointer">💰 Ajustar Verba</button>
            <button onclick="cancelRDProject('${proj.id}')" class="py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-[9px] font-bold border border-rose-800/60 cursor-pointer">🗑️ Cancelar</button>
          </div>
        `}
      `;
      list.appendChild(card);
    }
  },

  switchRDTab(tab) {
    this.currentRDTab = tab;
    if (typeof window !== 'undefined') window.currentRDTab = tab;

    const projBtn = document.getElementById('rd-tab-projects-btn');
    const treeBtn = document.getElementById('rd-tab-techtree-btn');
    const mktBtn = document.getElementById('rd-tab-market-btn');
    const projList = document.getElementById('rd-projects-list');
    const treeList = document.getElementById('rd-techtree-list');
    const mktList = document.getElementById('rd-market-list');

    const btnInactive = 'px-2.5 py-1 rounded-lg font-bold bg-[#0b0e14] hover:bg-white/[0.05] text-[#94a3b8] hover:text-[#f1f5f9] border border-white/[0.08] text-[10px] cursor-pointer transition';
    const btnActive = 'px-2.5 py-1 rounded-lg font-bold bg-[#c9a86a] text-[#080a0d] border border-[#c9a86a] shadow-sm text-[10px] cursor-pointer transition';

    if (projBtn) projBtn.className = tab === 'projects' ? btnActive : btnInactive;
    if (treeBtn) treeBtn.className = tab === 'techtree' ? btnActive : btnInactive;
    if (mktBtn) mktBtn.className = tab === 'market' ? btnActive : btnInactive;

    if (projList) projList.classList.toggle('hidden', tab !== 'projects');
    if (treeList) treeList.classList.toggle('hidden', tab !== 'techtree');
    if (mktList) mktList.classList.toggle('hidden', tab !== 'market');

    if (tab === 'projects') this.renderRDProjectsList();
    else if (tab === 'techtree' && typeof window.renderTechTree === 'function') window.renderTechTree('rd-embedded-tech-tree');
    else if (tab === 'market') this.renderRDMarketList();
  },

  renderRDMarketList() {
    const list = document.getElementById('rd-market-list');
    const subtitle = document.getElementById('rd-header-subtitle');
    if (!list) return;
    if (subtitle) subtitle.textContent = 'Mercado de Patentes & Aquisição Direta de Tecnologia de Concorrentes';

    const activeFacilitySet = window.activeFacilitySet || new Set();
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);
    const year = typeof window.year !== 'undefined' ? window.year : 2026;

    // Coleta o líder de qualidade do mercado para cada produto
    const marketTechs = {};
    for (const tile of activeFacilitySet.values()) {
      if (tile.competitor?.shelves) {
        for (const [prodId, cs] of Object.entries(tile.competitor.shelves)) {
          const currentLeader = marketTechs[prodId];
          if (!currentLeader || (cs.quality || 50) > currentLeader.quality) {
            marketTechs[prodId] = {
              productId: prodId,
              quality: cs.quality || 50,
              competitorName: tile.competitor.name,
              competitorId: tile.competitor.id
            };
          }
        }
      }
    }

    const availableForBuyout = [];
    for (const tech of Object.values(marketTechs)) {
      const myQR = this.getRDCurrentQR(tech.productId);
      if (tech.quality > myQR + 1) {
        availableForBuyout.push({
          ...tech,
          myQR,
          gain: tech.quality - myQR,
          prod: PRODUCT_CATALOG[tech.productId]
        });
      }
    }

    if (availableForBuyout.length === 0) {
      list.innerHTML = `
        <div class="text-center py-10 font-mono space-y-2">
          <div class="text-2xl">🏆</div>
          <p class="text-xs text-emerald-400 font-bold">Liderança Tecnológica Global!</p>
          <p class="text-[11px] text-slate-500">Nenhum concorrente no mercado possui tecnologia superior às suas linhas no momento.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    for (const item of availableForBuyout.sort((a, b) => b.gain - a.gain)) {
      const prod = item.prod;
      if (!prod) continue;
      const cat = RD_CATEGORIES[prod.category] || { baseCost: 3000 };
      const discountRate = (typeof window.MacroCycleSystem !== 'undefined' && typeof window.MacroCycleSystem.getTechDiscountMultiplier === 'function')
        ? window.MacroCycleSystem.getTechDiscountMultiplier(year)
        : 0.0;
      const rawCost = (prod.rdBaseCost || cat.baseCost) * item.gain * 8;
      const buyoutCost = Math.round(rawCost * (1 - discountRate));
      const canAfford = cash >= buyoutCost;
      const discountBadge = discountRate > 0 
        ? `<span class="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700 text-[9px] font-bold">🔥 -${Math.round(discountRate * 100)}% Liq. Recessão</span>`
        : '';

      const prodEmoji = (typeof window !== 'undefined' && window.getProductEmoji) ? window.getProductEmoji(item.productId) : (prod.emoji || cat.icon || '🔬');

      const card = document.createElement('div');
      card.className = 'bg-[#0b0e14] border border-white/[0.08] hover:border-[#c9a86a]/40 rounded-xl p-3 space-y-2 font-mono text-xs transition';
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">${prodEmoji}</span>
            <div>
              <div class="font-bold text-slate-100 text-[11px]">${prod.name}</div>
              <div class="text-[9px] text-[#94a3b8]">Detentor da Patente: <strong class="text-slate-200">${item.competitorName}</strong></div>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            ${discountBadge}
            <span class="bg-[#c9a86a]/15 text-[#c9a86a] px-2 py-0.5 rounded border border-[#c9a86a]/30 text-[9px] font-bold">Patente Disponível</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-[10px] bg-[#080a0d] p-2 rounded-lg border border-white/[0.08]">
          <div>Seu QR: <strong class="text-amber-300">${item.myQR.toFixed(1)}</strong></div>
          <div>QR Concorrente: <strong class="text-[#c9a86a]">${item.quality.toFixed(1)}</strong></div>
          <div>Salto Imediato: <strong class="text-emerald-400">+${item.gain.toFixed(1)} QR</strong></div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <div class="text-[11px] flex items-center gap-1">
            <span class="text-slate-400">Custo:</span>
            <strong class="${canAfford ? 'text-emerald-400' : 'text-rose-400'} font-bold">$${buyoutCost.toLocaleString('en-US')}</strong>
          </div>
          <button onclick="buyCompetitorTech('${item.productId}', ${item.quality}, ${buyoutCost}, '${item.competitorName}')"
            ${canAfford ? '' : 'disabled'}
            class="px-3 py-1 rounded-lg font-bold text-xs ${canAfford ? 'bg-[#c9a86a] hover:bg-[#d8b87a] text-[#080a0d] shadow-sm cursor-pointer' : 'bg-white/[0.04] text-slate-500 border border-white/[0.08] cursor-not-allowed'} transition">
            📜 Adquirir Patente
          </button>
        </div>
      `;
      list.appendChild(card);
    }
  },

  buyCompetitorTech(productId, targetQR, cost, competitorName) {
    let cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);
    if (cash < cost) {
      alert('Caixa insuficiente para adquirir esta patente!');
      return;
    }

    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const prod = PRODUCT_CATALOG[productId];
    if (!prod) return;

    if (typeof window.cash !== 'undefined') window.cash -= cost;
    else if (window.GameState) window.GameState.cash -= cost;

    const key = 'rd_' + productId;
    const prevQR = this.getRDCurrentQR(productId);
    const day = typeof window.day !== 'undefined' ? window.day : 1;
    const month = typeof window.month !== 'undefined' ? window.month : 1;
    const year = typeof window.year !== 'undefined' ? window.year : 2026;

    const rdLabs = window.rdLabs || {};
    const CoreMath = window.CoreMath;

    rdLabs[key] = {
      id: key,
      productId: productId,
      productName: prod.name,
      category: prod.category,
      monthlyBudget: 0,
      baseMonthlyRequired: CoreMath ? CoreMath.calculateRDMonthlyCost(targetQR, prod.rdBaseCost || 3000) : 3000,
      startQR: prevQR,
      currentQR: targetQR,
      targetQR: targetQR,
      monthsInvested: 0,
      totalSpent: cost,
      status: 'completed',
      completedAt: { day, month, year },
    };

    this.updateAllFactoryLinesQR(productId, targetQR);

    if (typeof window.addGameLog === 'function') {
      window.addGameLog(`📜 Patente de "${prod.name}" adquirida de ${competitorName}! QR avançou para ${targetQR.toFixed(1)} (-$${cost.toLocaleString('en-US')})`, 'text-purple-300 font-bold');
    }
    if (typeof window.updateUI === 'function') window.updateUI();
    this.renderRDMarketList();
  },

  setRDLabsCount(n) {
    const totalCapacity = this.getRDTotalLabCapacity();
    const usedSlots = this.getRDUsedLabSlots();
    const freeSlots = Math.max(1, totalCapacity - usedSlots);
    if (n > freeSlots) {
      n = freeSlots;
    }
    this.currentSelectedLabsCount = Math.max(1, n);

    for (let i = 1; i <= 4; i++) {
      const btn = document.getElementById(`rd-lab-btn-${i}`);
      if (!btn) continue;
      if (i === this.currentSelectedLabsCount) {
        btn.className = 'flex-1 py-1.5 rounded-lg bg-[#c9a86a] text-[#080a0d] font-bold border border-[#c9a86a] text-[11px] cursor-pointer shadow-sm';
      } else {
        btn.className = 'flex-1 py-1.5 rounded-lg bg-[#0b0e14] text-slate-400 border border-white/[0.08] text-[11px] cursor-pointer hover:text-white';
      }
    }

    const prodId = document.getElementById('rd-product-select')?.value;
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const CoreMath = window.CoreMath;
    const prod = PRODUCT_CATALOG[prodId];
    if (prod && CoreMath) {
      const cat = RD_CATEGORIES[prod.category] || { baseCost: 3000 };
      const currentQR = this.getRDCurrentQR(prodId);
      const minCostSingle = CoreMath.calculateRDMonthlyCost(currentQR, prod.rdBaseCost || cat.baseCost);
      const budgetInput = document.getElementById('rd-budget-input');
      if (budgetInput) budgetInput.value = minCostSingle * this.currentSelectedLabsCount;
    }

    this.updateRDWizardPreview();
  },

  setRDWizardFilter(type, value) {
    this.currentRDWizardFilterType = type;
    this.currentRDWizardFilterValue = value;

    const chips = document.querySelectorAll('#rd-wizard-filter-chips .rd-filter-chip');
    chips.forEach(chip => {
      if (chip.dataset.filter === value) {
        chip.className = 'rd-filter-chip px-2.5 py-1 rounded-lg font-bold border transition shrink-0 bg-[#c9a86a] text-[#080a0d] border-[#c9a86a] shadow-sm';
      } else {
        chip.className = 'rd-filter-chip px-2.5 py-1 rounded-lg font-bold border transition shrink-0 bg-[#0b0e14] text-slate-400 border-white/[0.08] hover:text-white';
      }
    });

    this.renderRDWizardProductList();
  },

  onRDWizardSearchInput(val) {
    this.currentRDWizardSearchText = val || '';
    const clearBtn = document.getElementById('rd-wizard-clear-search-btn');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !this.currentRDWizardSearchText.trim());
    }
    this.renderRDWizardProductList();
  },

  clearRDWizardSearch() {
    this.currentRDWizardSearchText = '';
    const input = document.getElementById('rd-wizard-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('rd-wizard-clear-search-btn');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.renderRDWizardProductList();
  },

  selectRDWizardProduct(prodId) {
    const hiddenInput = document.getElementById('rd-product-select');
    if (hiddenInput) hiddenInput.value = prodId;

    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const CoreMath = window.CoreMath;
    const prod = PRODUCT_CATALOG[prodId];
    const titleEl = document.getElementById('rd-wizard-selected-prod-title');
    if (titleEl) {
      titleEl.textContent = prod ? `· ${prod.name}` : '--';
    }

    const cards = document.querySelectorAll('#rd-wizard-products-list .rd-wizard-prod-card');
    cards.forEach(card => {
      if (card.dataset.prodId === prodId) {
        card.className = 'rd-wizard-prod-card p-2 rounded-xl border border-[#c9a86a] bg-[#c9a86a]/15 shadow-md ring-1 ring-[#c9a86a]/40 flex items-center justify-between cursor-pointer transition';
      } else {
        card.className = 'rd-wizard-prod-card p-2 rounded-xl border border-white/[0.08] bg-[#0b0e14] hover:bg-white/[0.04] hover:border-white/20 flex items-center justify-between cursor-pointer transition';
      }
    });

    if (prod) {
      const currentQR = this.getRDCurrentQR(prodId);
      let smartTarget = 80;
      if (currentQR < 60) smartTarget = 80;
      else if (currentQR < 75) smartTarget = 85;
      else if (currentQR < 85) smartTarget = 90;
      else if (currentQR < 95) smartTarget = 98;
      else smartTarget = 100;

      const slider = document.getElementById('rd-target-qr-slider');
      if (slider) {
        slider.min = Math.min(100, Math.ceil(currentQR + 1));
        slider.value = Math.max(parseInt(slider.min), smartTarget);
      }

      if (CoreMath) {
        const cat = RD_CATEGORIES[prod.category] || { baseCost: 3000 };
        const minCostSingle = CoreMath.calculateRDMonthlyCost(currentQR, prod.rdBaseCost || cat.baseCost);
        const budgetInput = document.getElementById('rd-budget-input');
        if (budgetInput) {
          budgetInput.value = minCostSingle * (this.currentSelectedLabsCount || 1);
        }
      }
    }

    this.updateRDWizardPreview();
  },

  renderRDWizardProductList() {
    const container = document.getElementById('rd-wizard-products-list');
    if (!container) return;

    const activeFacilitySet = window.activeFacilitySet || new Set();
    const rdLabs = window.rdLabs || {};
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const CoreMath = window.CoreMath;

    const activeManufacturing = new Set();
    const activeSelling = new Set();
    const activeResearchCounts = {};

    for (const tile of activeFacilitySet.values()) {
      if (tile.store) Object.keys(tile.store.shelves).forEach(id => activeSelling.add(id));
      if (tile.factory) Object.values(tile.factory.lines).forEach(l => activeManufacturing.add(l.outputProductId));
      if (tile.farm) {
        if (tile.farm.cropType) activeManufacturing.add(tile.farm.cropType);
        if (tile.farm.animalType) activeManufacturing.add(tile.farm.animalType);
      }
      if (tile.mine && tile.mine.resourceType) {
        activeManufacturing.add(tile.mine.resourceType);
      }
    }

    for (const proj of Object.values(rdLabs)) {
      if (proj.status === 'active') {
        activeResearchCounts[proj.productId] = (activeResearchCounts[proj.productId] || 0) + (proj.labsCount || 1);
      }
    }

    const selectedProdId = document.getElementById('rd-product-select')?.value || '';
    const search = (this.currentRDWizardSearchText || '').trim().toLowerCase();
    const allProds = Object.values(PRODUCT_CATALOG).sort((a, b) => a.name.localeCompare(b.name));

    const filteredProds = allProds.filter(prod => {
      if (this.currentRDWizardFilterType === 'scope') {
        if (this.currentRDWizardFilterValue === 'manufacturing' && !activeManufacturing.has(prod.id)) return false;
        if (this.currentRDWizardFilterValue === 'selling' && !activeSelling.has(prod.id)) return false;
        if (this.currentRDWizardFilterValue === 'researching' && !activeResearchCounts[prod.id]) return false;
      } else if (this.currentRDWizardFilterType === 'category') {
        if (this.currentRDWizardFilterValue === 'Agro') {
          if (!['Alimentos', 'Bebidas', 'Agronegócio'].includes(prod.category)) return false;
        } else if (this.currentRDWizardFilterValue === 'Farma') {
          if (!['Farmácia', 'Higiene', 'Cosméticos'].includes(prod.category)) return false;
        } else if (this.currentRDWizardFilterValue === 'Industria') {
          if (!['Insumos Industriais', 'Construção', 'Recursos Naturais'].includes(prod.category)) return false;
        } else if (this.currentRDWizardFilterValue === 'Consumo') {
          if (!['Eletrônicos', 'Vestuário', 'Automotivo', 'Móveis', 'Joias'].includes(prod.category)) return false;
        }
      }

      if (search) {
        const matchName = prod.name && prod.name.toLowerCase().includes(search);
        const matchCat = prod.category && prod.category.toLowerCase().includes(search);
        const matchId = prod.id && prod.id.toLowerCase().includes(search);
        if (!matchName && !matchCat && !matchId) return false;
      }

      return true;
    });

    if (filteredProds.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-slate-500 font-mono text-[11px] space-y-1">
          <p>🔍 Nenhum produto encontrado com os filtros atuais.</p>
          <button type="button" onclick="clearRDWizardSearch(); setRDWizardFilter('scope', 'all');" class="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer">Limpar filtros de busca</button>
        </div>
      `;
      return;
    }

    let html = '';
    for (const prod of filteredProds) {
      const isSelected = prod.id === selectedProdId;
      const currentQR = this.getRDCurrentQR(prod.id);
      const catInfo = RD_CATEGORIES[prod.category] || { icon: '🔬', baseCost: 3000 };
      const minCostSingle = CoreMath ? CoreMath.calculateRDMonthlyCost(currentQR, prod.rdBaseCost || catInfo.baseCost) : 3000;

      let qrBadgeClass = 'bg-[#080a0d] text-amber-300 border-white/[0.08]';
      if (currentQR >= 80) {
        qrBadgeClass = 'bg-[#c9a86a]/20 text-[#c9a86a] border-[#c9a86a]/50 shadow-sm font-bold';
      } else if (currentQR >= 65) {
        qrBadgeClass = 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60 font-bold';
      }

      let operationalTag = '';
      if (activeResearchCounts[prod.id]) {
        operationalTag = `<span class="bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/40 px-1.5 py-0.5 rounded text-[8px] font-bold animate-pulse">🔬 ${activeResearchCounts[prod.id]} LABS</span>`;
      } else if (activeManufacturing.has(prod.id)) {
        operationalTag = `<span class="bg-amber-950/70 text-amber-300 border border-amber-600/60 px-1.5 py-0.5 rounded text-[8px] font-bold">🏭 FABRICANDO</span>`;
      } else if (activeSelling.has(prod.id)) {
        operationalTag = `<span class="bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 px-1.5 py-0.5 rounded text-[8px] font-bold">🏪 VAREJO</span>`;
      }

      const cardClass = isSelected
        ? 'rd-wizard-prod-card p-2 rounded-xl border border-[#c9a86a] bg-[#c9a86a]/15 shadow-md ring-1 ring-[#c9a86a]/40 flex items-center justify-between cursor-pointer transition'
        : 'rd-wizard-prod-card p-2 rounded-xl border border-white/[0.08] bg-[#0b0e14] hover:bg-white/[0.04] hover:border-white/20 flex items-center justify-between cursor-pointer transition';

      const pEmoji = (typeof window !== 'undefined' && window.getProductEmoji) ? window.getProductEmoji(prod.id) : (prod.emoji || catInfo.icon || '📦');

      html += `
        <div class="${cardClass}" data-prod-id="${prod.id}" onclick="selectRDWizardProduct('${prod.id}')">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-base shrink-0">${pEmoji}</span>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <strong class="text-slate-100 text-[11px] truncate">${prod.name}</strong>
                ${operationalTag}
              </div>
              <div class="text-[9px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>${prod.category}</span>
                <span>·</span>
                <span class="text-emerald-400/90 font-bold">$${minCostSingle.toLocaleString('en-US')}/mês base</span>
              </div>
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 ${qrBadgeClass}">
              <span>⭐</span> QR ${currentQR.toFixed(1)}
            </span>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  onRDProductSelectChange() {
    const prodId = document.getElementById('rd-product-select')?.value;
    if (prodId) this.selectRDWizardProduct(prodId);
  },

  openRDNewProjectModal() {
    const centersCount = this.getBuiltRDCentersCount();
    const totalCapacity = this.getRDTotalLabCapacity();
    const usedSlots = this.getRDUsedLabSlots();
    const freeSlots = Math.max(0, totalCapacity - usedSlots);

    const showConfirm = window.showCustomConfirmModal;

    if (centersCount === 0) {
      if (typeof showConfirm === 'function') {
        showConfirm({
          icon: '🔬',
          title: 'Centro de P&D Necessário',
          subtitle: 'Instalação Científica Requerida',
          description: 'Você precisa <strong>inaugurar um Centro de P&D (Laboratório)</strong> no mapa da cidade para contratar cientistas e pesquisar novas tecnologias.',
          details: [
            { label: 'Custo de Construção', value: '$80,000', color: 'text-purple-400 font-bold' },
            { label: 'Aluguel do Solo', value: '-$10/dia', color: 'text-amber-400' },
            { label: 'Capacidade', value: '+4 Bancadas de Laboratório', color: 'text-emerald-400 font-bold' }
          ],
          confirmText: 'Entendido',
          confirmTheme: 'purple',
          onConfirm: null
        });
      }
      return;
    }

    if (freeSlots <= 0) {
      if (typeof showConfirm === 'function') {
        showConfirm({
          icon: '⚠️',
          title: 'Capacidade de P&D Esgotada',
          subtitle: `Bancadas Ocupadas: ${usedSlots}/${totalCapacity}`,
          description: `Todas as <strong>${totalCapacity} bancadas laboratoriais</strong> dos seus Centros de P&D estão ocupadas em pesquisas ativas. Construa outro Centro de P&D para obter mais 4 bancadas.`,
          details: [
            { label: 'Bancadas em Uso', value: `${usedSlots} de ${totalCapacity}`, color: 'text-rose-400 font-bold' },
            { label: 'Expansão', value: 'Construa +1 Centro de P&D (+4 Bancadas)', color: 'text-purple-300' }
          ],
          confirmText: 'Entendido',
          confirmTheme: 'purple',
          onConfirm: null
        });
      }
      return;
    }

    const slotsInfoEl = document.getElementById('rd-wizard-slots-info');
    if (slotsInfoEl) {
      slotsInfoEl.textContent = `Bancadas Livres: ${freeSlots}/${totalCapacity}`;
    }

    const hiddenInput = document.getElementById('rd-product-select');
    if (hiddenInput) hiddenInput.value = '';

    const titleEl = document.getElementById('rd-wizard-selected-prod-title');
    if (titleEl) titleEl.textContent = '--';

    const searchInput = document.getElementById('rd-wizard-search-input');
    if (searchInput) searchInput.value = '';
    this.currentRDWizardSearchText = '';
    this.currentRDWizardFilterType = 'scope';
    this.currentRDWizardFilterValue = 'all';

    const clearBtn = document.getElementById('rd-wizard-clear-search-btn');
    if (clearBtn) clearBtn.classList.add('hidden');

    const chips = document.querySelectorAll('#rd-wizard-filter-chips .rd-filter-chip');
    chips.forEach(chip => {
      if (chip.dataset.filter === 'all') {
        chip.className = 'rd-filter-chip px-2.5 py-1 rounded-lg font-bold border transition shrink-0 bg-[#c9a86a] text-[#080a0d] border-[#c9a86a] shadow-sm';
      } else {
        chip.className = 'rd-filter-chip px-2.5 py-1 rounded-lg font-bold border transition shrink-0 bg-[#0b0e14] text-slate-400 border-white/[0.08] hover:text-white';
      }
    });

    this.renderRDWizardProductList();
    this.setRDLabsCount(1);
    const slider = document.getElementById('rd-target-qr-slider');
    if (slider) slider.value = 80;

    const preview = document.getElementById('rd-wizard-preview');
    if (preview) preview.classList.add('hidden');

    const startBtn = document.getElementById('rd-start-btn');
    if (startBtn) startBtn.disabled = true;

    const modal = document.getElementById('rd-new-project-modal');
    if (modal) modal.classList.remove('hidden');
    this.updateRDWizardPreview();
  },

  closeRDNewProjectModal() {
    const modal = document.getElementById('rd-new-project-modal');
    if (modal) modal.classList.add('hidden');
  },

  updateRDWizardPreview() {
    const prodId = document.getElementById('rd-product-select')?.value;
    const targetQR = parseInt(document.getElementById('rd-target-qr-slider')?.value || '80');
    const budget = parseFloat(document.getElementById('rd-budget-input')?.value || '0') || 0;
    const labsCount = this.currentSelectedLabsCount || 1;

    const displayEl = document.getElementById('rd-target-qr-display');
    if (displayEl) displayEl.textContent = targetQR;

    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const CoreMath = window.CoreMath;
    const cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);

    const prod = PRODUCT_CATALOG[prodId];
    const preview = document.getElementById('rd-wizard-preview');
    const startBtn = document.getElementById('rd-start-btn');
    const badge = document.getElementById('rd-product-category-badge');
    const teamCostEl = document.getElementById('rd-team-cost-display');
    const extraBudgetEl = document.getElementById('rd-extra-budget-display');
    const warningMsg = document.getElementById('rd-budget-warning-msg');

    if (!prod) {
      if (preview) preview.classList.add('hidden');
      const roiBox = document.getElementById('rd-roi-calculator-box');
      if (roiBox) roiBox.classList.add('hidden');
      if (startBtn) startBtn.disabled = true;
      if (badge) badge.classList.add('hidden');
      if (teamCostEl) teamCostEl.textContent = '$0/mês';
      if (extraBudgetEl) extraBudgetEl.textContent = '+$0/mês';
      if (warningMsg) warningMsg.classList.add('hidden');
      const heroCurrent = document.getElementById('rd-hero-current-qr');
      const heroTarget = document.getElementById('rd-hero-target-qr');
      const heroGain = document.getElementById('rd-hero-qr-gain-badge');
      if (heroCurrent) heroCurrent.textContent = '--';
      if (heroTarget) heroTarget.textContent = '--';
      if (heroGain) heroGain.textContent = '+0 pts';
      return;
    }

    const cat = RD_CATEGORIES[prod.category] || { baseCost: 3000 };
    const currentQR = this.getRDCurrentQR(prodId);
    const minCostSingle = CoreMath ? CoreMath.calculateRDMonthlyCost(currentQR, prod.rdBaseCost || cat.baseCost) : 3000;
    const minCostTotal = minCostSingle * labsCount;

    const extraBudget = Math.max(0, budget - minCostTotal);
    const belowMin = budget < minCostTotal;

    if (teamCostEl) teamCostEl.textContent = `$${minCostTotal.toLocaleString('en-US')}/mês (${labsCount} lab${labsCount > 1 ? 's' : ''})`;
    if (extraBudgetEl) extraBudgetEl.textContent = extraBudget > 0 ? `+$${extraBudget.toLocaleString('en-US')}/mês` : '+$0/mês';
    if (warningMsg) warningMsg.classList.toggle('hidden', !belowMin);

    const heroCurrent = document.getElementById('rd-hero-current-qr');
    const heroTarget = document.getElementById('rd-hero-target-qr');
    const heroGain = document.getElementById('rd-hero-qr-gain-badge');
    const heroCurStatus = document.getElementById('rd-hero-current-status');
    const heroTarStatus = document.getElementById('rd-hero-target-status');

    if (heroCurrent) heroCurrent.textContent = currentQR.toFixed(1);
    if (heroTarget) heroTarget.textContent = targetQR;
    const ptsGain = Math.max(0, targetQR - currentQR);
    if (heroGain) heroGain.textContent = `+${ptsGain.toFixed(1)} pts`;

    if (heroCurStatus) {
      heroCurStatus.textContent = currentQR >= 80 ? 'Excelente' : (currentQR >= 65 ? 'Intermediário' : 'Padrão Inicial');
    }
    if (heroTarStatus) {
      heroTarStatus.textContent = targetQR >= 90 ? 'Liderança Global' : (targetQR >= 80 ? 'Grau Superior' : 'Aprimorado');
    }

    const gainMonth1 = (CoreMath && CoreMath.applyQRAsymptoticGrowth)
      ? (CoreMath.applyQRAsymptoticGrowth(currentQR, budget / labsCount) * labsCount)
      : ((CoreMath ? CoreMath.calculateRDQualityGain(currentQR, targetQR, budget / labsCount, minCostSingle) : 0) * labsCount);

    let simQR = currentQR;
    let monthsNeeded = 0;
    const MAX_SIM_MONTHS = 360;
    let reachedTarget = false;

    if (gainMonth1 > 0.00001 && targetQR > currentQR) {
      while (monthsNeeded < MAX_SIM_MONTHS) {
        const mGain = (CoreMath && CoreMath.applyQRAsymptoticGrowth)
          ? (CoreMath.applyQRAsymptoticGrowth(simQR, budget / labsCount) * labsCount)
          : ((CoreMath ? CoreMath.calculateRDQualityGain(simQR, targetQR, budget / labsCount, minCostSingle) : 0) * labsCount);

        if (mGain <= 0.00001) break;
        simQR += mGain;
        monthsNeeded++;

        if (simQR >= targetQR) {
          reachedTarget = true;
          break;
        }
      }
    }

    const totalMonthlyCost = reachedTarget ? Math.round(monthsNeeded * budget) : null;
    const setupFee = (CoreMath && CoreMath.calculateRDSetupCost)
      ? CoreMath.calculateRDSetupCost(targetQR, labsCount)
      : Math.round(targetQR * 120 * labsCount);
    const grandTotalCost = totalMonthlyCost !== null ? totalMonthlyCost + setupFee : null;

    if (badge) {
      badge.textContent = `${cat.icon || '🔬'} ${prod.category} · Custo Mínimo: $${minCostTotal.toLocaleString('en-US')}/mês`;
      badge.classList.remove('hidden');
    }

    const setupEl = document.getElementById('rd-prev-setup-cost');
    if (setupEl) setupEl.textContent = `$${setupFee.toLocaleString('en-US')}`;

    let etaText = 'Indeterminado';
    if (reachedTarget) {
      if (monthsNeeded < 12) {
        etaText = `≈ ${monthsNeeded} ${monthsNeeded === 1 ? 'mês' : 'meses'}`;
      } else {
        const yrs = (monthsNeeded / 12).toFixed(1);
        etaText = `≈ ${monthsNeeded} meses (${yrs} anos)`;
      }
    } else {
      etaText = `> 30 anos (Verba insuficiente para meta)`;
    }

    const curQREl = document.getElementById('rd-prev-current-qr');
    if (curQREl) curQREl.textContent = `${currentQR.toFixed(1)} / 100`;

    const gainEl = document.getElementById('rd-prev-gain');
    if (gainEl) gainEl.textContent = gainMonth1 > 0 ? `+${gainMonth1.toFixed(2)} QR no 1º mês (${labsCount}x acelerado)` : 'Sem progresso (verba insuficiente)';

    const etaEl = document.getElementById('rd-prev-eta');
    if (etaEl) etaEl.textContent = etaText;

    const totalCostEl = document.getElementById('rd-prev-total-cost');
    if (totalCostEl) totalCostEl.textContent = grandTotalCost ? `≈ $${grandTotalCost.toLocaleString('en-US')} ($${setupFee.toLocaleString('en-US')} setup + $${totalMonthlyCost.toLocaleString('en-US')} mensal)` : (reachedTarget ? '--' : 'Incalculável (aumente a verba mensal)');

    if (preview) preview.classList.remove('hidden');

    // ROI / Payback Calculator
    const roiBox = document.getElementById('rd-roi-calculator-box');
    if (roiBox) {
      const activeFacilitySet = window.activeFacilitySet || new Set();
      let activeStoresCount = 0;
      let totalMonthlyNetworkUnits = 0;
      let avgSellingPrice = prod.standardPrice || 10;
      let priceCount = 0;

      for (const tile of activeFacilitySet.values()) {
        if (tile.store?.shelves[prodId]) {
          activeStoresCount++;
          const shelf = tile.store.shelves[prodId];
          const d = tile.district;
          if (d && typeof window.calcElasticity === 'function') {
            const elast = window.calcElasticity(prod.necessityIndex || 1, prod.standardPrice || 10, shelf.price);
            const rawDailySales = d.population * (prod.perCapitaDailyDemand || 0.05) * (d.trafficIndex / 100) * 0.45 * elast;
            totalMonthlyNetworkUnits += Math.round(rawDailySales * 30);
          }
          avgSellingPrice += shelf.price;
          priceCount++;
        }
      }

      if (priceCount > 0) avgSellingPrice /= (priceCount + 1);

      const volumeEl = document.getElementById('rd-calc-volume');
      const storesEl = document.getElementById('rd-calc-stores');
      const retGainEl = document.getElementById('rd-calc-gain');
      const paybackEl = document.getElementById('rd-calc-payback');
      const verdictBadge = document.getElementById('rd-roi-verdict-badge');
      const explEl = document.getElementById('rd-calc-explanation');

      if (volumeEl) volumeEl.textContent = `${totalMonthlyNetworkUnits.toLocaleString()} un/mês`;
      if (storesEl) storesEl.textContent = `${activeStoresCount} ${activeStoresCount === 1 ? 'loja' : 'lojas'}`;

      const qrDelta = Math.max(0, targetQR - currentQR);
      const unitMarginGain = Number((avgSellingPrice * (qrDelta / 100) * 0.55).toFixed(2));
      const estimatedMonthlyGain = Math.round(totalMonthlyNetworkUnits * unitMarginGain);

      if (retGainEl) retGainEl.textContent = `+$${estimatedMonthlyGain.toLocaleString('en-US')}/mês`;

      if (grandTotalCost && estimatedMonthlyGain > 0) {
        const paybackMonths = Number((grandTotalCost / estimatedMonthlyGain).toFixed(1));
        if (paybackEl) paybackEl.textContent = `${paybackMonths} meses`;

        if (paybackMonths <= 12) {
          if (verdictBadge) {
            verdictBadge.textContent = '🟢 Alta Escala (Excelente)';
            verdictBadge.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800';
          }
          if (explEl) explEl.innerHTML = `Sua rede vende <strong>${totalMonthlyNetworkUnits.toLocaleString()} un/mês</strong> em ${activeStoresCount} filiais. O ganho de atratividade (+${qrDelta.toFixed(0)} QR) gerará <strong>+$${estimatedMonthlyGain.toLocaleString()}/mês</strong>, quitando o investimento em apenas <strong>${paybackMonths} meses</strong>!`;
        } else if (paybackMonths <= 24) {
          if (verdictBadge) {
            verdictBadge.textContent = '🟡 Médio Prazo (Viável)';
            verdictBadge.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800';
          }
          if (explEl) explEl.innerHTML = `Investimento viável. A pesquisa de $${grandTotalCost.toLocaleString()} se pagará em <strong>${paybackMonths} meses</strong> com o volume atual das suas ${activeStoresCount} lojas.`;
        } else {
          if (verdictBadge) {
            verdictBadge.textContent = '🔴 Longo Prazo (Baixa Escala)';
            verdictBadge.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800';
          }
          if (explEl) explEl.innerHTML = `Com apenas ${totalMonthlyNetworkUnits.toLocaleString()} un/mês vendidas, o payback levará <strong>${paybackMonths} meses</strong>. Recomendamos expandir mais lojas para amortizar o P&D mais rapidamente.`;
        }
      } else {
        if (paybackEl) paybackEl.textContent = '--';
        if (verdictBadge) {
          verdictBadge.textContent = '⚪ Sem Escala Comercial';
          verdictBadge.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700';
        }
        if (explEl) explEl.innerHTML = `Sua corporação ainda não vende <strong>${prod.name}</strong> em nenhuma loja. A pesquisa melhorará sua qualidade fabril, mas você precisará colocá-lo nas gôndolas para monetizar a patente.`;
      }

      roiBox.classList.remove('hidden');
    }

    if (startBtn) startBtn.disabled = !prodId || budget < minCostTotal || currentQR >= targetQR || cash < setupFee;
  },

  getRDCurrentQR(prodId) {
    const bestProjQR = this.getProductBestRDQuality(prodId);
    if (bestProjQR > 0) return bestProjQR;

    const activeFacilitySet = window.activeFacilitySet || new Set();
    let bestQR = 0;
    for (const tile of activeFacilitySet.values()) {
      if (tile.factory && tile.factory.lines) {
        for (const line of Object.values(tile.factory.lines)) {
          if (line.outputProductId === prodId && (line.outputQuality || 0) > bestQR) {
            bestQR = line.outputQuality;
          }
        }
      }
    }

    if (bestQR === 0) {
      const FACTORY_RECIPES = window.FACTORY_RECIPES || [];
      const recipe = (window.ProductionGraph ? window.ProductionGraph.getRecipeForProduct(prodId) : FACTORY_RECIPES.find(r => r.outputProdId === prodId || r.id === prodId));
      bestQR = recipe ? (recipe.quality || 60) : 60;
    }
    return bestQR;
  },

  startRDProject() {
    const prodId = document.getElementById('rd-product-select')?.value;
    const targetQR = parseInt(document.getElementById('rd-target-qr-slider')?.value || '80');
    const budget = parseFloat(document.getElementById('rd-budget-input')?.value || '0') || 0;
    const labsCount = this.currentSelectedLabsCount || 1;

    if (!prodId || budget <= 0 || targetQR <= 0) return;

    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const RD_CATEGORIES = window.RD_CATEGORIES || {};
    const CoreMath = window.CoreMath;
    let cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);

    const prod = PRODUCT_CATALOG[prodId];
    if (!prod) return;

    const currentQR = this.getRDCurrentQR(prodId);
    if (currentQR >= targetQR) {
      alert(`QR atual (${currentQR.toFixed(1)}) já atingiu o QR alvo (${targetQR})!`);
      return;
    }

    const cat = RD_CATEGORIES[prod.category] || { baseCost: 3000 };
    const minCostSingle = CoreMath ? CoreMath.calculateRDMonthlyCost(currentQR, prod.rdBaseCost || cat.baseCost) : 3000;
    const minCostTotal = minCostSingle * labsCount;

    if (budget < minCostTotal) {
      alert(`Verba insuficiente! O custo operacional para ${labsCount} bancada(s) de ${prod.name} é de pelo menos $${minCostTotal.toLocaleString('en-US')}/mês.`);
      return;
    }

    const setupFee = (CoreMath && CoreMath.calculateRDSetupCost)
      ? CoreMath.calculateRDSetupCost(targetQR, labsCount)
      : Math.round(targetQR * 120 * labsCount);

    if (cash < setupFee) {
      alert(`Caixa insuficiente para taxa de setup! Você precisa de $${setupFee.toLocaleString('en-US')} para adquirir reagentes e instrumentação para este projeto de P&D.`);
      return;
    }

    if (typeof window.cash !== 'undefined') window.cash -= setupFee;
    else if (window.GameState) window.GameState.cash -= setupFee;

    const rdLabs = window.rdLabs || {};
    const key = 'proj_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    rdLabs[key] = {
      id: key,
      productId: prodId,
      productName: prod.name,
      category: prod.category,
      labsCount: labsCount,
      monthlyBudget: budget,
      baseMonthlyRequired: minCostTotal,
      startQR: currentQR,
      currentQR: currentQR,
      targetQR: targetQR,
      monthsInvested: 0,
      totalSpent: setupFee,
      status: 'active',
      completedAt: null
    };

    if (typeof window.addGameLog === 'function') {
      window.addGameLog(`🔬 P&D Iniciado: ${prod.name} com ${labsCount} Bancada(s) → QR ${targetQR} (Setup: -$${setupFee.toLocaleString('en-US')} | Verba: $${budget.toLocaleString('en-US')}/mês)`, 'text-purple-400 font-bold');
    }
    if (typeof window.playSuccessChime === 'function') window.playSuccessChime();
    this.closeRDNewProjectModal();
    this.renderRDProjectsList();
    this.updateRDChip();

    if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
      window.renderFacilityPanel(window.activeManagedTile);
    }
  },

  pauseRDProject(id) {
    const rdLabs = window.rdLabs || {};
    if (rdLabs[id]) {
      rdLabs[id].status = 'paused';
      this.renderRDProjectsList();
      if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
        window.renderFacilityPanel(window.activeManagedTile);
      }
    }
  },

  resumeRDProject(id) {
    const rdLabs = window.rdLabs || {};
    if (rdLabs[id]) {
      rdLabs[id].status = 'active';
      this.renderRDProjectsList();
      if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
        window.renderFacilityPanel(window.activeManagedTile);
      }
    }
  },

  cancelRDProject(id) {
    const rdLabs = window.rdLabs || {};
    const proj = rdLabs[id];
    if (!proj) return;
    const isCompleted = proj.status === 'completed';
    const showConfirm = window.showCustomConfirmModal;

    if (isCompleted) {
      if (typeof showConfirm === 'function') {
        showConfirm({
          icon: '📁',
          title: 'Arquivar Patente Concluída',
          subtitle: `${proj.productName} (Patente QR ${Math.round(proj.currentQR)})`,
          description: `Deseja arquivar o registro de pesquisa de <strong>${proj.productName}</strong> do laboratório? A qualidade conquistada permanecerá ativa em sua holding e disponível para todas as fábricas.`,
          details: [
            { label: 'Qualidade Tecnológica', value: `QR ${Math.round(proj.currentQR)}`, color: 'text-emerald-400 font-bold' },
            { label: 'Meses de Pesquisa', value: `${proj.monthsInvested} meses`, color: 'text-slate-300' },
            { label: 'Investimento Histórico', value: `$${proj.totalSpent.toLocaleString('en-US')}`, color: 'text-teal-300' }
          ],
          confirmText: 'Arquivar Patente',
          confirmTheme: 'teal',
          onConfirm: () => {
            delete rdLabs[id];
            this.renderRDProjectsList();
            this.updateRDChip();
            if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
              window.renderFacilityPanel(window.activeManagedTile);
            }
            if (typeof window.addGameLog === 'function') {
              window.addGameLog(`📁 Patente de "${proj.productName}" (QR ${Math.round(proj.currentQR)}) arquivada do laboratório.`, 'text-teal-400');
            }
          }
        });
      }
      return;
    }

    if (typeof showConfirm === 'function') {
      showConfirm({
        icon: '🗑️',
        title: 'Cancelar Projeto de P&D',
        subtitle: `${proj.productName} (QR ${proj.currentQR.toFixed(1)} → ${proj.targetQR})`,
        description: `Tem certeza que deseja encerrar a pesquisa de <strong>${proj.productName}</strong>? Todo o investimento acumulado de <strong>$${proj.totalSpent.toLocaleString('en-US')}</strong> será perdido.`,
        details: [
          { label: 'Bancadas Alocadas', value: `${proj.labsCount || 1} Lab(s)`, color: 'text-purple-300' },
          { label: 'Meses Investidos', value: `${proj.monthsInvested} meses`, color: 'text-slate-300' },
          { label: 'Total Investido', value: `-$${proj.totalSpent.toLocaleString('en-US')}`, color: 'text-rose-400 font-bold' }
        ],
        confirmText: 'Encerrar Pesquisa',
        confirmTheme: 'rose',
        onConfirm: () => {
          delete rdLabs[id];
          this.renderRDProjectsList();
          this.updateRDChip();
          if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
            window.renderFacilityPanel(window.activeManagedTile);
          }
          if (typeof window.addGameLog === 'function') {
            window.addGameLog(`🗑️ Projeto de P&D "${proj.productName}" foi cancelado.`, 'text-slate-400');
          }
        }
      });
    }
  },

  adjustRDBudget(id) {
    const rdLabs = window.rdLabs || {};
    const proj = rdLabs[id];
    if (!proj) return;
    const newBudget = parseFloat(prompt(`Nova verba mensal para "${proj.productName}" (atual: $${proj.monthlyBudget.toLocaleString('en-US')}):`, proj.monthlyBudget));
    if (!isNaN(newBudget) && newBudget >= 0) {
      proj.monthlyBudget = newBudget;
      if (typeof window.addGameLog === 'function') {
        window.addGameLog(`🔬 P&D — Verba ajustada: ${proj.productName} → $${newBudget.toLocaleString('en-US')}/mês`, 'text-purple-400');
      }
      this.renderRDProjectsList();
      if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
        window.renderFacilityPanel(window.activeManagedTile);
      }
    }
  },

  processRDProgress() {
    const rdLabs = window.rdLabs || {};
    const PRODUCT_CATALOG = window.PRODUCT_CATALOG || {};
    const CoreMath = window.CoreMath;
    let cash = typeof window.cash !== 'undefined' ? window.cash : (window.GameState?.cash || 0);
    const day = typeof window.day !== 'undefined' ? window.day : 1;
    const month = typeof window.month !== 'undefined' ? window.month : 1;
    const year = typeof window.year !== 'undefined' ? window.year : 2026;

    let anyCompleted = false;
    for (const proj of Object.values(rdLabs)) {
      if (proj.status !== 'active') continue;

      const prod = PRODUCT_CATALOG[proj.productId];
      if (!prod) continue;

      const labsCount = proj.labsCount || 1;
      const spent = Math.min(proj.monthlyBudget, cash);
      
      if (typeof window.cash !== 'undefined') window.cash -= spent;
      else if (window.GameState) window.GameState.cash -= spent;
      cash -= spent;

      proj.totalSpent += spent;
      proj.monthsInvested++;

      const gainSingle = CoreMath ? CoreMath.applyQRAsymptoticGrowth(proj.currentQR, spent / labsCount) : 0;
      const gainTotal = gainSingle * labsCount;
      proj.currentQR = Math.min(proj.targetQR, proj.currentQR + gainTotal);

      if (gainTotal > 0) {
        this.updateAllFactoryLinesQR(proj.productId, proj.currentQR);
      }

      if (proj.currentQR >= proj.targetQR) {
        proj.status = 'completed';
        proj.completedAt = { day, month, year };
        anyCompleted = true;
        if (typeof window.addLog === 'function') {
          window.addLog(`🎉 P&D CONCLUÍDO! "${proj.productName}" atingiu QR ${proj.targetQR.toFixed(1)}! Custo total: $${proj.totalSpent.toLocaleString('en-US')}`, 'text-emerald-400 font-bold', { actionType: 'OPEN_RD' });
        }
      } else if (gainTotal > 0) {
        if (typeof window.addLog === 'function') {
          window.addLog(`🔬 P&D "${proj.productName}" (${labsCount} Labs): +${gainTotal.toFixed(2)} QR/mês → QR atual: ${proj.currentQR.toFixed(1)} / ${proj.targetQR}`, 'text-sky-300');
        }
      }
    }

    this.updateRDChip();
    if (document.getElementById('rd-center-modal') && !document.getElementById('rd-center-modal').classList.contains('hidden')) {
      this.renderRDProjectsList();
    }
    if (window.activeManagedTile && window.activeManagedTile.rdCenter && typeof window.renderFacilityPanel === 'function') {
      window.renderFacilityPanel(window.activeManagedTile);
    }
  },

  updateAllFactoryLinesQR(productId, newQR) {
    const activeFacilitySet = window.activeFacilitySet || new Set();
    for (const tile of activeFacilitySet.values()) {
      if (!tile.factory || !tile.factory.lines) continue;
      for (const line of Object.values(tile.factory.lines)) {
        if (line.outputProductId === productId) {
          line.outputQuality = Math.min(100, Math.max(line.outputQuality || 60, newQR));
        }
      }
    }
  },

  propagateQualityRD() {
    const activeFacilitySet = window.activeFacilitySet || new Set();
    const CoreMath = window.CoreMath;
    for (const tile of activeFacilitySet.values()) {
      if (!tile.store || !tile.store.shelves) continue;
      for (const [prodId, shelf] of Object.entries(tile.store.shelves)) {
        const bestQR = this.getProductBestRDQuality(prodId);
        if (bestQR <= (shelf.quality || 60)) continue;

        const soldToday = shelf.lastDailySales || 0;
        if (CoreMath && typeof CoreMath.propagateQualityToShelf === 'function') {
          shelf.quality = CoreMath.propagateQualityToShelf(
            shelf.quality || 60,
            bestQR,
            soldToday,
            shelf.maxCapacity || 1000
          );
        }
      }
    }
  },

  updateRDChip() {
    const chip = document.getElementById('telemetry-rd-chip');
    if (!chip) return;
    const rdLabs = window.rdLabs || {};
    const active = Object.values(rdLabs).filter(p => p.status === 'active').length;
    if (active > 0) {
      chip.textContent = `🔬 ${active} pesquisa${active > 1 ? 's' : ''}`;
      chip.classList.remove('hidden');
    } else {
      chip.classList.add('hidden');
    }
  }
};

// Global bindings for inline HTML event handlers
if (typeof window !== 'undefined') {
  window.RDPanel = RDPanel;
  window.openRDCenterModal = RDPanel.openRDCenterModal.bind(RDPanel);
  window.closeRDCenterModal = RDPanel.closeRDCenterModal.bind(RDPanel);
  window.getBuiltRDCentersCount = RDPanel.getBuiltRDCentersCount.bind(RDPanel);
  window.getRDTotalLabCapacity = RDPanel.getRDTotalLabCapacity.bind(RDPanel);
  window.getRDUsedLabSlots = RDPanel.getRDUsedLabSlots.bind(RDPanel);
  window.getProductBestRDQuality = RDPanel.getProductBestRDQuality.bind(RDPanel);
  window.setRDProjectsFilter = RDPanel.setRDProjectsFilter.bind(RDPanel);
  window.renderRDProjectsList = RDPanel.renderRDProjectsList.bind(RDPanel);
  window.switchRDTab = RDPanel.switchRDTab.bind(RDPanel);
  window.renderRDMarketList = RDPanel.renderRDMarketList.bind(RDPanel);
  window.buyCompetitorTech = RDPanel.buyCompetitorTech.bind(RDPanel);
  window.setRDLabsCount = RDPanel.setRDLabsCount.bind(RDPanel);
  window.setRDWizardFilter = RDPanel.setRDWizardFilter.bind(RDPanel);
  window.onRDWizardSearchInput = RDPanel.onRDWizardSearchInput.bind(RDPanel);
  window.clearRDWizardSearch = RDPanel.clearRDWizardSearch.bind(RDPanel);
  window.selectRDWizardProduct = RDPanel.selectRDWizardProduct.bind(RDPanel);
  window.renderRDWizardProductList = RDPanel.renderRDWizardProductList.bind(RDPanel);
  window.onRDProductSelectChange = RDPanel.onRDProductSelectChange.bind(RDPanel);
  window.openRDNewProjectModal = RDPanel.openRDNewProjectModal.bind(RDPanel);
  window.closeRDNewProjectModal = RDPanel.closeRDNewProjectModal.bind(RDPanel);
  window.updateRDWizardPreview = RDPanel.updateRDWizardPreview.bind(RDPanel);
  window.getRDCurrentQR = RDPanel.getRDCurrentQR.bind(RDPanel);
  window.startRDProject = RDPanel.startRDProject.bind(RDPanel);
  window.pauseRDProject = RDPanel.pauseRDProject.bind(RDPanel);
  window.resumeRDProject = RDPanel.resumeRDProject.bind(RDPanel);
  window.cancelRDProject = RDPanel.cancelRDProject.bind(RDPanel);
  window.adjustRDBudget = RDPanel.adjustRDBudget.bind(RDPanel);
  window.processRDProgress = RDPanel.processRDProgress.bind(RDPanel);
  window.updateAllFactoryLinesQR = RDPanel.updateAllFactoryLinesQR.bind(RDPanel);
  window.propagateQualityRD = RDPanel.propagateQualityRD.bind(RDPanel);
  window.updateRDChip = RDPanel.updateRDChip.bind(RDPanel);
}

export default RDPanel;
