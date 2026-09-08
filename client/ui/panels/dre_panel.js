/**
 * dre_panel.js — Demonstrativo do Resultado do Exercício & Balanço Patrimonial
 * OIKONOMIA v0.8.5 (Fase 6.4 — Controladores dos Painéis Modais)
 * 
 * Responsável por:
 * - Sincronização em tempo real da DRE executiva (syncDREValues)
 * - Modal analítico de DRE por instalação (openFacilityDREModal, renderFacilityDRETable)
 * - Séries temporais históricas de receita e lucro com escala adaptativa
 * - Cálculo de patrimônio líquido corporativo (calculateCorporateNetWorth)
 */

import GameState from '../../game_state.js';
import { STORE_TYPES } from '../../data_catalogs.js';
import MacroCycleSystem from '../../macro_cycle_system.js';

export function syncDREValues(gross, cogs, rent, mkt, net, financial = 0, netWorth = 0) {
  const gEl = document.getElementById('dre-gross-sales');
  const cEl = document.getElementById('dre-cogs');
  const rEl = document.getElementById('dre-rent');
  const mEl = document.getElementById('dre-marketing');
  const fEl = document.getElementById('dre-financial');
  const nEl = document.getElementById('dre-net-profit');
  const nwEl = document.getElementById('dre-net-worth');

  if (gEl) gEl.textContent = '+$' + gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (cEl) cEl.textContent = '-$' + cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (rEl) rEl.textContent = '-$' + rent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (mEl) mEl.textContent = '-$' + mkt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (fEl) fEl.textContent = '-$' + (financial || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (nEl) {
    nEl.textContent = (net >= 0 ? '+$' : '-$') + Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    nEl.className = net >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
  }
  if (nwEl) {
    nwEl.textContent = (netWorth >= 0 ? '$' : '-$') + Math.abs(netWorth).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    nwEl.className = netWorth >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
  }
}

export function openFacilityDREModal() {
  const m = document.getElementById('facility-dre-modal');
  if (!m) return;
  renderFacilityDRETable();
  m.classList.remove('hidden');
}

export function closeFacilityDREModal() {
  const m = document.getElementById('facility-dre-modal');
  if (m) m.classList.add('hidden');
}

export function toggleDREModal() {
  const m = document.getElementById('dre-modal');
  if (m) m.classList.toggle('hidden');
}

export function calculateCorporateNetWorth() {
  let landTotal = 0;
  let facilitiesTotal = 0;
  let inventoryTotal = 0;

  const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : new Map();
  const storeTypes = (typeof window !== 'undefined' && window.STORE_TYPES) ? window.STORE_TYPES : STORE_TYPES;

  for (const tile of facSet.values()) {
    const d = tile.district;
    landTotal += (d?.landRentDaily || 10) * 350;

    if (tile.store) {
      const st = storeTypes ? storeTypes.find(s => s.id === tile.store.storeTypeId) : null;
      facilitiesTotal += st ? st.cost : 14000;
      if (tile.store.shelves) {
        for (const shelf of Object.values(tile.store.shelves)) {
          inventoryTotal += (shelf.stock || 0) * (shelf.landedCost || 1.0);
        }
      }
    }
    if (tile.mine) {
      facilitiesTotal += tile.mine.cost || 30000;
      inventoryTotal += (tile.mine.stock || 0) * (tile.mine.unitCost || 0.8);
    }
    if (tile.farm) {
      facilitiesTotal += tile.farm.cost || 22000;
      inventoryTotal += (tile.farm.stock || 0) * (tile.farm.dailyOperatingCost || 0.5);
    }
    if (tile.factory) {
      const linesCount = tile.factory.lines ? Object.keys(tile.factory.lines).length : 1;
      facilitiesTotal += 48000 + (linesCount * 15000);
      if (tile.factory.lines) {
        for (const line of Object.values(tile.factory.lines)) {
          inventoryTotal += (line.finishedStock || 0) * (line.unitCost || 2.0);
        }
      }
    }
    if (tile.rdCenter) {
      facilitiesTotal += 40000;
    }
    if (tile.warehouse) {
      facilitiesTotal += tile.warehouse.cost || 35000;
      if (tile.warehouse.inventory) {
        for (const item of Object.values(tile.warehouse.inventory)) {
          inventoryTotal += (item.stock || 0) * (item.avgUnitCost || 1.0);
        }
      }
    }
  }

  const currentCash = GameState.cash ?? ((typeof window !== 'undefined') ? window.cash : 0);
  const totalAssets = currentCash + landTotal + facilitiesTotal + inventoryTotal;
  const totalLiabilities = GameState.banking ? (GameState.banking.totalDebt || 0) : 0;
  const netWorth = totalAssets - totalLiabilities;

  return {
    cash: currentCash,
    landTotal,
    facilitiesTotal,
    inventoryTotal,
    totalAssets,
    totalLiabilities,
    netWorth
  };
}

export function renderFacilityDRETable() {
  const tbody = document.getElementById('facility-dre-table-body');
  if (!tbody) return;

  const rows = [];
  let totalRev = 0, totalCosts = 0, totalNet = 0;
  const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : new Map();

  for (const tile of facSet.values()) {
    if (!tile.store && !tile.factory && !tile.farm && !tile.mine && !tile.rdCenter && !tile.warehouse) {
      continue;
    }

    let typeName = 'Instalação';
    let facName = 'Instalação Corporativa';
    let emoji = '🏢';

    if (tile.store) {
      typeName = 'Varejo';
      facName = tile.store.name;
      emoji = '🏪';
    } else if (tile.factory) {
      typeName = 'Fábrica';
      facName = tile.factory.name;
      emoji = '🏭';
    } else if (tile.farm) {
      typeName = 'Agropecuária';
      facName = tile.farm.name;
      emoji = '🌾';
    } else if (tile.mine) {
      typeName = 'Mineração';
      facName = tile.mine.name;
      emoji = '⛏️';
    } else if (tile.rdCenter) {
      typeName = 'P&D';
      facName = tile.rdCenter.name;
      emoji = '🔬';
    } else if (tile.warehouse) {
      typeName = 'Logística';
      facName = tile.warehouse.name;
      emoji = '📦';
    }

    const metrics = tile.lastMonthMetrics || tile.monthlyMetrics || { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
    const rev = metrics.revenue || 0;
    const cogs = metrics.cogs || 0;
    const opex = metrics.opex || 0;
    const net = rev - cogs - opex;
    const margin = rev > 0 ? Math.round((net / rev) * 100) : (net < 0 ? -100 : 0);

    totalRev += rev;
    totalCosts += (cogs + opex);
    totalNet += net;

    rows.push({
      tile,
      emoji,
      facName,
      typeName,
      loc: `${tile.district?.name || 'Interior'} (${tile.x}, ${tile.y})`,
      rev,
      cogs,
      opex,
      net,
      margin
    });
  }

  rows.sort((a, b) => a.net - b.net);

  tbody.innerHTML = rows.length > 0 ? rows.map(r => `
    <tr class="hover:bg-slate-900/60 transition">
      <td class="p-2.5 font-bold text-slate-200">
        <span class="mr-1">${r.emoji}</span> ${r.facName}
        <span class="text-[9px] text-slate-500 block font-normal">${r.typeName}</span>
      </td>
      <td class="p-2.5 text-slate-400 text-[10px]">${r.loc}</td>
      <td class="p-2.5 text-right font-bold text-emerald-400">$${r.rev.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td class="p-2.5 text-right text-rose-400">-$${r.cogs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td class="p-2.5 text-right text-slate-300">-$${r.opex.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td class="p-2.5 text-right font-black ${r.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
        ${r.net >= 0 ? '+$' : '-$'}${Math.abs(r.net).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td class="p-2.5 text-right font-bold ${r.margin >= 0 ? 'text-slate-300' : 'text-rose-400'}">
        ${r.margin > 0 ? '+' : ''}${r.margin}%
      </td>
      <td class="p-2.5 text-center">
        <button onclick="closeFacilityDREModal(); activeManagedTile=worldGrid[${r.tile.x}][${r.tile.y}]; if (typeof renderFacilityPanel==='function') renderFacilityPanel(activeManagedTile); if (typeof renderTileInspector==='function') renderTileInspector(activeManagedTile); if (typeof scheduleRender==='function') scheduleRender();" class="bg-slate-800 hover:bg-slate-700 text-teal-300 px-2 py-1 rounded text-[9px] font-bold border border-slate-700 cursor-pointer">
          Gerir
        </button>
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="8" class="p-4 text-center text-slate-500 font-mono">Nenhuma instalação ativa registrada na auditoria.</td>
    </tr>
  `;

  const nw = calculateCorporateNetWorth();
  const fRevEl = document.getElementById('fdre-total-rev');
  const fCostEl = document.getElementById('fdre-total-costs');
  const fNetEl = document.getElementById('fdre-total-net');
  const fNwEl = document.getElementById('fdre-net-worth');

  if (fRevEl) fRevEl.textContent = '+$' + totalRev.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (fCostEl) fCostEl.textContent = '-$' + totalCosts.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (fNetEl) {
    fNetEl.textContent = (totalNet >= 0 ? '+$' : '-$') + Math.abs(totalNet).toLocaleString('en-US', { maximumFractionDigits: 0 });
    fNetEl.className = `text-sm font-bold mt-0.5 ${totalNet >= 0 ? 'text-emerald-300' : 'text-rose-400'}`;
  }
  if (fNwEl) {
    fNwEl.textContent = (nw.netWorth >= 0 ? '$' : '-$') + Math.abs(nw.netWorth).toLocaleString('en-US', { maximumFractionDigits: 0 });
    fNwEl.className = `text-sm font-bold mt-0.5 ${nw.netWorth >= 0 ? 'text-indigo-300' : 'text-rose-400'}`;
  }

  // Gráfico de Séries Temporais dos Últimos Meses
  const histContainer = document.getElementById('fdre-history-container');
  const histBars = document.getElementById('fdre-history-bars');
  const histStats = document.getElementById('fdre-history-summary-stats');
  const ledger = (typeof window !== 'undefined' && window.historicalLedger) ? window.historicalLedger : [];

  if (histContainer && histBars) {
    if (ledger.length > 0) {
      histContainer.classList.remove('hidden');

      const revs = ledger.map(h => h.revenue || 0);
      const nets = ledger.map(h => h.netProfit || 0);
      const maxRev = Math.max(...revs, 1);
      const minRev = Math.min(...revs);
      const maxNet = Math.max(...nets.map(Math.abs), 1);
      const avgRev = revs.reduce((a, b) => a + b, 0) / Math.max(1, revs.length);
      const avgNet = nets.reduce((a, b) => a + b, 0) / Math.max(1, nets.length);
      const avgMargin = avgRev > 0 ? Math.round((avgNet / avgRev) * 100) : 0;

      if (histStats) {
        histStats.innerHTML = `
          <span class="flex items-center gap-1 text-sky-300 font-bold"><span class="w-2 h-2 rounded-sm bg-sky-400 inline-block"></span> Receita</span>
          <span class="flex items-center gap-1 text-emerald-300 font-bold"><span class="w-2 h-2 rounded-sm bg-emerald-400 inline-block"></span> Lucro</span>
          <span class="text-slate-600">|</span>
          <span>Pico: <strong class="text-sky-300">$${maxRev.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
          <span>Margem Média: <strong class="${avgMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${avgMargin}%</strong></span>
        `;
      }

      const revRange = Math.max(1, maxRev - minRev);
      const isTightRange = (revRange / maxRev) < 0.15;

      histBars.innerHTML = ledger.map((h, idx) => {
        let revHeight = 0;
        if (isTightRange) {
          const normRatio = (h.revenue - minRev) / Math.max(1, revRange);
          revHeight = Math.round(35 + normRatio * 40);
        } else {
          revHeight = Math.max(12, Math.round((h.revenue / maxRev) * 75));
        }

        const netRatio = Math.min(1, Math.abs(h.netProfit) / maxNet);
        const netHeight = Math.max(6, Math.round(netRatio * 50));
        const isProfit = h.netProfit >= 0;
        const marginPct = h.revenue > 0 ? Math.round((h.netProfit / h.revenue) * 100) : 0;

        let diffStr = '';
        if (idx > 0) {
          const prev = ledger[idx - 1];
          const diffR = h.revenue - prev.revenue;
          const diffN = h.netProfit - prev.netProfit;
          diffStr = `<div class="text-[9px] pt-1 mt-1 border-t border-slate-700 text-slate-400">vs M${prev.month}: Receita ${diffR >= 0 ? '+$' : '-$'}${Math.abs(diffR).toLocaleString()} | Lucro ${diffN >= 0 ? '+$' : '-$'}${Math.abs(diffN).toLocaleString()}</div>`;
        }

        const isNewYear = h.month === 1 && idx > 0;
        const macroInfo = MacroCycleSystem.getHUDLabel(h.year || 1);

        return `
          <div class="flex items-end shrink-0 ${isNewYear ? 'border-l-2 border-amber-500/60 pl-2 ml-1' : ''}">
            <div class="flex flex-col items-center gap-1 shrink-0 group relative cursor-pointer hover:bg-slate-900/90 p-1 rounded-lg transition-all">
              <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-950/98 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-mono shadow-2xl z-30 pointer-events-none whitespace-nowrap -translate-x-1/2 left-1/2 min-w-[190px] backdrop-blur-md">
                <div class="font-bold text-amber-300 pb-0.5 border-b border-slate-800 flex justify-between items-center">
                  <span>📅 Mês ${String(h.month).padStart(2, '0')} / A${h.year}</span>
                  <span class="text-[8px] text-slate-400 font-normal">${macroInfo.shortText || ''}</span>
                </div>
                <div class="flex justify-between gap-3 text-sky-300 mt-1"><span>Receita:</span> <strong>$${h.revenue.toLocaleString()}</strong></div>
                <div class="flex justify-between gap-3 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}"><span>Lucro Líq:</span> <strong>${isProfit ? '+$' : '-$'}${Math.abs(h.netProfit).toLocaleString()} (${marginPct}%)</strong></div>
                ${diffStr}
              </div>

              <div class="flex items-end gap-1 h-20">
                <div class="w-2.5 bg-gradient-to-t from-sky-600/50 to-sky-400 rounded-t shadow-sm" style="height:${revHeight}px"></div>
                <div class="w-2.5 bg-gradient-to-t ${isProfit ? 'from-emerald-600 to-emerald-400' : 'from-rose-600 to-rose-400'} rounded-t shadow-sm" style="height:${netHeight}px"></div>
              </div>
              <span class="text-[8px] text-slate-400 font-mono ${isNewYear ? 'text-amber-300 font-bold' : ''}">M${h.month}</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      histContainer.classList.add('hidden');
    }
  }
}

export const DREPanel = {
  syncDREValues,
  openFacilityDREModal,
  closeFacilityDREModal,
  toggleDREModal,
  calculateCorporateNetWorth,
  renderFacilityDRETable
};

if (typeof window !== 'undefined') {
  window.DREPanel = DREPanel;
  window.syncDREValues = syncDREValues;
  window.openFacilityDREModal = openFacilityDREModal;
  window.closeFacilityDREModal = closeFacilityDREModal;
  window.toggleDREModal = toggleDREModal;
  window.calculateCorporateNetWorth = calculateCorporateNetWorth;
  window.renderFacilityDRETable = renderFacilityDRETable;
}

export default DREPanel;
