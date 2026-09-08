/**
 * hud.js — Orquestrador do HUD Executivo & TopBar Reativa
 * OIKONOMIA v0.8.5 (Fase 6.2 — TopBar & HUD)
 * 
 * Responsável por:
 * - Atualização contínua do relógio, data e trimestres macroeconômicos
 * - Formatação tabular de caixa corporativo ($) e lucro líquido mensal
 * - Indicador dinâmico de saúde da cadeia integrada (Varejo vs Upstream)
 * - Badges de P&D ativo, contratos de publicidade e semáforo do Conselheiro
 * - Controle de velocidade de simulação (0x Pausa a 5x Ultra-Rápido)
 */

import GameState from '../game_state.js';

let _lastActiveSpeed = 2;

function getActiveState() {
  if (typeof window !== 'undefined' && window.GameState) {
    return window.GameState;
  }
  return GameState;
}

export function getLastActiveSpeed() {
  return _lastActiveSpeed;
}

export function setSpeed(s) {
  if (s > 0) _lastActiveSpeed = s;
  const activeState = getActiveState();
  activeState.gameSpeed = s;
  GameState.gameSpeed = s;
  if (typeof window !== 'undefined') window.gameSpeed = s;

  if (GameState.timerInterval) {
    clearInterval(GameState.timerInterval);
    GameState.timerInterval = null;
  }
  if (activeState.timerInterval && activeState !== GameState) {
    clearInterval(activeState.timerInterval);
    activeState.timerInterval = null;
  }
  if (typeof window !== 'undefined' && window.timerInterval) {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
  }

  const map = { 0: 'btn-p', 1: 'btn-1x', 2: 'btn-2x', 3: 'btn-3x', 4: 'btn-4x', 5: 'btn-5x' };
  for (const [spd, id] of Object.entries(map)) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.className = parseInt(spd) === s
      ? 'oiko-btn-terminal active px-1.5 py-0.5 text-[9px]'
      : 'oiko-btn-terminal px-1.5 py-0.5 text-[9px]';
  }

  if (s === 0) return;

  const speedIntervals = { 1: 650, 2: 300, 3: 170, 4: 100, 5: 55 };
  const intervalMs = speedIntervals[s] || 250;
  
  const stepFn = () => {
    if (typeof window !== 'undefined' && typeof window.simulateDay === 'function') {
      window.simulateDay();
    }
  };

  const intervalId = setInterval(stepFn, intervalMs);
  GameState.timerInterval = intervalId;
  activeState.timerInterval = intervalId;
  if (typeof window !== 'undefined') window.timerInterval = intervalId;
}

