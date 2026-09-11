/**
 * marketing_panel.js — Central de Mídia, Publicidade Corporativa & Audiência IBOPE
 * OIKONOMIA v0.8.5 (Fase 7.0 B — Desacoplamento da Central de Marketing)
 * 
 * Responsável por:
 * - Gestão de contratos publicitários institucionais (marca guarda-chuva) e individuais por produto
 * - Orçamento mensal de mídia e débito diário na DRE
 * - Métricas analíticas estilo Capitalism II: IBOPE rating, alcance populacional, CPRP e Share of Voice (SOV)
 * - Integração contextual com sedes de mídia no mapa, HUD e fechamento via ESC
 */

import GameState from '../../game_state.js';
import {
  MEDIA_OUTLETS,
  PRODUCT_CATALOG,
  CITY_DISTRICTS,
  getProductEmoji
} from '../../data_catalogs.js';

export const state = {
  currentMarketingFilterOutletId: null
};

function getActiveMarketingContracts() {
  if (typeof window !== 'undefined' && window.activeMarketingContracts) {
    return window.activeMarketingContracts;
  }
  return GameState.activeMarketingContracts || new Set();
}

function getPlayerProfile() {
  if (typeof window !== 'undefined' && window.playerProfile) {
    return window.playerProfile;
  }
  return GameState.playerProfile || { companyName: 'Oikonomia Corp' };
}

function getPlayerBrandRating() {
  if (typeof window !== 'undefined' && window.playerBrandRating) {
    return window.playerBrandRating;
  }
  return GameState.playerBrandRating || {};
}

function safeAddLog(msg, colorClass) {
  if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
    window.addLog(msg, colorClass);
  } else {
    console.log('[MarketingPanel]', msg);
  }
}

function safeUpdateUI() {
  if (typeof window !== 'undefined') {
    if (typeof window.updateHUD === 'function') window.updateHUD();
    else if (typeof window.updateUI === 'function') window.updateUI();
  }
}

function safeRenderFacilityPanel() {
  if (typeof window !== 'undefined' && window.activeManagedTile) {
    if (window.FacilityPanel && typeof window.FacilityPanel.renderFacilityPanel === 'function') {
      window.FacilityPanel.renderFacilityPanel(window.activeManagedTile);
    } else if (typeof window.renderFacilityPanel === 'function') {
      window.renderFacilityPanel(window.activeManagedTile);
    }
  }
}

function resolveProductEmoji(prod) {
  if (typeof window !== 'undefined' && typeof window.getProductEmoji === 'function') {
    return window.getProductEmoji(prod.id);
  }
  if (typeof getProductEmoji === 'function') {
    return getProductEmoji(prod.id);
  }
  return prod.emoji || '📦';
}

/**
 * Calcula a soma de todos os custos mensais de contratos de mídia contratados.
 * @returns {number} Custo total em dólares por mês
 */
export function getTotalMonthlyMarketingBudget() {
  let total = 0;
  const activeContracts = getActiveMarketingContracts();
  const outlets = (typeof window !== 'undefined' && window.MEDIA_OUTLETS) ? window.MEDIA_OUTLETS : MEDIA_OUTLETS;
  
  for (const contractKey of activeContracts) {
    const [outletId, prodId] = contractKey.split('::');
    const outlet = outlets.find(o => o.id === outletId);
    if (outlet) {
      total += prodId === '__institutional__' ? outlet.institutionalMonthlyCost : outlet.monthlyCost;
    }
  }
  return total;
}

/**
 * Abre e renderiza a Central de Mídia e Publicidade Corporativa.
 * @param {string|null} [filterOutletId] ID opcional de veículo de mídia para visualização focada
 */
