/**
 * advisor_panel.js — Painel da Diretoria Executiva & Conselheiro Inteligente
 * OIKONOMIA v0.8.5 (Fase 6.4 — Controladores dos Painéis Modais)
 * 
 * Responsável por:
 * - Interface executiva da Diretoria (#executive-board-modal)
 * - Personas especializadas: CFO (Finanças), COO (Operações) e CMO (Mercado)
 * - Semáforos diagnósticos dos 6 pilares corporativos
 * - Feed reativo de alertas, causas-raiz e deep links para o mapa
 * - Histórico de alertas resolvidos e controle de verbosidade
 */

import GameState from '../../game_state.js';
import AdvisorSystem from '../../advisor_system.js';

let currentAdvisorTab = 'all'; // 'all', 'CFO', 'COO', 'CMO', 'history'

export function getAdvisorCurrentTab() {
  return currentAdvisorTab;
}

export function toggleExecutiveBoardModal() {
  const m = document.getElementById('executive-board-modal');
  if (!m) return;
  const isHidden = m.classList.contains('hidden');
  if (isHidden) {
    m.classList.remove('hidden');
    renderExecutiveBoardModal();
  } else {
    m.classList.add('hidden');
  }
}

export function openExecutiveBoardModal() {
  const m = document.getElementById('executive-board-modal');
  if (!m) return;
  m.classList.remove('hidden');
  renderExecutiveBoardModal();
}

export function closeExecutiveBoardModal() {
  const m = document.getElementById('executive-board-modal');
  if (!m) return;
  m.classList.add('hidden');
}

export function refreshExecutiveBoard() {
  const advSys = (typeof window !== 'undefined' && window.AdvisorSystem) ? window.AdvisorSystem : AdvisorSystem;
  const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : new Map();
  const rd = (typeof window !== 'undefined' && window.rdLabs) ? window.rdLabs : {};
  const currentMonth = GameState.month ?? ((typeof window !== 'undefined') ? window.month : 1);
  const currentYear = GameState.year ?? ((typeof window !== 'undefined') ? window.year : 1);

  if (advSys) {
    const pulse = advSys.evaluateCorporatePulse({
      state: GameState,
      activeFacilitySet: facSet,
      rdLabs: rd
    });
    const rawAlerts = advSys.diagnoseCorporateIssues({
      state: GameState,
      activeFacilitySet: facSet,
      rdLabs: rd
    });
    GameState.advisorState = advSys.updateAdvisorAlertStates(
      GameState.advisorState,
      rawAlerts,
      currentMonth,
      currentYear
    );
    GameState.advisorState.lastPulse = pulse;
  }

  renderExecutiveBoardModal();
  if (typeof window !== 'undefined' && typeof window.updateAdvisorHUDChip === 'function') {
    window.updateAdvisorHUDChip();
  }
}

export function setAdvisorVerbosity(mode) {
  if (!GameState.advisorState) GameState.advisorState = { verbosity: 'novato', activeAlerts: {}, alertHistory: [] };
  GameState.advisorState.verbosity = mode;

  const modes = ['novato', 'expert', 'silencioso'];
  for (const m of modes) {
    const btn = document.getElementById(`btn-adv-mode-${m}`);
    if (btn) {
      if (m === mode) {
        btn.className = 'px-2 py-0.5 rounded font-bold transition bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30';
      } else {
        btn.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-slate-200 border border-transparent transition';
      }
    }
  }

  renderExecutiveBoardModal();
}

export function setAdvisorActiveTab(tab) {
  currentAdvisorTab = tab;
  const chips = document.querySelectorAll('#advisor-tab-chips .adv-tab-btn');
  chips.forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.className = 'adv-tab-btn px-2.5 py-1 rounded-lg font-bold transition bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30';
    } else {
      btn.className = 'adv-tab-btn px-2.5 py-1 rounded-lg font-bold transition bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-slate-200';
    }
  });
  renderExecutiveBoardModal();
}

export function dismissAdvisorAlert(alertId) {
  if (GameState.advisorState?.activeAlerts?.[alertId]) {
    GameState.advisorState.activeAlerts[alertId].state = 'acknowledged';
    renderExecutiveBoardModal();
    if (typeof window !== 'undefined' && typeof window.updateAdvisorHUDChip === 'function') {
      window.updateAdvisorHUDChip();
    }
  }
}

