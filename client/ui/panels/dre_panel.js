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

let lastDREData = {
  gross: 0,
  cogs: 0,
  rent: 0,
  mkt: 0,
  net: 0,
  financial: 0,
  netWorth: 0
};
let currentDREView = 'dre';

export function syncDREValues(gross, cogs, rent, mkt, net, financial = 0, netWorth = 0) {
  lastDREData = { gross, cogs, rent, mkt, net, financial, netWorth };

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

  // Mantém visões secundárias sincronizadas se ativas
  if (currentDREView === 'cashflow') {
    renderCashFlowView();
  } else if (currentDREView === 'balance') {
    renderBalanceSheetView();
  }
}

export function renderCashFlowView(customData = null) {
  const d = customData || lastDREData;
  const currentCash = (typeof GameState !== 'undefined' && GameState.cash !== undefined)
    ? GameState.cash
    : ((typeof window !== 'undefined' && window.cash !== undefined) ? window.cash : 0);
  const totalDebt = (typeof GameState !== 'undefined' && GameState.banking?.totalDebt !== undefined)
    ? GameState.banking.totalDebt
    : ((typeof window !== 'undefined' && window.totalDebt !== undefined) ? window.totalDebt : 0);

  const inEl = document.getElementById('dfc-operating-inflow');
  const cogsEl = document.getElementById('dfc-operating-cogs');
  const opexEl = document.getElementById('dfc-operating-opex');
  const mktEl = document.getElementById('dfc-operating-mkt');
  const finEl = document.getElementById('dfc-operating-financial');
  const opCashEl = document.getElementById('dfc-net-operating-cash');
  const loansEl = document.getElementById('dfc-financing-loans');
  const endCashEl = document.getElementById('dfc-ending-cash');

  if (inEl) inEl.textContent = '+$' + (d.gross || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (cogsEl) cogsEl.textContent = '-$' + (d.cogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opexEl) opexEl.textContent = '-$' + (d.rent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (mktEl) mktEl.textContent = '-$' + (d.mkt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (finEl) finEl.textContent = '-$' + (d.financial || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const operatingCash = (d.gross || 0) - (d.cogs || 0) - (d.rent || 0) - (d.mkt || 0) - (d.financial || 0);
  if (opCashEl) {
    opCashEl.textContent = (operatingCash >= 0 ? '+$' : '-$') + Math.abs(operatingCash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    opCashEl.className = operatingCash >= 0 ? 'text-emerald-400 text-sm font-bold tracking-tight' : 'text-rose-400 text-sm font-bold tracking-tight';
  }

  if (loansEl) {
    if (totalDebt > 0) {
      loansEl.textContent = '-$' + totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' (Passivo)';
      loansEl.className = 'text-amber-400 font-mono tracking-tight';
    } else {
      loansEl.textContent = '$0.00 (Sem dívidas ativas)';
      loansEl.className = 'text-slate-400 font-mono tracking-tight';
    }
  }

  if (endCashEl) {
    endCashEl.textContent = (currentCash >= 0 ? '+$' : '-$') + Math.abs(currentCash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    endCashEl.className = currentCash >= 0 ? 'text-emerald-300 text-base font-bold tracking-tight' : 'text-rose-400 text-base font-bold tracking-tight';
  }
}

export function renderBalanceSheetView() {
  const nw = calculateCorporateNetWorth();

  const cashEl = document.getElementById('bal-cash');
  const invEl = document.getElementById('bal-inventories');
  const landEl = document.getElementById('bal-land');
  const facEl = document.getElementById('bal-facilities');
  const assetsEl = document.getElementById('bal-total-assets');
  const debtEl = document.getElementById('bal-total-debt');
  const nwEl = document.getElementById('bal-net-worth');

  if (cashEl) {
    cashEl.textContent = (nw.cash >= 0 ? '$' : '-$') + Math.abs(nw.cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    cashEl.className = nw.cash >= 0 ? 'text-emerald-400 font-bold tracking-tight' : 'text-rose-400 font-bold tracking-tight';
  }
  if (invEl) invEl.textContent = '$' + nw.inventoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (landEl) landEl.textContent = '$' + nw.landTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (facEl) facEl.textContent = '$' + nw.facilitiesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (assetsEl) {
    assetsEl.textContent = '$' + nw.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    assetsEl.className = 'text-emerald-400 text-sm font-bold tracking-tight';
  }
  if (debtEl) {
    debtEl.textContent = (nw.totalLiabilities > 0 ? '-$' : '$') + nw.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    debtEl.className = nw.totalLiabilities > 0 ? 'text-rose-400 font-bold tracking-tight' : 'text-slate-400 font-bold tracking-tight';
  }
  if (nwEl) {
    nwEl.textContent = (nw.netWorth >= 0 ? '$' : '-$') + Math.abs(nw.netWorth).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    nwEl.className = nw.netWorth >= 0 ? 'text-emerald-300 text-base font-bold tracking-tight' : 'text-rose-400 text-base font-bold tracking-tight';
  }
}

export function switchDREView(viewName = 'dre') {
  currentDREView = (viewName === 'cashflow' || viewName === 'balance') ? viewName : 'dre';

  const viewDRE = document.getElementById('dre-view-dre');
  const viewCashFlow = document.getElementById('dre-view-cashflow');
  const viewBalance = document.getElementById('dre-view-balance');

  const btnDRE = document.getElementById('dre-tab-btn-dre');
  const btnCashFlow = document.getElementById('dre-tab-btn-cashflow');
  const btnBalance = document.getElementById('dre-tab-btn-balance');

  const headerTitle = document.getElementById('dre-header-title');
  const headerSubtitle = document.getElementById('dre-header-subtitle');
  const headerIcon = document.getElementById('dre-header-icon');

  const activeBtnClass = 'px-2.5 py-1 rounded-t-lg bg-[#c9a86a]/15 text-[#c9a86a] font-bold border-t border-x border-[#c9a86a]/40 cursor-pointer transition';
  const inactiveBtnClass = 'px-2.5 py-1 rounded-t-lg text-slate-400 hover:text-slate-200 border-t border-x border-transparent hover:border-white/[0.08] cursor-pointer transition';

  if (viewDRE) viewDRE.classList.add('hidden');
  if (viewCashFlow) viewCashFlow.classList.add('hidden');
  if (viewBalance) viewBalance.classList.add('hidden');

  if (btnDRE) btnDRE.className = inactiveBtnClass;
  if (btnCashFlow) btnCashFlow.className = inactiveBtnClass;
  if (btnBalance) btnBalance.className = inactiveBtnClass;

  if (currentDREView === 'cashflow') {
    if (viewCashFlow) viewCashFlow.classList.remove('hidden');
    if (btnCashFlow) btnCashFlow.className = activeBtnClass;
    if (headerIcon) headerIcon.textContent = '💧';
    if (headerTitle) {
      headerTitle.innerHTML = 'Demonstrativo de Fluxo de Caixa (DFC) <span class="text-[9px] bg-sky-500/15 text-sky-400 font-mono px-1.5 py-0.5 rounded border border-sky-500/30 font-normal">Liquidez</span>';
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = 'Entradas e saídas de caixa operacionais, investimentos e saldo líquido';
    }
    renderCashFlowView();
  } else if (currentDREView === 'balance') {
    if (viewBalance) viewBalance.classList.remove('hidden');
    if (btnBalance) btnBalance.className = activeBtnClass;
    if (headerIcon) headerIcon.textContent = '⚖️';
    if (headerTitle) {
      headerTitle.innerHTML = 'Balanço Patrimonial Consolidado <span class="text-[9px] bg-amber-500/15 text-amber-400 font-mono px-1.5 py-0.5 rounded border border-amber-500/30 font-normal">Patrimônio</span>';
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = 'Estrutura de Ativos (caixa, estoques, imóveis), Passivos e Patrimônio Líquido';
    }
    renderBalanceSheetView();
  } else {
    if (viewDRE) viewDRE.classList.remove('hidden');
    if (btnDRE) btnDRE.className = activeBtnClass;
    if (headerIcon) headerIcon.textContent = '📊';
    if (headerTitle) {
      headerTitle.innerHTML = 'Demonstrativo de Resultados (DRE Consolidada) <span class="text-[9px] bg-[#c9a86a]/15 text-[#c9a86a] font-mono px-1.5 py-0.5 rounded border border-[#c9a86a]/30 font-normal">Holding</span>';
    }
    if (headerSubtitle) {
      headerSubtitle.textContent = 'Visão consolidada de receitas brutas, custos de insumo, fixos e resultado';
    }
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

export function openDREModal(viewName = 'dre') {
  const m = document.getElementById('dre-modal');
  if (!m) return;
  switchDREView(viewName || 'dre');
  m.classList.remove('hidden');
}

export function toggleDREModal(viewName = null) {
  const m = document.getElementById('dre-modal');
  if (!m) return;
  if (viewName) {
    if (m.classList.contains('hidden')) {
      switchDREView(viewName);
      m.classList.remove('hidden');
    } else {
      if (currentDREView === viewName) {
        m.classList.add('hidden');
      } else {
        switchDREView(viewName);
      }
    }
  } else {
    m.classList.toggle('hidden');
    if (!m.classList.contains('hidden')) {
      switchDREView(currentDREView || 'dre');
    }
  }
}

export function triggerPriceSimulationFromDRE() {
  const sim = (typeof window !== 'undefined' && window.PriceSimulatorPanel) ? window.PriceSimulatorPanel : null;
  if (!sim || typeof sim.openPriceSimulatorModal !== 'function') return;

  const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : null;
  if (!facSet) return;

  // Procura uma loja com produtos nas prateleiras para simular
  for (const [coordKey, tile] of facSet.entries()) {
    if (tile.store && tile.store.shelves) {
      const prodIds = Object.keys(tile.store.shelves);
      if (prodIds.length > 0) {
        const [xStr, yStr] = coordKey.split(',');
        const x = Number(xStr);
        const y = Number(yStr);
        sim.openPriceSimulatorModal(x, y, prodIds[0]);
        return;
      }
    }
  }

  // Fallback: se não tiver loja, avisa o jogador no HUD
  if (typeof window !== 'undefined' && typeof window.addGameLog === 'function') {
    window.addGameLog('💡 Para simular cenários de preço, tenha ao menos uma loja ativa com produtos.', 'text-amber-400');
  }
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
    <tr class="hover:bg-white/[0.03] transition border-b border-white/[0.04]">
      <td class="p-2.5 font-bold text-[#f1f5f9]">
        <span class="mr-1">${r.emoji}</span> ${r.facName}
        <span class="text-[9px] text-[#94a3b8] block font-normal">${r.typeName}</span>
      </td>
      <td class="p-2.5 text-[#94a3b8] text-[10px]">${r.loc}</td>
      <td class="p-2.5 text-right font-bold text-emerald-400 font-mono">$${r.rev.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td class="p-2.5 text-right text-rose-400 font-mono">-$${r.cogs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td class="p-2.5 text-right text-[#94a3b8] font-mono">-$${r.opex.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
      <td class="p-2.5 text-right font-black font-mono ${r.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
        ${r.net >= 0 ? '+$' : '-$'}${Math.abs(r.net).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td class="p-2.5 text-right font-bold font-mono ${r.margin >= 0 ? 'text-[#f1f5f9]' : 'text-rose-400'}">
        ${r.margin > 0 ? '+' : ''}${r.margin}%
      </td>
      <td class="p-2.5 text-center">
        <button onclick="closeFacilityDREModal(); activeManagedTile=worldGrid[${r.tile.x}][${r.tile.y}]; if (typeof renderFacilityPanel==='function') renderFacilityPanel(activeManagedTile); if (typeof renderTileInspector==='function') renderTileInspector(activeManagedTile); if (typeof scheduleRender==='function') scheduleRender();" class="px-2.5 py-1 rounded text-[9px] font-bold border border-[#c9a86a]/30 text-[#c9a86a] bg-[#c9a86a]/10 hover:bg-[#c9a86a]/20 hover:border-[#c9a86a] transition cursor-pointer">
          Gerir
        </button>
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="8" class="p-6 text-center text-[#94a3b8] font-mono text-xs">Nenhuma instalação ativa registrada na auditoria.</td>
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
            <div class="flex flex-col items-center gap-1 shrink-0 group relative cursor-pointer hover:bg-white/[0.04] p-1 rounded-lg transition-all">
              <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#0b0e14] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono shadow-2xl z-30 pointer-events-none whitespace-nowrap -translate-x-1/2 left-1/2 min-w-[190px] backdrop-blur-md">
                <div class="font-bold text-[#c9a86a] pb-0.5 border-b border-white/10 flex justify-between items-center">
                  <span>📅 Mês ${String(h.month).padStart(2, '0')} / A${h.year}</span>
                  <span class="text-[8px] text-[#94a3b8] font-normal">${macroInfo.shortText || ''}</span>
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

export function openInsolvencyModal(nwObj) {
  const modal = document.getElementById('insolvency-modal');
  if (!modal) return;

  const currentCash = (typeof window !== 'undefined' && typeof window.cash === 'number') ? window.cash : (GameState.cash || 0);
  const countdown = (typeof window !== 'undefined' && typeof window.insolvencyCountdownMonths === 'number') ? window.insolvencyCountdownMonths : (GameState.insolvencyCountdownMonths || 0);
  const facilitySet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : new Map();

  const debtEl = document.getElementById('ins-cash-debt');
  const nwEl = document.getElementById('ins-net-worth');
  const countEl = document.getElementById('ins-countdown-months');
  const recContent = document.getElementById('ins-recommended-content');

  if (debtEl) debtEl.textContent = currentCash < 0 ? `-$${Math.abs(currentCash).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `$${currentCash.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (nwEl && nwObj) nwEl.textContent = (nwObj.netWorth >= 0 ? '$' : '-$') + Math.abs(nwObj.netWorth).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (countEl) countEl.textContent = countdown;

  // Localiza a instalação de pior resultado financeiro para recomendar venda
  let worstFacility = null;
  let worstNet = Infinity;

  for (const tile of facilitySet.values()) {
    const metrics = tile.lastMonthMetrics || tile.monthlyMetrics || { netProfit: 0 };
    const net = (metrics.revenue || 0) - (metrics.cogs || 0) - (metrics.opex || 0);
    if (net < worstNet) {
      worstNet = net;
      worstFacility = tile;
    }
  }

  if (worstFacility && recContent) {
    const calcVal = (typeof window !== 'undefined' && typeof window.calculateFacilityValue === 'function') 
      ? window.calculateFacilityValue 
      : ((t) => ({ facilityName: 'Instalação', sellValue: 10000 }));
    const val = calcVal(worstFacility);
    recContent.innerHTML = `
      <div class="space-y-2">
        <p>Identificamos que <strong class="text-amber-300">${val.facilityName}</strong> (${worstFacility.district?.name || ''}) está gerando um impacto negativo de <strong class="text-rose-400">-$${Math.abs(worstNet).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mês</strong>.</p>
        <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-slate-400">Valor de Liquidação Rápida:</div>
            <div class="text-sm font-bold text-emerald-400">+$${val.sellValue.toLocaleString('en-US')}</div>
          </div>
          <button onclick="closeInsolvencyModal(); sellFacility(${worstFacility.x}, ${worstFacility.y});" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer shadow">
            🏷️ Vender Esta Instalação
          </button>
        </div>
      </div>
    `;
  } else if (recContent) {
    recContent.innerHTML = `<p class="text-slate-400">Corte orçamentos de P&D ativos ou reduza custos fixos fechando linhas ociosas para restaurar a lucratividade.</p>`;
  }

  modal.classList.remove('hidden');
}

export function closeInsolvencyModal() {
  const modal = document.getElementById('insolvency-modal');
  if (modal) modal.classList.add('hidden');
}

export function showBankruptcyModal(nwObj) {
  const modal = document.getElementById('bankruptcy-modal');
  if (!modal) return;

  const currentCash = (typeof window !== 'undefined' && typeof window.cash === 'number') ? window.cash : (GameState.cash || 0);
  const profile = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile : (GameState.playerProfile || {});
  const yr = (typeof window !== 'undefined' && typeof window.year === 'number') ? window.year : (GameState.year || 1);
  const mo = (typeof window !== 'undefined' && typeof window.month === 'number') ? window.month : (GameState.month || 1);
  const playSec = (typeof window !== 'undefined' && typeof window.playtimeSeconds === 'number') ? window.playtimeSeconds : (GameState.playtimeSeconds || 0);

  const bkCompany = document.getElementById('bk-company-name');
  if (bkCompany) bkCompany.textContent = profile.companyName || 'Sua Corporação';
  const bkPlaytime = document.getElementById('bk-playtime');
  if (bkPlaytime) bkPlaytime.textContent = `Ano ${yr} · Mês ${mo} (${playSec > 60 ? `${Math.floor(playSec / 60)} min` : `${playSec}s`})`;
  const bkDebt = document.getElementById('bk-final-debt');
  if (bkDebt) bkDebt.textContent = `-$${Math.abs(currentCash < 0 ? currentCash : (nwObj ? nwObj.totalDebt || 0 : 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const bkNW = document.getElementById('bk-final-nw');
  if (bkNW) bkNW.textContent = `-$${Math.abs(nwObj ? nwObj.netWorth || 0 : 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  modal.classList.remove('hidden');
  if (typeof window !== 'undefined') window.gameSpeed = 0;
}

export const DREPanel = {
  syncDREValues,
  renderCashFlowView,
  renderBalanceSheetView,
  switchDREView,
  openDREModal,
  openFacilityDREModal,
  closeFacilityDREModal,
  toggleDREModal,
  triggerPriceSimulationFromDRE,
  calculateCorporateNetWorth,
  renderFacilityDRETable,
  openInsolvencyModal,
  closeInsolvencyModal,
  showBankruptcyModal
};

if (typeof window !== 'undefined') {
  window.DREPanel = DREPanel;
  window.syncDREValues = syncDREValues;
  window.renderCashFlowView = renderCashFlowView;
  window.renderBalanceSheetView = renderBalanceSheetView;
  window.switchDREView = switchDREView;
  window.openDREModal = openDREModal;
  window.openFacilityDREModal = openFacilityDREModal;
  window.closeFacilityDREModal = closeFacilityDREModal;
  window.toggleDREModal = toggleDREModal;
  window.triggerPriceSimulationFromDRE = triggerPriceSimulationFromDRE;
  window.calculateCorporateNetWorth = calculateCorporateNetWorth;
  window.renderFacilityDRETable = renderFacilityDRETable;
  window.openInsolvencyModal = openInsolvencyModal;
  window.closeInsolvencyModal = closeInsolvencyModal;
  window.showBankruptcyModal = showBankruptcyModal;
}

export default DREPanel;