export function openMarketingCentralModal(filterOutletId) {
  if (filterOutletId !== undefined) {
    state.currentMarketingFilterOutletId = filterOutletId;
  }
  const modal = document.getElementById('marketing-modal');
  if (!modal) return;

  const list = document.getElementById('media-outlets-list');
  const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : PRODUCT_CATALOG;
  const products = Object.values(catalog);
  const outlets = (typeof window !== 'undefined' && window.MEDIA_OUTLETS) ? window.MEDIA_OUTLETS : MEDIA_OUTLETS;
  const districts = (typeof window !== 'undefined' && window.CITY_DISTRICTS) ? window.CITY_DISTRICTS : CITY_DISTRICTS;
  const activeContracts = getActiveMarketingContracts();
  const profile = getPlayerProfile();
  const brandRating = getPlayerBrandRating();

  const totalMonthlyMkt = getTotalMonthlyMarketingBudget();
  const totalDailyMkt = totalMonthlyMkt / 30;

  // População Metropolitana Total
  const totalMetropolisPop = Object.values(districts).reduce((acc, d) => acc + (d.population || 0), 0);

  const elContracts = document.getElementById('mkt-summary-contracts');
  const elMonthly = document.getElementById('mkt-summary-monthly-cost');
  const elDaily = document.getElementById('mkt-summary-daily-cost');

  if (elContracts) elContracts.textContent = `${activeContracts.size} campanha(s) ativa(s)`;
  if (elMonthly) elMonthly.textContent = `-$${totalMonthlyMkt.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mês`;
  if (elDaily) elDaily.textContent = `-$${totalDailyMkt.toLocaleString('en-US', { minimumFractionDigits: 2 })}/dia`;

  const outletsToShow = state.currentMarketingFilterOutletId
    ? outlets.filter(o => o.id === state.currentMarketingFilterOutletId)
    : outlets;

  const titleEl = document.getElementById('marketing-modal-title');
  const subtitleEl = document.getElementById('marketing-modal-subtitle');

  if (state.currentMarketingFilterOutletId && outletsToShow.length > 0) {
    const outlet = outletsToShow[0];
    if (titleEl) {
      titleEl.innerHTML = `
        <span>${outlet.emoji} ${outlet.name} — Contratação de Mídia & IBOPE</span>
        <button onclick="openMarketingCentralModal(null)" class="ml-auto text-[11px] text-indigo-300 hover:text-white bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-700 font-mono cursor-pointer transition">
          ← Ver Todas as Emissoras
        </button>
      `;
    }
    if (subtitleEl) {
      subtitleEl.textContent = `Tipo: ${outlet.type} · IBOPE: ${outlet.ibopeRating} pts · Alcance: ${outlet.reachDescription}`;
    }
  } else {
    if (titleEl) {
      titleEl.innerHTML = `<span>📢 Central de Mídia, IBOPE & Publicidade Corporativa</span>`;
    }
    if (subtitleEl) {
      subtitleEl.textContent = `Contrate campanhas institucionais ou individuais analisando pontos de IBOPE, CPRP e Share of Voice.`;
    }
  }

  if (list) {
    list.innerHTML = outletsToShow.map(outlet => {
      const instKey = `${outlet.id}::__institutional__`;
      const isInstActive = activeContracts.has(instKey);

      // Métricas Analíticas Estilo Capitalism II
      const reachPop = Math.round(totalMetropolisPop * (outlet.reachPct / 100) * (outlet.ibopeRating / 100));
      const cprpProd = (outlet.monthlyCost / outlet.ibopeRating).toFixed(2);
      const cprpInst = (outlet.institutionalMonthlyCost / outlet.ibopeRating).toFixed(2);

      // Share of Voice (Presença Publicitária)
      const prodContractsCount = products.filter(p => activeContracts.has(`${outlet.id}::${p.id}`)).length;
      const myShare = isInstActive ? Math.min(85, 45 + prodContractsCount * 6) : (prodContractsCount > 0 ? Math.min(60, prodContractsCount * 12) : 10);
      const compShare = 100 - myShare;

      return `
        <div class="bg-[#080a0d] p-4 rounded-xl border border-white/[0.06] space-y-3.5 font-mono">
          <!-- Header do Veículo de Mídia -->
          <div class="flex flex-wrap items-center justify-between pb-3 border-b border-white/[0.06] gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${outlet.emoji}</span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-100">${outlet.name}</span>
                  <span class="text-[9px] bg-white/5 text-[#c9a86a] px-2 py-0.5 rounded-full border border-white/10 font-bold">${outlet.type}</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  Cobertura: <strong class="text-slate-300">${outlet.reachDescription}</strong>
                </div>
              </div>
            </div>

            <!-- Badges de IBOPE e Eficiência -->
            <div class="flex items-center gap-2">
              <div class="bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-right">
                <span class="text-[8px] text-emerald-400 uppercase block leading-none font-bold">IBOPE / Rating</span>
                <span class="text-xs font-black text-emerald-300">⭐ ${outlet.ibopeRating} pts</span>
              </div>
              <div class="bg-[#0b0e14] border border-white/[0.08] px-2 py-1 rounded-lg text-right">
                <span class="text-[8px] text-slate-500 uppercase block leading-none">Perfil de Mídia</span>
                <span class="text-[10px] font-bold text-[#c9a86a]">${outlet.efficiencyLabel}</span>
              </div>
            </div>
          </div>

          <!-- Painel Analítico de 3 Pilares (Capitalism Style) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] bg-[#0b0e14] p-3 rounded-xl border border-white/[0.06]">
            <div>
              <span class="text-slate-400 block text-[9px]">👥 Audiência Real Estimada:</span>
              <span class="text-slate-100 font-bold text-[11px]">${reachPop.toLocaleString('pt-BR')} pessoas</span>
              <span class="text-slate-500 text-[8px] block">(${outlet.reachPct}% de penetração)</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px]">💲 Custo por Ponto de IBOPE (CPRP):</span>
              <span class="text-amber-300 font-bold text-[11px]">$${cprpProd}/pt (Prod)</span>
              <span class="text-slate-500 text-[8px] block">Rede: $${cprpInst}/pt</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[9px]">📈 Impulso de Brand Rating:</span>
              <span class="text-emerald-400 font-bold text-[11px]">+${outlet.brandBoostMonthly} pts/mês</span>
              <span class="text-slate-500 text-[8px] block">Teto de Eficácia: ${outlet.brandCap} pts</span>
            </div>
          </div>

          <!-- Barra de Share of Voice (Presença Publicitária no Canal) -->
          <div class="space-y-1 bg-[#0b0e14] p-2.5 rounded-xl border border-white/[0.04]">
            <div class="flex justify-between text-[9px]">
              <span class="text-slate-400 flex items-center gap-1">
                📢 <span>Share of Voice: <strong class="text-[#c9a86a]">${profile.companyName || 'Sua Empresa'} (${myShare}%)</strong></span>
              </span>
              <span class="text-slate-500">Concorrência IA (${compShare}%)</span>
            </div>
            <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              <div class="bg-gradient-to-r from-[#c9a86a] to-emerald-400 h-full transition-all duration-300" style="width: ${myShare}%"></div>
              <div class="bg-white/10 h-full transition-all duration-300" style="width: ${compShare}%"></div>
            </div>
          </div>

          <!-- Campanha Institucional da Rede (Marca Corporativa) -->
          <div class="p-3 rounded-xl border ${isInstActive ? 'border-[#c9a86a] bg-[#c9a86a]/10 shadow-[0_0_15px_rgba(201,168,106,0.1)]' : 'border-white/[0.06] bg-[#0b0e14]'} flex items-center justify-between font-mono text-xs">
            <div>
              <div class="font-bold text-amber-300 flex items-center gap-1.5">
                <span>🏢 Marca Corporativa Guarda-Chuva (Toda a Rede)</span>
                <span class="text-[9px] bg-amber-950/60 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700/50">Institucional</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">Impulsiona simultaneamente todas as lojas e gôndolas da sua holding.</div>
              <div class="text-[11px] text-slate-300 mt-1">Custo: <strong class="text-rose-400 font-bold">$${outlet.institutionalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mês</strong></div>
            </div>
            <button onclick="toggleMarketingContract('${outlet.id}', '__institutional__')"
              class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${isInstActive ? 'bg-[#c9a86a] text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'}">
              ${isInstActive ? '📢 ATIVA' : 'Contratar Rede'}
            </button>
          </div>

          <!-- Campanhas de Produto Individual -->
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono block mb-1.5 font-bold">Ou Anunciar Produtos Individuais ($${outlet.monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mês cada):</span>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              ${products.map(prod => {
                const contractKey = `${outlet.id}::${prod.id}`;
                const isActive = activeContracts.has(contractKey);
                const brand = brandRating[prod.id] || 20;
                const emoji = resolveProductEmoji(prod);
                return `
                  <div onclick="toggleMarketingContract('${outlet.id}', '${prod.id}')"
                    class="cursor-pointer p-2.5 rounded-xl border text-[11px] font-mono flex flex-col justify-between transition gap-1.5 select-none
                      ${isActive ? 'border-[#c9a86a] bg-[#c9a86a]/10 text-slate-100 ring-1 ring-[#c9a86a]/50 shadow-md shadow-[#c9a86a]/10' : 'border-white/[0.06] bg-[#0b0e14] text-slate-300 hover:border-white/20 hover:bg-[#0d1017]'}">
                    <div class="flex items-center justify-between">
                      <span class="font-bold truncate pr-1 text-slate-100 text-[11px] flex items-center gap-1.5"><span class="shrink-0">${emoji}</span><span class="truncate">${prod.name}</span></span>
                      <span class="text-[10px] px-1.5 py-0.2 rounded font-bold ${isActive ? 'bg-[#c9a86a] text-slate-950' : 'bg-white/5 text-slate-400 border border-white/10'}">${isActive ? '📢 ON' : 'OFF'}</span>
                    </div>
                    <div class="space-y-1">
                      <div class="flex justify-between text-[9px] text-slate-400">
                        <span>Brand Rating</span>
                        <span class="font-bold ${brand > 50 ? 'text-emerald-400' : 'text-slate-300'}">${brand}/100</span>
                      </div>
                      <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full ${brand > 50 ? 'bg-emerald-500' : 'bg-[#c9a86a]'} transition-all duration-300" style="width: ${brand}%"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
}

/**
 * Ativa ou encerra um contrato de publicidade para um veículo e produto/marca institucional.
 * @param {string} outletId ID do veículo de comunicação
 * @param {string} prodId ID do produto ou '__institutional__'
 */
export function toggleMarketingContract(outletId, prodId) {
  const contractKey = `${outletId}::${prodId}`;
  const outlets = (typeof window !== 'undefined' && window.MEDIA_OUTLETS) ? window.MEDIA_OUTLETS : MEDIA_OUTLETS;
  const outlet = outlets.find(o => o.id === outletId);
  const activeContracts = getActiveMarketingContracts();
  const catalog = (typeof window !== 'undefined' && window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : PRODUCT_CATALOG;

  if (activeContracts.has(contractKey)) {
    activeContracts.delete(contractKey);
    const outletName = outlet ? outlet.name : outletId;
    safeAddLog(`📢 Contrato na ${outletName} cancelado.`, 'text-slate-400');
  } else {
    activeContracts.add(contractKey);
    const outletName = outlet ? outlet.name : outletId;
    const nameStr = prodId === '__institutional__' ? 'Marca Corporativa da Rede' : (catalog[prodId]?.name || prodId);
    safeAddLog(`📺 Contrato firmado na ${outletName}: Campanha de ${nameStr} no ar!`, 'text-indigo-400 font-bold');
  }

  openMarketingCentralModal(state.currentMarketingFilterOutletId);
  safeRenderFacilityPanel();
  safeUpdateUI();
}

/**
 * Oculta o modal da Central de Mídia.
 */
export function closeMarketingModal() {
  const modal = document.getElementById('marketing-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Alterna a visibilidade do modal da Central de Mídia.
 * @param {string|null} [filterOutletId]
 */
export function toggleMarketingModal(filterOutletId) {
  const modal = document.getElementById('marketing-modal');
  if (modal && !modal.classList.contains('hidden')) {
    closeMarketingModal();
  } else {
    openMarketingCentralModal(filterOutletId);
  }
}

export const MarketingPanel = {
  state,
  getTotalMonthlyMarketingBudget,
  openMarketingCentralModal,
  toggleMarketingContract,
  closeMarketingModal,
  toggleMarketingModal
};

if (typeof window !== 'undefined') {
  window.MarketingPanel = MarketingPanel;
  window.getTotalMonthlyMarketingBudget = getTotalMonthlyMarketingBudget;
  window.openMarketingCentralModal = openMarketingCentralModal;
  window.toggleMarketingContract = toggleMarketingContract;
  window.closeMarketingModal = closeMarketingModal;
  window.toggleMarketingModal = toggleMarketingModal;
}

export default MarketingPanel;