export function updateClock(day = null, month = null, year = null) {
  const activeState = getActiveState();
  const d = (day !== null && day !== undefined) ? day : ((typeof window !== 'undefined' && window.day !== undefined) ? window.day : (activeState.day || 1));
  const m = (month !== null && month !== undefined) ? month : ((typeof window !== 'undefined' && window.month !== undefined) ? window.month : (activeState.month || 1));
  const y = (year !== null && year !== undefined) ? year : ((typeof window !== 'undefined' && window.year !== undefined) ? window.year : (activeState.year || 1));

  const clockEl = document.getElementById('clock-date');
  if (clockEl) {
    clockEl.textContent = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} · Ano ${y}`;
    clockEl.title = `Data da Simulação: Dia ${d} / Mês ${m} / Ano ${y}`;
  }
}

export function updateQuarterBadge(month = null, year = null) {
  const activeState = getActiveState();
  const m = (month !== null && month !== undefined) ? month : ((typeof window !== 'undefined' && window.month !== undefined) ? window.month : (activeState.month || 1));
  const y = (year !== null && year !== undefined) ? year : ((typeof window !== 'undefined' && window.year !== undefined) ? window.year : (activeState.year || 1));

  const qBadge = document.getElementById('hud-quarter-badge');
  const macroBadge = document.getElementById('hud-macro-cycle-badge');
  const mathMod = (typeof window !== 'undefined' && window.CoreMath) ? window.CoreMath : null;

  if (qBadge && mathMod && typeof mathMod.getQuarterInfo === 'function') {
    const qInfo = mathMod.getQuarterInfo(m);
    const macroMod = (typeof window !== 'undefined' && window.MacroCycleSystem) ? window.MacroCycleSystem : null;
    const macroInfo = macroMod && typeof macroMod.getHUDLabel === 'function' ? macroMod.getHUDLabel(y) : null;
    const phaseName = (macroInfo && macroInfo.phase) 
      ? macroInfo.phase.name 
      : (macroInfo ? macroInfo.shortText : (qInfo ? qInfo.season : 'Padrão'));

    if (qInfo) {
      qBadge.textContent = qInfo.code;
      qBadge.title = `Trimestre Macroeconômico: ${qInfo.code} — ${qInfo.name} (Meses ${qInfo.months.join(', ')})`;
      if (macroBadge) {
        macroBadge.textContent = phaseName;
        macroBadge.title = `Ciclo Decenal: ${macroInfo ? macroInfo.text + ' — ' + macroInfo.desc : phaseName}`;
      }
    }
  }
}

export function updateCash(cash = null) {
  const activeState = getActiveState();
  const val = (cash !== null && cash !== undefined)
    ? cash
    : ((typeof window !== 'undefined' && window.cash !== undefined && window.cash !== null) ? window.cash : (activeState.cash ?? 0));

  const cashEl = document.getElementById('corp-cash');
  if (!cashEl) return;

  const fullCashStr = `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  cashEl.title = `Caixa Total da Empresa: ${fullCashStr}`;

  if (Math.abs(val) >= 1_000_000_000) {
    cashEl.textContent = `$${(val / 1_000_000_000).toFixed(2)}B`;
  } else if (Math.abs(val) >= 10_000_000) {
    cashEl.textContent = `$${(val / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(val) >= 1_000_000) {
    cashEl.textContent = `$${(val / 1_000_000).toFixed(2)}M`;
  } else {
    cashEl.textContent = `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

export function updateProfit(net = null, rev = null, cogs = null, fixed = null, mkt = null, fin = null) {
  const activeState = getActiveState();
  const r = (rev !== null && rev !== undefined) ? rev : ((typeof window !== 'undefined' && window.monthRevenue !== undefined) ? window.monthRevenue : (activeState.monthRevenue ?? 0));
  const c = (cogs !== null && cogs !== undefined) ? cogs : ((typeof window !== 'undefined' && window.monthCogs !== undefined) ? window.monthCogs : (activeState.monthCogs ?? 0));
  const f = (fixed !== null && fixed !== undefined) ? fixed : ((typeof window !== 'undefined' && window.monthFixedExpenses !== undefined) ? window.monthFixedExpenses : (activeState.monthFixedExpenses ?? 0));
  const mk = (mkt !== null && mkt !== undefined) ? mkt : ((typeof window !== 'undefined' && window.monthMarketingExpenses !== undefined) ? window.monthMarketingExpenses : (activeState.monthMarketingExpenses ?? 0));
  const fi = (fin !== null && fin !== undefined) ? fin : ((typeof window !== 'undefined' && window.monthFinancialExpenses !== undefined) ? window.monthFinancialExpenses : (activeState.monthFinancialExpenses ?? 0));

  const calculatedNet = net !== null ? net : (r - c - f - mk - fi);
  const pe = document.getElementById('month-profit');
  if (!pe) return;

  const fullNetStr = `${calculatedNet >= 0 ? '+' : '-'}$${Math.abs(calculatedNet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  pe.title = `Resultado do Mês Vigente: ${fullNetStr}`;
  const sign = calculatedNet >= 0 ? '+' : '-';
  const absNet = Math.abs(calculatedNet);

  if (absNet >= 1_000_000) {
    pe.textContent = `${sign}$${(absNet / 1_000_000).toFixed(2)}M`;
  } else if (absNet >= 10_000) {
    pe.textContent = `${sign}$${(absNet / 1_000).toFixed(1)}k`;
  } else {
    pe.textContent = `${sign}$${absNet.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  pe.className = `text-sm font-semibold oiko-tabular-nums leading-tight block select-all cursor-help ${calculatedNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
}

export function updateAdvisorHUDChip() {
  const badge = document.getElementById('hud-advisor-badge');
  const btn = document.getElementById('btn-hud-advisor');
  if (!badge || !btn) return;

  const advState = GameState.advisorState || (typeof window !== 'undefined' && window.GameState && window.GameState.advisorState) || null;
  if (!advState?.activeAlerts) {
    badge.textContent = '0';
    badge.className = 'bg-white/10 text-slate-400 text-[8px] px-1 rounded-full leading-none font-mono';
    btn.className = 'oiko-btn-terminal relative';
    return;
  }

  const activeAlerts = Object.values(advState.activeAlerts).filter(a => a.state === 'new');
  const criticals = activeAlerts.filter(a => a.severity === 'critical');
  const count = activeAlerts.length;

  badge.textContent = count;
  if (criticals.length > 0) {
    badge.className = 'bg-rose-600 text-white text-[8px] px-1 rounded-full leading-none font-mono font-bold animate-pulse';
    btn.className = 'oiko-btn-terminal relative border-rose-500/60 text-rose-300';
  } else if (count > 0) {
    badge.className = 'bg-amber-600 text-white text-[8px] px-1 rounded-full leading-none font-mono font-bold';
    btn.className = 'oiko-btn-terminal relative border-amber-500/50 text-amber-300';
  } else {
    badge.className = 'bg-white/10 text-slate-400 text-[8px] px-1 rounded-full leading-none font-mono';
    btn.className = 'oiko-btn-terminal relative';
  }
}

export function updateChainHealth(activeFacilitySet = null) {
  const chainBadge = document.getElementById('hud-chain-health-badge');
  const chainValEl = document.getElementById('hud-chain-val');
  const chainIconEl = document.getElementById('hud-chain-icon');
  if (!chainBadge || !chainValEl) return;

  const facilities = activeFacilitySet || (typeof window !== 'undefined' && window.activeFacilitySet) || null;
  if (!facilities) return;

  let upstreamOpex = 0;
  let retailMargin = 0;
  let hasUpstream = false;
  let hasRetail = false;

  const facList = facilities instanceof Map ? facilities.values() : (Array.isArray(facilities) ? facilities : []);
  for (const tile of facList) {
    const lm = tile.monthlyMetrics || tile.lastMonthMetrics || { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
    if (tile.store) {
      hasRetail = true;
      retailMargin += ((lm.revenue || 0) - (lm.cogs || 0));
    }
    if (tile.farm || tile.mine || tile.factory || tile.rdCenter) {
      hasUpstream = true;
      upstreamOpex += (lm.opex || 0);
    }
  }

  if (hasUpstream && hasRetail) {
    chainBadge.classList.remove('hidden');
    chainBadge.classList.add('flex');
    const chainContribution = retailMargin - upstreamOpex;
    const sign = chainContribution >= 0 ? '+' : '-';
    const absVal = Math.abs(chainContribution);
    const valStr = absVal >= 1_000_000 
      ? `$${(absVal / 1_000_000).toFixed(2)}M` 
      : (absVal >= 1_000 ? `$${(absVal / 1_000).toFixed(1)}k` : `$${Math.round(absVal)}`);
    chainValEl.textContent = `${sign}${valStr}/mês`;

    if (chainContribution >= 0) {
      chainValEl.className = 'font-bold text-emerald-400 block';
      if (chainIconEl) chainIconEl.textContent = '🟢';
      chainBadge.title = `Cadeia Integrada Saudável!\nMargem Bruta do Varejo: +$${Math.round(retailMargin).toLocaleString()}\nCustos Upstream: -$${Math.round(upstreamOpex).toLocaleString()}\nSaldo da Cadeia: +$${Math.round(chainContribution).toLocaleString()}/mês (Clique para abrir DRE)`;
    } else {
      chainValEl.className = 'font-bold text-rose-400 block';
      if (chainIconEl) chainIconEl.textContent = '🔴';
      chainBadge.title = `Cadeia Integrada Sob Pressão!\nMargem Bruta do Varejo: +$${Math.round(retailMargin).toLocaleString()}\nCustos Upstream: -$${Math.round(upstreamOpex).toLocaleString()}\nDéficit da Cadeia: -$${Math.round(absVal).toLocaleString()}/mês (adicione lojas ou ajuste preços)`;
    }
  } else {
    chainBadge.classList.add('hidden');
    chainBadge.classList.remove('flex');
  }
}

export function updateCampaignsBadge() {
  const badge = document.getElementById('active-campaigns-badge');
  if (!badge) return;

  const contracts = (typeof window !== 'undefined' && window.activeMarketingContracts) || null;
  const count = contracts ? contracts.size : 0;
  badge.textContent = count > 0 ? String(count) : '0';
  const totalBudget = (typeof window !== 'undefined' && typeof window.getTotalMonthlyMarketingBudget === 'function')
    ? window.getTotalMonthlyMarketingBudget()
    : 0;
  badge.title = count > 0
    ? `${count} contratos de mídia ativos${totalBudget > 0 ? ` ($${(totalBudget / 1000).toFixed(1)}k/mês)` : ''}`
    : 'Nenhuma campanha ativa';
}

export function updateRDBadge() {
  const rdBadge = document.getElementById('active-rd-badge');
  const chip = document.getElementById('telemetry-rd-chip');
  const rdLabs = (typeof window !== 'undefined' && window.rdLabs) || null;

  if (rdLabs) {
    const activeCount = Object.values(rdLabs).filter(p => p && p.status === 'active').length;
    if (rdBadge) {
      rdBadge.textContent = String(activeCount);
      rdBadge.title = activeCount > 0 ? `${activeCount} projetos de P&D ativos` : 'Nenhum projeto de P&D ativo';
    }
    if (chip) {
      if (activeCount > 0) {
        chip.textContent = `🔬 ${activeCount} pesquisa${activeCount > 1 ? 's' : ''}`;
        chip.classList.remove('hidden');
      } else {
        chip.classList.add('hidden');
      }
    }
  }
}

export function updateTelemetryFooter() {
  const facEl = document.getElementById('telemetry-facilities-count');
  const popEl = document.getElementById('telemetry-pop-count');
  const saveStatEl = document.getElementById('telemetry-save-status');

  const facSet = (typeof window !== 'undefined' && window.activeFacilitySet) || null;
  if (facEl && facSet) {
    facEl.textContent = `🏢 ${facSet.size} Prédios`;
  }
  if (popEl) {
    popEl.textContent = `👥 45,000 Hab`;
  }
  if (saveStatEl) {
    const slotId = GameState.currentSaveSlotId;
    saveStatEl.textContent = slotId ? `💾 Salvo (${slotId.replace('slot_', '')})` : '💾 Pronto';
  }
}

export function updateHUD() {
  updateClock();
  updateQuarterBadge();
  updateCash();
  updateProfit();
  updateCampaignsBadge();
  updateRDBadge();
  updateChainHealth();
  updateTelemetryFooter();
  updateAdvisorHUDChip();

  // Sincroniza DRE se o painel estiver aberto ou função existir
  if (typeof window !== 'undefined') {
    if (typeof window.syncDREValues === 'function') {
      const rev = (GameState.monthRevenue ?? (typeof window.monthRevenue === 'number' ? window.monthRevenue : 0) ?? 0);
      const cogs = (GameState.monthCogs ?? (typeof window.monthCogs === 'number' ? window.monthCogs : 0) ?? 0);
      const fixed = (GameState.monthFixedExpenses ?? (typeof window.monthFixedExpenses === 'number' ? window.monthFixedExpenses : 0) ?? 0);
      const mkt = (GameState.monthMarketingExpenses ?? (typeof window.monthMarketingExpenses === 'number' ? window.monthMarketingExpenses : 0) ?? 0);
      const fin = (GameState.monthFinancialExpenses ?? (typeof window.monthFinancialExpenses === 'number' ? window.monthFinancialExpenses : 0) ?? 0);
      const net = rev - cogs - fixed - mkt - fin;
      const nwObj = typeof window.calculateCorporateNetWorth === 'function' ? window.calculateCorporateNetWorth() : { netWorth: 0 };
      window.syncDREValues(rev, cogs, fixed, mkt, net, fin, nwObj.netWorth || 0);
    }
    if (typeof window.checkCityUnlocks === 'function') {
      window.checkCityUnlocks();
    }
    if (window.activeManagedTile && typeof window.renderFacilityPanel === 'function') {
      window.renderFacilityPanel(window.activeManagedTile);
    }
  }
}

export const HUDSystem = {
  setSpeed,
  getLastActiveSpeed,
  updateClock,
  updateQuarterBadge,
  updateCash,
  updateProfit,
  updateAdvisorHUDChip,
  updateChainHealth,
  updateCampaignsBadge,
  updateRDBadge,
  updateTelemetryFooter,
  updateHUD,
  updateUI: updateHUD
};

// Exposição global para interoperabilidade
if (typeof window !== 'undefined') {
  window.HUDSystem = HUDSystem;
  window.setSpeed = setSpeed;
  window.updateHUD = updateHUD;
  window.updateUI = updateHUD;
  window.updateAdvisorHUDChip = updateAdvisorHUDChip;
}

export default HUDSystem;