export function snoozeAdvisorAlert(alertId, months = 3) {
  if (GameState.advisorState?.activeAlerts?.[alertId]) {
    const alert = GameState.advisorState.activeAlerts[alertId];
    alert.state = 'snoozed';
    const currentMonth = GameState.month ?? ((typeof window !== 'undefined') ? window.month : 1);
    const currentYear = GameState.year ?? ((typeof window !== 'undefined') ? window.year : 1);

    let targetMonth = currentMonth + months;
    let targetYear = currentYear;
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear++;
    }
    alert.snoozeUntilMonth = targetMonth;
    alert.snoozeUntilYear = targetYear;
    renderExecutiveBoardModal();
    if (typeof window !== 'undefined' && typeof window.updateAdvisorHUDChip === 'function') {
      window.updateAdvisorHUDChip();
    }
  }
}

export function executeAdvisorDeepLink(actionDataStr) {
  try {
    const action = JSON.parse(decodeURIComponent(actionDataStr));
    const modal = document.getElementById('executive-board-modal');
    if (modal) modal.classList.add('hidden');

    if (action.type === 'tile' && typeof action.x === 'number' && typeof action.y === 'number') {
      if (typeof window !== 'undefined' && typeof window.focusOnTile === 'function') {
        window.focusOnTile(action.x, action.y);
      }
      const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : null;
      const grid = (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : null;
      const tile = (facSet && facSet.get(`${action.x},${action.y}`)) || (grid && grid[action.x]?.[action.y]);

      if (tile) {
        if (typeof window !== 'undefined') window.activeManagedTile = tile;
        if (tile.warehouse && typeof window.openWarehouseModal === 'function') {
          window.openWarehouseModal(tile);
        } else if (typeof window.openFloatingFacilityWindow === 'function') {
          window.openFloatingFacilityWindow(tile);
        }
        if (typeof window.renderTileInspector === 'function') {
          window.renderTileInspector(tile);
        }
        if (typeof window.scheduleRender === 'function') window.scheduleRender();
      }
    } else if (action.type === 'modal') {
      if (action.modalId === 'banking-modal' && typeof window.openBankModal === 'function') {
        window.openBankModal();
      } else if (action.modalId === 'dre-modal' && typeof window.toggleDREModal === 'function') {
        window.toggleDREModal();
      } else if (action.modalId === 'seaport-modal') {
        const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : new Map();
        const firstPort = Array.from(facSet.values()).find(t => t.district?.type?.includes('Port') || t.district?.id === 'harbor');
        if (firstPort) {
          if (typeof window.focusOnTile === 'function') window.focusOnTile(firstPort.x, firstPort.y);
          if (typeof window.openFloatingFacilityWindow === 'function') window.openFloatingFacilityWindow(firstPort);
        }
      }
    } else if (action.type === 'action') {
      if (action.actionId === 'open_rd_or_store' && typeof window.openRDCenterModal === 'function') {
        window.openRDCenterModal();
      } else if (action.actionId === 'open_rd_wizard_for_prod' && typeof window.openRDNewProjectModal === 'function') {
        window.openRDNewProjectModal();
        if (action.productId && typeof window.selectRDWizardProduct === 'function') {
          window.selectRDWizardProduct(action.productId);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao executar deep link do conselheiro:', err);
  }
}

export function renderExecutiveBoardModal() {
  const advSys = (typeof window !== 'undefined' && window.AdvisorSystem) ? window.AdvisorSystem : AdvisorSystem;
  if (!advSys) return;

  if (!GameState.advisorState?.lastPulse) {
    refreshExecutiveBoard();
    return;
  }

  const pulse = GameState.advisorState.lastPulse;
  const advState = GameState.advisorState;

  // 1. Badge de Saúde Geral
  const scoreBadge = document.getElementById('advisor-health-score-badge');
  if (scoreBadge) {
    const cs = pulse.compositeScore || 80;
    let scoreColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    let scoreLabel = 'Saudável';
    if (cs < 50) {
      scoreColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      scoreLabel = 'Crítico';
    } else if (cs < 75) {
      scoreColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      scoreLabel = 'Atenção';
    }
    scoreBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${scoreColor}`;
    scoreBadge.textContent = `Índice: ${cs}/100 (${scoreLabel})`;
  }

  // 2. Grid dos 6 Semáforos
  const pulseGrid = document.getElementById('advisor-pulse-grid');
  if (pulseGrid) {
    const getStatusBadge = (st) => {
      if (st === 'critical') return '<span class="text-rose-400 font-bold">🔴 Crítico</span>';
      if (st === 'warning') return '<span class="text-amber-400 font-bold">🟡 Atenção</span>';
      return '<span class="text-emerald-400 font-bold">🟢 Saudável</span>';
    };

    pulseGrid.innerHTML = `
      <div class="bg-[#090d12] p-2.5 rounded-lg border border-white/[0.06] flex flex-col justify-between">
        <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>💰 Finanças</span>
          ${getStatusBadge(pulse.finance.status)}
        </div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          Margem: <span class="${pulse.finance.netMarginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${pulse.finance.netMarginPct}%</span>
        </div>
        <div class="text-[9px] text-slate-500 font-mono">Lucro: $${pulse.finance.netProfit.toLocaleString('en-US')}</div>
      </div>

      <div class="bg-[#090d12] p-2.5 rounded-lg border border-white/[0.06] flex flex-col justify-between">
        <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>🏭 Produção</span>
          ${getStatusBadge(pulse.factory.status)}
        </div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          Ativas: <span class="text-[#c9a86a]">${pulse.factory.activeRatio}%</span>
        </div>
        <div class="text-[9px] text-slate-500 font-mono">${pulse.factory.idleLines} linhas ociosas</div>
      </div>

      <div class="bg-[#090d12] p-2.5 rounded-lg border border-white/[0.06] flex flex-col justify-between">
        <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>🚚 Logística</span>
          ${getStatusBadge(pulse.logistics.status)}
        </div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          ${pulse.logistics.totalWarehouses} Armazéns
        </div>
        <div class="text-[9px] text-slate-500 font-mono">${pulse.logistics.lonely} s/ clientes</div>
      </div>

      <div class="bg-[#090d12] p-2.5 rounded-lg border border-white/[0.06] flex flex-col justify-between">
        <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>📦 Varejo</span>
          ${getStatusBadge(pulse.retail.status)}
        </div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          Ruptura: <span class="${pulse.retail.stockoutRatePct > 10 ? 'text-rose-400' : 'text-slate-300'}">${pulse.retail.stockoutRatePct}%</span>
        </div>
        <div class="text-[9px] text-slate-500 font-mono">${pulse.retail.emptyShelves} gôndolas vazias</div>
      </div>

      <div class="bg-[#090d12] p-2.5 rounded-lg border border-white/[0.06] flex flex-col justify-between">
        <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>📈 Mercado</span>
          ${getStatusBadge(pulse.market.status)}
        </div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          ${pulse.market.storesWithSales}/${pulse.market.storeCount} Lojas Ativas
        </div>
        <div class="text-[9px] text-slate-500 font-mono">Presença comercial</div>
      </div>

      <div class="bg-[#090d12] p-2.5 rounded-lg border border-white/[0.06] flex flex-col justify-between">
        <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>🔬 Inovação</span>
          ${getStatusBadge(pulse.tech.status)}
        </div>
        <div class="text-xs font-bold text-slate-200 mt-1 font-mono">
          ${pulse.tech.activeLabs} Bancadas
        </div>
        <div class="text-[9px] text-slate-500 font-mono">Patentes ativas</div>
      </div>
    `;
  }

  // 3. Feed de Alertas / Histórico
  const feedContainer = document.getElementById('advisor-feed-container');
  if (!feedContainer) return;

  if (currentAdvisorTab === 'history') {
    const history = advState.alertHistory || [];
    if (history.length === 0) {
      feedContainer.innerHTML = `
        <div class="text-center py-8 text-slate-500 font-mono text-xs">
          📜 Nenhum alerta arquivado ou resolvido no histórico recente.
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = history.map(item => `
      <div class="bg-[#060809] p-3 rounded-xl border border-emerald-500/20 font-mono text-xs space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-emerald-400 font-bold">${item.title}</span>
          <span class="text-[9px] text-slate-500 font-mono">Mês ${item.resolvedMonth}/${item.resolvedYear}</span>
        </div>
        <p class="text-[11px] text-slate-300">${item.message}</p>
      </div>
    `).join('');
    return;
  }

  let alerts = Object.values(advState.activeAlerts || {});
  if (currentAdvisorTab !== 'all') {
    alerts = alerts.filter(a => a.category === currentAdvisorTab);
  }

  alerts = advSys.filterAdvisorByVerbosity(alerts, advState.verbosity || 'novato');

  if (alerts.length === 0) {
    feedContainer.innerHTML = `
      <div class="bg-[#060809] p-8 rounded-xl border border-dashed border-emerald-500/30 text-center font-mono space-y-2">
        <span class="text-2xl">✨</span>
        <p class="text-emerald-300 font-bold text-xs">Operação Estável e Saudável!</p>
        <p class="text-[10px] text-slate-400">A Diretoria Executiva não encontrou gargalos críticos nem rupturas no setor selecionado.</p>
      </div>
    `;
    return;
  }

  feedContainer.innerHTML = alerts.map(alert => {
    let borderClass = 'border-white/[0.08]';
    let badgeClass = 'bg-white/[0.05] text-slate-300 border-white/[0.08]';
    let iconPersona = '💼 CFO';
    if (alert.category === 'COO') iconPersona = '🚚 COO';
    if (alert.category === 'CMO') iconPersona = '📈 CMO';

    if (alert.severity === 'critical') {
      borderClass = 'border-rose-500/50 bg-rose-500/10 shadow-md shadow-rose-950/20';
      badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold animate-pulse';
    } else if (alert.severity === 'warning') {
      borderClass = 'border-amber-500/40 bg-amber-500/5';
      badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
    } else if (alert.severity === 'opportunity') {
      borderClass = 'border-[#c9a86a]/40 bg-[#c9a86a]/5';
      badgeClass = 'bg-[#c9a86a]/20 text-[#c9a86a] border-[#c9a86a]/40 font-bold';
    }

    const actionJson = alert.deepLink ? encodeURIComponent(JSON.stringify(alert.deepLink)) : null;

    return `
      <div class="bg-[#060809] p-3.5 rounded-xl border ${borderClass} space-y-2 font-mono text-xs">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[9px] border font-bold ${badgeClass}">
              ${alert.severity.toUpperCase()}
            </span>
            <span class="text-slate-400 text-[10px] font-bold">${iconPersona}</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button onclick="dismissAdvisorAlert('${alert.id}')" class="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-[9px] border border-white/[0.08] cursor-pointer transition" title="Dispensar alerta">
              ✕ Dispensar
            </button>
            <button onclick="snoozeAdvisorAlert('${alert.id}', 3)" class="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-[9px] border border-white/[0.08] cursor-pointer transition" title="Silenciar por 3 meses">
              ⏰ 3m
            </button>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-[#e6edf3] text-xs">${alert.title}</h4>
          <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">${alert.message}</p>
        </div>

        <div class="bg-[#0d1017] p-2 rounded-lg border border-white/[0.06] text-[10px] text-slate-400 flex items-start gap-1.5">
          <span class="text-[#c9a86a] shrink-0">🔍</span>
          <div>
            <strong class="text-slate-300">Causa-Raiz:</strong> ${alert.rootCause}
          </div>
        </div>

        ${actionJson ? `
          <div class="pt-1 flex justify-end">
            <button onclick="executeAdvisorDeepLink('${actionJson}')" class="px-3 py-1.5 rounded-lg bg-[#c9a86a] hover:bg-[#dfba76] text-slate-950 font-bold text-[10px] shadow cursor-pointer transition flex items-center gap-1.5 font-mono">
              ${alert.deepLink.label || 'Ver no Mapa'} ➔
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

export const AdvisorPanel = {
  toggleExecutiveBoardModal,
  openExecutiveBoardModal,
  closeExecutiveBoardModal,
  refreshExecutiveBoard,
  setAdvisorVerbosity,
  setAdvisorActiveTab,
  dismissAdvisorAlert,
  snoozeAdvisorAlert,
  executeAdvisorDeepLink,
  renderExecutiveBoardModal
};

if (typeof window !== 'undefined') {
  window.AdvisorPanel = AdvisorPanel;
  window.toggleExecutiveBoardModal = toggleExecutiveBoardModal;
  window.refreshExecutiveBoard = refreshExecutiveBoard;
  window.setAdvisorVerbosity = setAdvisorVerbosity;
  window.setAdvisorActiveTab = setAdvisorActiveTab;
  window.dismissAdvisorAlert = dismissAdvisorAlert;
  window.snoozeAdvisorAlert = snoozeAdvisorAlert;
  window.executeAdvisorDeepLink = executeAdvisorDeepLink;
  window.renderExecutiveBoardModal = renderExecutiveBoardModal;
}

export default AdvisorPanel;
