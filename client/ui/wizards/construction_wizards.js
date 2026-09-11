/**
 * OIKONOMIA - Specialized Construction Wizards Controller
 * client/ui/wizards/construction_wizards.js
 *
 * Gerencia os assistentes de planejamento e construção primária e industrial:
 * - Assistente de Minas (recursos naturais, payback e viabilidade extrativa)
 * - Assistente de Fazendas (culturas agrícolas, pecuária, busca em tempo real e retorno)
 * - Assistente de Fábricas & Manufatura (4 linhas de montagem, desbloqueio in-place de tecnologia e gestão de receitas)
 */

import {
  NATURAL_MINES,
  FARM_TYPES,
  FACTORY_RECIPES,
  PRODUCT_CATALOG
} from '../../data_catalogs.js';

export const ConstructionWizards = {
  pendingMineTile: null,
  pendingFarmTile: null,
  pendingFactoryTile: null,
  activeFactoryTile: null,
  activeFactoryRecipeFilterCategory: 'all',

  get pendingTile() {
    return this.pendingMineTile || this.pendingFarmTile || this.pendingFactoryTile || (typeof window !== 'undefined' ? window.pendingTile : null);
  },
  set pendingTile(tile) {
    this.pendingMineTile = tile;
    this.pendingFarmTile = tile;
    this.pendingFactoryTile = tile;
    if (typeof window !== 'undefined') window.pendingTile = tile;
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

  get unlockedProducts() {
    if (typeof window !== 'undefined' && window.unlockedProducts) return window.unlockedProducts;
    if (typeof window !== 'undefined' && window.GameState?.unlockedProducts) return window.GameState.unlockedProducts;
    return new Set();
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

  isProductUnlocked(id) {
    if (typeof window !== 'undefined' && typeof window.isProductUnlocked === 'function') {
      return window.isProductUnlocked(id);
    }
    return this.unlockedProducts.has(id);
  },

  getProductBestRDQuality(id) {
    if (typeof window !== 'undefined' && typeof window.getProductBestRDQuality === 'function') {
      return window.getProductBestRDQuality(id);
    }
    return 0;
  },

  // =========================================================================
  // 1. WIZARD DE MINAS & JAZIDAS MINERAIS
  // =========================================================================

  openMineModal(tile) {
    this.pendingTile = tile;
    const subEl = document.getElementById('mine-modal-subtitle');
    if (subEl) {
      subEl.textContent = `Local: ${tile.district?.name || 'Metrópole'} (${tile.x}, ${tile.y}) · Aluguel: $${tile.district?.landRentDaily || 0}/dia`;
    }

    const list = document.getElementById('mine-types-list');
    if (!list) return;

    const currentCash = this.cash;
    const mines = (typeof NATURAL_MINES !== 'undefined' ? NATURAL_MINES : window.NATURAL_MINES) || [];

    list.innerHTML = mines.map(m => {
      const canAfford = currentCash >= m.cost;
      const spriteKey = (typeof window !== 'undefined' && window.SpriteManager?.getMineSpriteKey)
        ? window.SpriteManager.getMineSpriteKey(m.id)
        : `minas/${m.id}`;
      const estMonthlyExtraction = m.dailyYield * 30;
      const estUnitProfit = Math.max(0.5, (m.unitCost * 1.8) - m.unitCost);
      const estMonthlyProfit = Math.max(400, Math.round(estMonthlyExtraction * estUnitProfit - ((tile.district?.landRentDaily || 0) * 30)));
      const paybackMin = Math.max(2, Math.round(m.cost / (estMonthlyProfit * 1.2)));
      const paybackMax = Math.max(paybackMin + 2, Math.round(m.cost / (estMonthlyProfit * 0.8)));

      return `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-white/[0.08] hover:border-[#c9a86a]/40 transition flex items-center justify-between text-xs font-mono gap-3 shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-[#0d1017] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              <img src="assets/${spriteKey}.png" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
              <span class="text-xl hidden">${m.emoji}</span>
            </div>
            <div>
              <div class="text-sm font-bold text-slate-100">${m.name}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Extração: <strong class="text-emerald-400">${m.dailyYield} un/dia</strong> · Custo: <strong class="text-slate-200">$${m.unitCost.toFixed(2)}/un</strong> · QR: <strong class="text-[#c9a86a]">${m.quality}</strong></div>
              <div class="text-[9px] font-mono text-[#c9a86a] bg-[#c9a86a]/10 p-1 rounded-lg border border-[#c9a86a]/20 mt-1">
                ⏱ Payback Estimado: <strong>${paybackMin} a ${paybackMax} meses</strong>
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">${m.desc}</div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-bold text-rose-400 mb-1">$${m.cost.toLocaleString()}</div>
            <button onclick="confirmBuildMine('${m.id}')" ${!canAfford ? 'disabled' : ''} class="bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow transition">Construir</button>
          </div>
        </div>
      `;
    }).join('');

    const modal = document.getElementById('mine-modal');
    if (modal) modal.classList.remove('hidden');
  },

  confirmBuildMine(mineId) {
    if (!this.pendingTile) return;
    const mines = (typeof NATURAL_MINES !== 'undefined' ? NATURAL_MINES : window.NATURAL_MINES) || [];
    const m = mines.find(n => n.id === mineId);
    if (!m || this.cash < m.cost) return;

    const res = m.resourceId || '';
    const isTimber = res === 'timber' || m.id === 'mine_timber';
    const isSilica = res === 'silica' || m.id === 'mine_silica';
    const isOil = res === 'crude_oil' || m.id === 'mine_oil';
    const isBauxite = res === 'bauxite' || m.id === 'mine_bauxite';
    const isGold = res === 'gold_ore' || m.id === 'mine_gold';
    const isChem = res === 'chemical_minerals' || m.id === 'mine_chemicals';

    const customName = isTimber ? '🪵 Serraria & Silvicultura' 
      : (isSilica ? '🏖️ Jazida de Sílica & Quartzo' 
      : (isOil ? '🛢️ Campo Petrolífero'
      : (isBauxite ? '🪨 Mina de Bauxita'
      : (isGold ? '🥇 Mina de Ouro Nobre'
      : (isChem ? '🧪 Depósito de Minerais Químicos' : `${m.emoji} ${m.name}`)))));

    const targetTile = this.pendingTile;
    this.checkWorkingCapitalSafety(m.cost, () => {
      this.cash -= m.cost;
      targetTile.mine = {
        id: `mine_${targetTile.x}_${targetTile.y}`,
        mineTypeId: m.id,
        name: customName,
        resourceId: m.resourceId,
        resourceName: m.resourceName,
        quality: m.quality,
        dailyYield: m.dailyYield,
        unitCost: m.unitCost,
        stock: 500,
        maxCapacity: 8000
      };
      targetTile.buildingHeight = 18;
      this._indexTile(targetTile);

      const logEmoji = isTimber ? '🪵' : (isSilica ? '🏖️' : (isOil ? '🛢️' : (isBauxite ? '🪨' : (isGold ? '🥇' : (isChem ? '🧪' : '⛏️')))));
      const logClass = isTimber ? 'text-amber-400 font-bold' 
        : (isSilica ? 'text-stone-300 font-bold' 
        : (isOil ? 'text-slate-300 font-bold' 
        : (isBauxite ? 'text-orange-400 font-bold' 
        : (isGold ? 'text-yellow-400 font-bold' 
        : (isChem ? 'text-teal-400 font-bold' : 'text-sky-400 font-bold')))));

      this.addLog(`${logEmoji} ${customName} inaugurada por $${m.cost.toLocaleString()}!`, logClass);
      if (typeof window !== 'undefined' && window.SoundEngine && typeof window.SoundEngine.playBuild === 'function') {
        window.SoundEngine.playBuild();
      }

      this.closeMineModal();
      if (typeof window !== 'undefined') window.activeManagedTile = targetTile;
      this.renderFacility(targetTile);
      this.scheduleRender();
      this.updateUI();
    }, customName);
  },

  confirmBuildMineDirect(x, y, mineId) {
    this.pendingTile = this.worldGrid[x]?.[y];
    this.confirmBuildMine(mineId);
  },

  closeMineModal() {
    const modal = document.getElementById('mine-modal');
    if (modal) modal.classList.add('hidden');
    this.pendingMineTile = null;
  },

  // =========================================================================
  // 2. WIZARD DE FAZENDAS & PECUÁRIA
  // =========================================================================

  filterFarmTypes(query) {
    this.renderFarmTypesList(query);
  },

  renderFarmTypesList(search = '') {
    if (!this.pendingTile) return;
    const tile = this.pendingTile;
    const q = (search || '').toLowerCase().trim();
    const list = document.getElementById('farm-types-list');
    if (!list) return;

    const farmTypes = (typeof FARM_TYPES !== 'undefined' ? FARM_TYPES : window.FARM_TYPES) || [];
    const filtered = farmTypes.filter(ft => {
      if (!q) return true;
      const name = (ft.name || '').toLowerCase();
      const cropName = (ft.cropName || '').toLowerCase();
      const desc = (ft.desc || '').toLowerCase();
      const id = (ft.id || '').toLowerCase();
      return name.includes(q) || cropName.includes(q) || desc.includes(q) || id.includes(q);
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="text-center py-8 text-slate-500 font-mono text-xs">
          <span class="text-2xl block mb-2">🔍🌾</span>
          Nenhuma propriedade encontrada para "<strong>${search}</strong>".
        </div>
      `;
      return;
    }

    const currentCash = this.cash;
    list.innerHTML = filtered.map(ft => {
      const canAfford = currentCash >= ft.cost;
      const spriteKey = (typeof window !== 'undefined' && window.SpriteManager?.getFarmSpriteKey)
        ? window.SpriteManager.getFarmSpriteKey(ft.id)
        : (ft.id === 'farm_timber' ? 'agricultura/farm_timber' : `agro/${ft.id}`);
      const estMonthlyYield = ft.dailyYield * 30;
      const estUnitProfit = Math.max(0.4, (ft.unitCost * 1.7) - ft.unitCost);
      const estMonthlyProfit = Math.max(400, Math.round(estMonthlyYield * estUnitProfit - ((tile.district?.landRentDaily || 0) * 30)));
      const paybackMin = Math.max(2, Math.round(ft.cost / (estMonthlyProfit * 1.2)));
      const paybackMax = Math.max(paybackMin + 2, Math.round(ft.cost / (estMonthlyProfit * 0.8)));

      return `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border border-white/[0.08] flex items-center justify-between text-xs font-mono gap-3 hover:border-[#c9a86a]/40 transition shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-[#0d1017] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              <img src="assets/${spriteKey}.png" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
              <span class="text-xl hidden">${ft.emoji}</span>
            </div>
            <div>
              <div class="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>${ft.name}</span>
                ${ft.id === 'farm_timber' ? '<span class="text-[9px] bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30 px-1.5 py-0.2 rounded font-bold">Silvicultura</span>' : ''}
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">Produção: <strong class="text-emerald-400">${ft.dailyYield} un/dia</strong> · Custo: <strong class="text-slate-200">$${ft.unitCost.toFixed(2)}/un</strong> · QR: <strong class="text-[#c9a86a]">${ft.quality}</strong></div>
              <div class="text-[9px] font-mono text-[#c9a86a] bg-[#c9a86a]/10 p-1 rounded-lg border border-[#c9a86a]/20 mt-1">
                ⏱ Payback Estimado: <strong>${paybackMin} a ${paybackMax} meses</strong>
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">${ft.desc}</div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-bold text-rose-400 mb-1">$${ft.cost.toLocaleString()}</div>
            <button onclick="confirmBuildFarm('${ft.id}')" ${!canAfford ? 'disabled' : ''} class="bg-[#c9a86a] hover:bg-[#d8b779] disabled:opacity-40 text-[#080a0d] font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow transition">Construir</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openFarmModal(tile) {
    this.pendingTile = tile;
    const subEl = document.getElementById('farm-modal-subtitle');
    if (subEl) {
      subEl.textContent = `Local: ${tile.district?.name || 'Metrópole'} (${tile.x}, ${tile.y}) · Aluguel: $${tile.district?.landRentDaily || 0}/dia`;
    }
    const searchInput = document.getElementById('farm-search-input');
    if (searchInput) searchInput.value = '';
    this.renderFarmTypesList('');
    const modal = document.getElementById('farm-modal');
    if (modal) modal.classList.remove('hidden');
  },

  confirmBuildFarm(farmTypeId) {
    if (!this.pendingTile) return;
    const farmTypes = (typeof FARM_TYPES !== 'undefined' ? FARM_TYPES : window.FARM_TYPES) || [];
    const ft = farmTypes.find(f => f.id === farmTypeId);
    if (!ft || this.cash < ft.cost) return;

    const targetTile = this.pendingTile;
    this.checkWorkingCapitalSafety(ft.cost, () => {
      this.cash -= ft.cost;
      targetTile.farm = {
        id: `farm_${targetTile.x}_${targetTile.y}`,
        farmTypeId: ft.id,
        cost: ft.cost,
        name: `${ft.emoji} ${ft.name}`,
        cropId: ft.cropId,
        cropName: ft.cropName,
        quality: ft.quality,
        dailyYield: ft.dailyYield,
        dailyOperatingCost: ft.unitCost,
        stock: 500,
        maxCapacity: 5000
      };
      targetTile.buildingHeight = 18;
      this._indexTile(targetTile);

      this.addLog(`🌾 ${ft.name} construída com sucesso por $${ft.cost.toLocaleString()}!`, 'text-amber-400 font-bold');
      if (typeof window !== 'undefined' && window.SoundEngine && typeof window.SoundEngine.playBuild === 'function') {
        window.SoundEngine.playBuild();
      }
      this.closeFarmModal();
      if (typeof window !== 'undefined') window.activeManagedTile = targetTile;
      this.renderFacility(targetTile);
      this.scheduleRender();
      this.updateUI();
    }, ft.name);
  },

  closeFarmModal() {
    const modal = document.getElementById('farm-modal');
    if (modal) modal.classList.add('hidden');
    this.pendingFarmTile = null;
  },

  // =========================================================================
  // 3. WIZARD DE FÁBRICAS, LINHAS & RECEITAS INDUSTRIAIS
  // =========================================================================

  openFactoryModal(tile) {
    this.pendingTile = tile;
    const subEl = document.getElementById('factory-modal-subtitle');
    if (subEl) {
      subEl.textContent = `Local: ${tile.district?.name || 'Metrópole'} (${tile.x}, ${tile.y}) · Aluguel: $${tile.district?.landRentDaily || 0}/dia`;
    }
    const btn = document.getElementById('btn-confirm-factory');
    if (btn) btn.disabled = this.cash < 48000;

    const modal = document.getElementById('factory-modal');
    if (modal) modal.classList.remove('hidden');
  },

  confirmBuildFactory() {
    if (!this.pendingTile || this.cash < 48000) return;
    const cost = 48000;
    const targetTile = this.pendingTile;

    this.checkWorkingCapitalSafety(cost, () => {
      this.cash -= cost;
      targetTile.factory = {
        id: `factory_${targetTile.x}_${targetTile.y}`,
        name: `Fábrica Central (${targetTile.x}, ${targetTile.y})`,
        maxLines: 4,
        lines: {}
      };
      targetTile.buildingHeight = 22;
      this._indexTile(targetTile);

      this.addLog(`🏭 Fábrica de Manufatura construída por $48.000!`, 'text-orange-400 font-bold');
      if (typeof window !== 'undefined' && window.SoundEngine && typeof window.SoundEngine.playBuild === 'function') {
        window.SoundEngine.playBuild();
      }
      this.closeFactoryModal();
      if (typeof window !== 'undefined') window.activeManagedTile = targetTile;
      this.renderFacility(targetTile);
      this.scheduleRender();
      this.updateUI();
    }, 'Fábrica Central de Manufatura');
  },

  closeFactoryModal() {
    const modal = document.getElementById('factory-modal');
    if (modal) modal.classList.add('hidden');
    this.pendingFactoryTile = null;
  },

  openFactoryRecipeModal(x, y) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.factory) return;
    this.activeFactoryTile = tile;
    this.activeFactoryRecipeFilterCategory = 'all';

    const searchInput = document.getElementById('factory-recipe-search-input');
    if (searchInput) searchInput.value = '';

    this.renderFactoryRecipesList();
    const modal = document.getElementById('factory-recipe-modal');
    if (modal) modal.classList.remove('hidden');
  },

  setFactoryRecipeCategoryFilter(cat) {
    this.activeFactoryRecipeFilterCategory = cat;
    this.renderFactoryRecipesList();
  },

  unlockFactoryRecipeInPlace(recipeId, productId, cost) {
    if (this.cash < cost) {
      alert(`Fundos insuficientes! São necessários $${cost.toLocaleString('en-US')} para desbloquear esta tecnologia.`);
      return;
    }
    this.cash -= cost;
    this.unlockedProducts.add(productId);

    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};
    const prodName = catalog[productId]?.name || productId;
    this.addLog(`🧬 Tecnologia "${prodName}" desbloqueada com sucesso por $${cost.toLocaleString('en-US')}!`, 'text-teal-300 font-bold');
    this.updateUI();
    this.renderFactoryRecipesList();
  },

  renderFactoryRecipesList() {
    if (!this.activeFactoryTile?.factory) return;
    const tile = this.activeFactoryTile;
    const factory = tile.factory;
    const totalLines = Object.keys(factory.lines || {}).length;
    const maxLines = factory.maxLines || 4;
    const isFull = totalLines >= maxLines;

    const searchInput = document.getElementById('factory-recipe-search-input');
    const searchQuery = (searchInput?.value || '').trim().toLowerCase();

    // Renderiza abas de categorias
    const tabsContainer = document.getElementById('factory-recipe-category-tabs');
    if (tabsContainer) {
      const categories = [
        { id: 'all', label: 'Todos' },
        { id: 'intermediate', label: '⚙️ Insumos' },
        { id: 'Alimentos', label: '🌾 Alimentos' },
        { id: 'Bebidas', label: '🍺 Bebidas' },
        { id: 'Vestuário', label: '👗 Vestuário' },
        { id: 'Eletrônicos', label: '💻 Tecnologia' },
        { id: 'Automotivo', label: '🚗 Automotivo' },
        { id: 'Móveis', label: '🛋️ Móveis' }
      ];

      tabsContainer.innerHTML = categories.map(cat => {
        const isActive = this.activeFactoryRecipeFilterCategory === cat.id;
        return `
          <button onclick="setFactoryRecipeCategoryFilter('${cat.id}')"
            class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap text-xs ${isActive ? 'bg-[#c9a86a] text-[#080a0d] shadow' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.06]'}">
            ${cat.label}
          </button>
        `;
      }).join('');
    }

    const catalog = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : window.PRODUCT_CATALOG) || {};
    const allRecipes = (typeof FACTORY_RECIPES !== 'undefined' ? FACTORY_RECIPES : window.FACTORY_RECIPES) || [];

    let recipes = allRecipes.slice();
    if (this.activeFactoryRecipeFilterCategory === 'intermediate') {
      recipes = recipes.filter(r => r.isIntermediate);
    } else if (this.activeFactoryRecipeFilterCategory !== 'all') {
      recipes = recipes.filter(r => {
        const cat = catalog[r.outputProdId]?.category;
        return cat === this.activeFactoryRecipeFilterCategory;
      });
    }

    if (searchQuery) {
      recipes = recipes.filter(r => {
        const nameMatch = r.name.toLowerCase().includes(searchQuery) || (r.outputName && r.outputName.toLowerCase().includes(searchQuery));
        const prodCat = (catalog[r.outputProdId]?.category || '').toLowerCase();
        const inputsMatch = r.inputs && Object.entries(r.inputs).some(([inpId]) => {
          const inpName = (catalog[inpId]?.name || inpId).toLowerCase();
          return inpName.includes(searchQuery);
        });
        return nameMatch || prodCat.includes(searchQuery) || inputsMatch;
      });
    }

    const list = document.getElementById('factory-available-recipes-list');
    if (!list) return;

    if (recipes.length === 0) {
      list.innerHTML = `<div class="text-center py-10 text-slate-500 font-mono text-xs">Nenhuma linha de produção encontrada para os filtros selecionados.</div>`;
      return;
    }

    const currentCash = this.cash;
    list.innerHTML = recipes.map(rec => {
      const countOfRecipe = Object.values(factory.lines || {}).filter(l => l.recipeId === rec.id).length;
      const spriteKey = (typeof window !== 'undefined' && window.SpriteManager?.getFactorySprite)
        ? window.SpriteManager.getFactorySprite(rec.id)
        : 'empresas/factory_default';
      const unlocked = this.isProductUnlocked(rec.outputProdId || rec.id);

      const coreMath = (typeof window !== 'undefined' && window.CoreMath) ? window.CoreMath : null;
      const tier = coreMath?.calculateProductionTier ? coreMath.calculateProductionTier(rec.outputProdId || rec.id, allRecipes) : 1;
      const bonus = coreMath?.calculateConvergenceBonus ? coreMath.calculateConvergenceBonus(rec.outputProdId || rec.id, allRecipes) : 0;
      const cost = coreMath?.calculateResearchCost ? coreMath.calculateResearchCost(tier, bonus) : 25000;
      const canAffordUnlock = currentCash >= cost;

      const researchedQR = this.getProductBestRDQuality(rec.outputProdId || rec.id);
      const effectiveQR = researchedQR > 0 ? Math.max(rec.quality, researchedQR) : rec.quality;
      const techLvl = (coreMath && typeof coreMath.getTechLevelLabel === 'function')
        ? coreMath.getTechLevelLabel(effectiveQR)
        : { level: 1, label: 'Padrão', icon: '🥉', color: 'text-slate-300 border-white/[0.08] bg-white/[0.04]' };

      const qrBadge = researchedQR > rec.quality 
        ? `<span class="text-[#c9a86a] font-bold" title="Qualidade aprimorada em P&D (${researchedQR.toFixed(1)})">★ QR ${effectiveQR.toFixed(0)} (P&D)</span>` 
        : `<span class="text-[#c9a86a]">QR ${effectiveQR}</span>`;

      const inputPills = rec.inputs ? Object.entries(rec.inputs).map(([inpId, qty]) => {
        const inpProd = catalog[inpId] || { name: inpId };
        const isUnlocked = this.isProductUnlocked(inpId);
        return `<span class="px-1.5 py-0.5 rounded text-[9px] border font-mono ${isUnlocked ? 'bg-[#0d1017] text-slate-300 border-white/[0.08]' : 'bg-rose-950/40 text-rose-300 border-rose-800/60 font-bold'}">${qty}x ${inpProd.name} ${!isUnlocked ? '🔒' : '✓'}</span>`;
      }).join(' ') : '<span class="text-[9px] text-slate-500">Nenhum</span>';

      return `
        <div class="bg-[#0b0e14] p-3.5 rounded-xl border ${unlocked ? 'border-white/[0.08]' : 'border-white/[0.04] bg-[#0b0e14]/60 opacity-90'} flex items-center justify-between text-xs font-mono gap-3 hover:border-white/[0.16] transition shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-[#0d1017] border border-white/[0.08] p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              <img src="assets/${spriteKey}.png" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
              <span class="text-xl hidden">🏭</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold ${unlocked ? 'text-slate-100' : 'text-slate-400'}">${rec.name} (${rec.outputName})</span>
                <span class="text-[9px] bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded">${rec.isIntermediate ? 'Insumo Industrial' : 'Bem de Consumo'}</span>
                <span class="text-[9px] bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30 px-1.5 py-0.5 rounded font-bold">Tier ${tier}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded border font-bold ${techLvl.color}">${techLvl.icon} Lvl ${techLvl.level}</span>
                ${countOfRecipe > 0 ? `<span class="text-[9px] bg-[#c9a86a]/20 text-[#c9a86a] px-1.5 py-0.5 rounded border border-[#c9a86a]/40 font-bold">${countOfRecipe} linha${countOfRecipe > 1 ? 's' : ''} ativa${countOfRecipe > 1 ? 's' : ''}</span>` : ''}
              </div>
              <div class="text-[11px] text-slate-400 mt-1">Custo Fabril: <strong class="text-emerald-400">$${rec.unitCost.toFixed(2)}/un</strong> · Qualidade: ${qrBadge} · Capacidade: <strong class="text-slate-200">${rec.dailyCap} un/dia</strong></div>
              <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                <span class="text-slate-500 font-bold">Insumos Necessários:</span>
                ${inputPills}
              </div>
              ${!unlocked ? `<div class="text-[10px] text-amber-400 mt-1 font-bold flex items-center gap-1">🔒 Bloqueado: Desbloqueie com 1 clique abaixo para começar a produzir</div>` : ''}
            </div>
          </div>
          <div class="shrink-0">
            ${!unlocked ? `
              <button onclick="unlockFactoryRecipeInPlace('${rec.id}', '${rec.outputProdId || rec.id}', ${cost})"
                class="bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] font-bold px-3 py-2 rounded-xl text-xs cursor-pointer shadow-lg transition whitespace-nowrap flex items-center gap-1 ${!canAffordUnlock ? 'opacity-50 cursor-not-allowed' : ''}">
                🧬 Desbloquear ($${cost.toLocaleString('en-US')})
              </button>
            ` : (isFull ? `
              <span class="text-[10px] text-slate-500 bg-[#0d1017] px-2.5 py-1.5 rounded-lg border border-white/[0.08] font-bold">Fábrica Lotada (${maxLines}/${maxLines})</span>
            ` : `
              <button onclick="confirmActivateFactoryRecipe('${rec.id}')" class="bg-[#c9a86a] hover:bg-[#d8b779] text-[#080a0d] font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer shadow-lg transition">
                ${countOfRecipe > 0 ? '+ Adicionar Mais 1 Linha' : '➕ Ativar Linha'}
              </button>
            `)}
          </div>
        </div>
      `;
    }).join('');
  },

  confirmActivateFactoryRecipe(recipeId) {
    if (!this.activeFactoryTile?.factory) return;
    const factory = this.activeFactoryTile.factory;
    const currentLinesCount = Object.keys(factory.lines || {}).length;
    if (currentLinesCount >= (factory.maxLines || 4)) {
      alert('Esta fábrica já atingiu a capacidade máxima de 4 linhas de montagem!');
      return;
    }

    const allRecipes = (typeof FACTORY_RECIPES !== 'undefined' ? FACTORY_RECIPES : window.FACTORY_RECIPES) || [];
    const rec = allRecipes.find(r => r.id === recipeId);
    if (!rec) return;

    if (!this.isProductUnlocked(rec.outputProdId || rec.id)) {
      alert(`A tecnologia "${rec.outputName}" ainda não foi pesquisada! Desbloqueie-a primeiro na Árvore de P&D.`);
      return;
    }

    const researchedQR = this.getProductBestRDQuality(rec.outputProdId || rec.id);
    const initialQuality = researchedQR > 0 ? Math.max(rec.quality, researchedQR) : rec.quality;
    const lineKey = `line_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    factory.lines[lineKey] = {
      lineId: lineKey,
      recipeId: rec.id,
      recipeName: rec.name,
      outputProductId: rec.outputProdId,
      dailyCapacity: rec.dailyCap,
      unitCost: rec.unitCost,
      outputQuality: initialQuality,
      finishedStock: 200,
      maxStock: 3000
    };

    this.addLog(`⚙️ Linha de montagem "${rec.name}" instalada com sucesso! (${Object.keys(factory.lines).length}/4 linhas operando)`, 'text-orange-400 font-bold');
    if (typeof window !== 'undefined' && typeof window.playSuccessChime === 'function') {
      window.playSuccessChime();
    }
    this.closeFactoryRecipeModal();
    this.renderFacility(this.activeFactoryTile);
    this.updateUI();
  },

  removeFactoryLine(x, y, lineKey) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.factory?.lines[lineKey]) return;
    const lineName = tile.factory.lines[lineKey].recipeName;
    delete tile.factory.lines[lineKey];
    this.addLog(`🛑 Linha de montagem "${lineName}" desativada.`, 'text-slate-400');
    this.renderFacility(tile);
    this.updateUI();
  },

  closeFactoryRecipeModal() {
    const modal = document.getElementById('factory-recipe-modal');
    if (modal) modal.classList.add('hidden');
    this.activeFactoryTile = null;
  },

  recalculateFactoryLineEconomics(line, tile) {
    const allRecipes = (typeof FACTORY_RECIPES !== 'undefined' ? FACTORY_RECIPES : window.FACTORY_RECIPES) || [];
    const rec = allRecipes.find(r => r.id === line.recipeId);
    if (!rec) return;

    let totalInputsCost = 0;
    let totalWeightedQuality = 0;
    let totalInputRatio = 0;

    if (rec.inputs) {
      for (const [inpId, ratio] of Object.entries(rec.inputs)) {
        const cfg = line.inputsConfig?.[inpId] || this.getDefaultSupplierForInput(inpId, tile);
        totalInputsCost += (cfg.landedCost || 0.5) * ratio;
        totalWeightedQuality += (cfg.quality || 60) * ratio;
        totalInputRatio += ratio;
      }
    }

    const avgInputQuality = totalInputRatio > 0 ? (totalWeightedQuality / totalInputRatio) : 60;
    const researchedQR = this.getProductBestRDQuality(line.outputProductId);

    line.unitCost = Number((totalInputsCost + (rec.processingCost || (rec.unitCost * 0.4))).toFixed(2));
    line.outputQuality = Math.min(100, Math.round(avgInputQuality * 0.65 + (researchedQR > 0 ? researchedQR : rec.quality) * 0.35));
  },

  getDefaultSupplierForInput(inputId, factoryTile) {
    if (typeof window !== 'undefined' && typeof window.getSupplierOffersForProduct === 'function') {
      const offers = window.getSupplierOffersForProduct(inputId, factoryTile);
      if (offers.length > 0) {
        const internal = offers.find(o => o.type?.startsWith('internal_'));
        return internal || offers[0];
      }
    }
    return {
      supplierId: `port_default_${inputId}`,
      supplierName: 'Porto de Alimentos & Insumos',
      wholesalePrice: 0.50,
      freight: 0.05,
      landedCost: 0.55,
      quality: 60
    };
  }
};

export default ConstructionWizards;
