/**
 * banking_panel.js — Painel de Serviços Bancários (Banco Central de Nova Atenas)
 * OIKONOMIA v0.8.5 (Fase 6.4 — Controladores dos Painéis Modais)
 * 
 * Responsável por:
 * - Interface do Banco Central de Nova Atenas (#bank-modal)
 * - Navegação de 4 abas: Score, Novo Empréstimo, Contratos Ativos e Histórico
 * - Cálculo de Score de Crédito Corporativo e Rating (AAA a B)
 * - Simulador dinâmico de parcelas, juros e amortizações
 * - Quitação antecipada com desconto de juros futuros
 * - Processamento mensal de parcelas na simulação (processBankingInstallments)
 */

import GameState from '../../game_state.js';

let _bankCurrentTab = 'score';
let _bankLoanValue  = 20000;
let _bankLoanPlan   = 1; // 0 = 6m, 1 = 12m, 2 = 24m

export function getBankCurrentTab() {
  return _bankCurrentTab;
}

export function openBankModal() {
  const modal = document.getElementById('bank-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  _bankCurrentTab = 'score';
  _updateBankTabActiveCount();
  renderBankTab('score');
}

export function closeBankModal() {
  const modal = document.getElementById('bank-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function updateBankHUDBadge() {
  const count = GameState.banking ? (GameState.banking.activeLoans || []).length : 0;
  _updateBankTabActiveCount();
  const badge = document.getElementById('hud-bank-debt-badge');
  if (!badge) return;

  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (count > 0 && GameState.banking && GameState.banking.totalDebt > 0 && bs) {
    badge.textContent = bs.fmtCurrency(GameState.banking.totalDebt);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

export function _updateBankTabActiveCount() {
  const countEl = document.getElementById('bank-tab-active-count');
  if (countEl) {
    const count = GameState.banking ? (GameState.banking.activeLoans || []).length : 0;
    countEl.textContent = count;
  }
}

export function renderBankTab(tabId) {
  _bankCurrentTab = tabId;
  ['score', 'new', 'active', 'history'].forEach(t => {
    const btn = document.getElementById(`bank-tab-${t}`);
    if (btn) btn.classList.toggle('active', t === tabId);
  });
  const content = document.getElementById('bank-tab-content');
  if (!content) return;

  if (!GameState.banking) {
    GameState.banking = { activeLoans: [], totalDebt: 0, loanHistory: [] };
  }

  switch (tabId) {
    case 'score':   content.innerHTML = _renderBankScoreTab();   break;
    case 'new':     content.innerHTML = _renderBankNewTab();      break;
    case 'active':  content.innerHTML = _renderBankActiveTab();   break;
    case 'history': content.innerHTML = _renderBankHistoryTab();  break;
  }
}

export function calcAverageBrandRating() {
  const ratings = (typeof window !== 'undefined' && window.playerBrandRating) ? window.playerBrandRating : GameState.playerBrandRating;
  const brands = Object.values(ratings || {}).filter(b => b > 10);
  if (brands.length === 0) return 20;
  return brands.reduce((s, b) => s + b, 0) / brands.length;
}

export function calcBankingCreditScore() {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return null;

  const citiesSet = new Set();
  const facilities = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet : new Map();
  for (const tile of facilities.values()) {
    const cityInfo = (typeof window !== 'undefined' && typeof window.getCityForTile === 'function')
      ? window.getCityForTile(tile.x, tile.y)
      : (tile.city || null);
    if (cityInfo && cityInfo.cityId) citiesSet.add(cityInfo.cityId);
  }

  const nwObj = (typeof window !== 'undefined' && typeof window.calculateCorporateNetWorth === 'function')
    ? window.calculateCorporateNetWorth()
    : { totalAssets: 0 };
  const currentCash = GameState.cash ?? ((typeof window !== 'undefined') ? window.cash : 0);
  const facilityAssets = nwObj.totalAssets - (currentCash > 0 ? currentCash : 0);
  const unlocked = (typeof window !== 'undefined' && window.unlockedProducts) ? window.unlockedProducts : GameState.unlockedProducts;

  const avgQR = (typeof window !== 'undefined' && typeof window.calcAverageQRAllResearched === 'function')
    ? window.calcAverageQRAllResearched()
    : 0;

  return bs.calcCreditScore({
    cash:                  currentCash,
    facilityAssets:        Math.max(0, facilityAssets),
    totalBankingDebt:      GameState.banking ? (GameState.banking.totalDebt || 0) : 0,
    citiesWithPresence:    citiesSet.size,
    unlockedProductsCount: (unlocked ? unlocked.size : 0),
    avgQR:                 avgQR,
    avgBrand:              calcAverageBrandRating(),
    yearsActive:           Math.max(0, (GameState.year || 1) - 1),
  });
}

export function _renderBankScoreTab() {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) {
    return '<div class="text-center text-rose-400 text-xs font-mono py-8">BankingSystem não carregado.</div>';
  }

  const score = calcBankingCreditScore();
  if (!score) return '<div class="text-center text-slate-500 text-xs py-8">Erro ao calcular score.</div>';

  const r = score.creditRating;
  const ratingColors = {
    'AAA': { text: 'text-emerald-300', bg: 'bg-emerald-950/80', border: 'border-emerald-600/60', glow: 'shadow-emerald-900/60' },
    'AA':  { text: 'text-emerald-300', bg: 'bg-emerald-950/70', border: 'border-emerald-700/50', glow: 'shadow-emerald-900/40' },
    'A':   { text: 'text-blue-300',    bg: 'bg-blue-950/80',    border: 'border-blue-600/60',    glow: 'shadow-blue-900/60'   },
    'BBB': { text: 'text-amber-300',   bg: 'bg-amber-950/80',   border: 'border-amber-600/60',   glow: 'shadow-amber-900/60'  },
    'BB':  { text: 'text-orange-300',  bg: 'bg-orange-950/80',  border: 'border-orange-600/60',  glow: 'shadow-orange-900/40' },
    'B':   { text: 'text-rose-300',    bg: 'bg-rose-950/80',    border: 'border-rose-600/60',    glow: 'shadow-rose-900/40'   },
  };
  const rc = ratingColors[r.label] || ratingColors['B'];

  const headerBadge = document.getElementById('bank-header-rating');
  if (headerBadge) {
    headerBadge.className = `shrink-0 px-3 py-1 rounded-lg border text-xs md:text-sm font-black font-mono ${rc.text} ${rc.bg} ${rc.border}`;
    headerBadge.textContent = `${r.label} · ${r.desc}`;
  }

  const total = Math.max(1, score.netWorth + score.territorial + score.tech + score.reputation);
  const barA = Math.min(100, (score.netWorth   / total) * 100).toFixed(1);
  const barB = Math.min(100, (score.territorial / total) * 100).toFixed(1);
  const barC = Math.min(100, (score.tech        / total) * 100).toFixed(1);
  const barD = Math.min(100, (score.reputation  / total) * 100).toFixed(1);

  const tip = _getBankTip(score);

  const macroPhase = (typeof window !== 'undefined' && window.MacroCycleSystem)
    ? window.MacroCycleSystem.getPhaseInfo(GameState.year || 1)
    : null;
  const isRecession = macroPhase && macroPhase.code === 'RECESSION';

  return `
    <div class="relative rounded-xl p-5 mb-4 border ${rc.border} ${rc.bg} overflow-hidden shadow-lg ${rc.glow}">
      <div class="absolute inset-0 opacity-5" style="background:radial-gradient(circle at 80% 20%, #fbbf24 0%, transparent 60%)"></div>
      <div class="relative flex items-start gap-4">
        <div class="flex-1">
          <div class="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">Rating de Crédito</div>
          <div class="text-4xl md:text-5xl font-black ${rc.text} font-mono leading-none mb-1.5">${r.label}</div>
          <div class="text-sm ${rc.text} font-mono font-semibold">${r.desc}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">Score Total</div>
          <div class="text-2xl font-black text-slate-100 font-mono">${bs.fmtCurrency(score.totalScore)}</div>
          ${isRecession ? `<div class="mt-2 text-xs bg-rose-900/70 text-rose-200 border border-rose-600/60 px-2.5 py-1 rounded-md font-mono font-bold bank-recessao-tag">📉 Recessão · Parcelas reduzidas</div>` : ''}
        </div>
      </div>

      <div class="relative mt-4 pt-4 border-t border-white/10">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-black/20 rounded-lg p-2">
            <div class="text-xs text-slate-400 font-mono mb-0.5">Limite Bruto</div>
            <div class="text-sm md:text-base font-bold text-slate-200 font-mono">${bs.fmtCurrency(score.rawCreditLimit)}</div>
          </div>
          <div class="bg-black/20 rounded-lg p-2">
            <div class="text-xs text-slate-400 font-mono mb-0.5">Dívida Ativa</div>
            <div class="text-sm md:text-base font-bold ${GameState.banking.totalDebt > 0 ? 'text-rose-300' : 'text-slate-400'} font-mono">${bs.fmtCurrency(GameState.banking.totalDebt)}</div>
          </div>
          <div class="bg-black/20 rounded-lg p-2">
            <div class="text-xs text-slate-400 font-mono mb-0.5">Disponível</div>
            <div class="text-sm md:text-base font-bold text-emerald-300 font-mono">${bs.fmtCurrency(score.availableLimit)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-3 mb-4">
      <div class="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Composição do Score</div>
      ${_scoreBar('A', '🏛', 'Patrimônio Líquido', score.netWorth, barA, 'bg-emerald-500')}
      ${_scoreBar('B', '🗺', 'Cobertura Territorial', score.territorial, barB, 'bg-blue-500')}
      ${_scoreBar('C', '🔬', 'Nível Tecnológico', score.tech, barC, 'bg-purple-500')}
      ${_scoreBar('D', '⭐', 'Reputação de Mercado', score.reputation, barD, 'bg-amber-500')}
    </div>

    ${tip ? `<div class="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 text-xs md:text-sm text-amber-200/90 font-mono flex items-start gap-2"><span>💡</span> <span>${tip}</span></div>` : ''}
  `;
}

export function _scoreBar(letter, icon, label, value, pct, color) {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  const valStr = bs ? bs.fmtCurrency(value) : `$${value.toLocaleString()}`;
  return `
    <div class="flex items-center gap-2.5">
      <span class="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300 font-mono shrink-0">${letter}</span>
      <span class="text-sm font-mono shrink-0">${icon}</span>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-medium text-slate-200 font-mono">${label}</span>
          <span class="text-xs font-bold text-slate-300 font-mono">${valStr}</span>
        </div>
        <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full ${color} rounded-full bank-score-bar" style="width:${pct}%"></div>
        </div>
      </div>
    </div>
  `;
}

export function _getBankTip(score) {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  const bonus = bs ? bs.TERRITORIAL_BONUS_PER_CITY : 15000;
  if (score.territorial < 30000) return `Expanda para mais 1 cidade para liberar +$${bonus.toLocaleString()} de score territorial.`;
  if (score.tech < 50000) return 'Invista em P&D e desbloqueie mais produtos para aumentar o score tecnológico.';
  if (score.reputation < 50000) return 'Mantenha campanhas de marketing ativas para elevar o Brand Rating e o score de reputação.';
  if (score.availableLimit < 5000) return 'Quite empréstimos ativos para liberar mais limite de crédito disponível.';
  return null;
}

export function _renderBankNewTab() {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return '<div class="text-rose-400 text-sm font-mono py-8 text-center">Módulo bancário não carregado.</div>';

  const score = calcBankingCreditScore();
  if (!score) return '<div class="text-slate-400 text-sm py-8 text-center">Erro ao calcular score.</div>';

  const maxLoans = bs.MAX_ACTIVE_LOANS;
  const activeCount = (GameState.banking.activeLoans || []).length;
  const atLimit = activeCount >= maxLoans;
  const noCredit = score.availableLimit < 1000;

  if (atLimit) {
    return `<div class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="text-4xl">🔒</div>
      <div class="text-base font-bold text-slate-200 font-mono">Limite de Contratos Atingido</div>
      <div class="text-xs md:text-sm text-slate-400 font-mono text-center max-w-md">Você já possui ${maxLoans} empréstimos ativos simultâneos.<br>Quite pelo menos um para liberar uma nova linha de crédito.</div>
    </div>`;
  }

  if (noCredit) {
    return `<div class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="text-4xl">📉</div>
      <div class="text-base font-bold text-slate-200 font-mono">Crédito Insuficiente</div>
      <div class="text-xs md:text-sm text-slate-400 font-mono text-center max-w-md">Seu score corporativo atual não atinge o limite mínimo de crédito.<br>Expanda sua empresa e patrimônio para desbloquear empréstimos.</div>
    </div>`;
  }

  const minVal  = 1000;
  const maxVal  = Math.floor(score.availableLimit / 1000) * 1000;
  const initVal = Math.min(_bankLoanValue, maxVal);
  const plan    = bs.LOAN_PLANS[_bankLoanPlan];
  const rate    = bs.getEffectiveRate(plan, score.creditRating.label);
  const inst    = bs.calcMonthlyInstallment(initVal, rate, plan.months);
  const total   = inst * plan.months;
  const juros   = total - initVal;

  return `
    <div class="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 mb-4 shadow-sm">
      <div class="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2.5">Valor do Empréstimo</div>
      <div class="flex items-baseline gap-3 mb-3">
        <div class="text-3xl md:text-4xl font-black text-amber-300 font-mono" id="bank-val-display">${bs.fmtFull(initVal)}</div>
        <div class="text-sm font-medium text-slate-400 font-mono">/ máx. ${bs.fmtCurrency(maxVal)}</div>
      </div>
      <div class="py-1">
        <input type="range" id="bank-loan-slider"
          min="${minVal}" max="${maxVal}" step="1000" value="${initVal}"
          class="w-full cursor-pointer mb-2"
          oninput="_onBankSlider(this.value)"
        >
      </div>
      <div class="flex justify-between text-xs font-semibold text-slate-400 font-mono">
        <span>Mín: ${bs.fmtCurrency(minVal)}</span>
        <span>Máx: ${bs.fmtCurrency(maxVal)}</span>
      </div>
    </div>

    <div class="mb-4">
      <div class="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2.5">Prazo de Amortização</div>
      <div class="grid grid-cols-3 gap-2.5">
        ${bs.LOAN_PLANS.map((p, i) => `
          <button onclick="_onBankPlanSelect(${i})" id="bank-plan-btn-${i}"
            class="bank-plan-btn rounded-xl border p-3.5 text-center transition ${i === _bankLoanPlan ? 'border-amber-500 bg-amber-950/70 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40' : 'border-slate-700/80 bg-slate-800/50 hover:border-amber-800/80'}">
            <div class="text-xl font-black ${i === _bankLoanPlan ? 'text-amber-300' : 'text-slate-200'} font-mono">${p.months}<span class="text-sm font-semibold"> meses</span></div>
            <div class="text-xs font-semibold ${i === _bankLoanPlan ? 'text-amber-400' : 'text-slate-400'} font-mono mt-0.5">${(p.monthlyRate * 100).toFixed(1)}%/mês</div>
          </button>
        `).join('')}
      </div>
    </div>

    <div id="bank-preview" class="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 mb-4">
      ${_bankPreviewHTML(initVal, inst, total, juros, rate)}
    </div>

    <button onclick="_confirmNewLoan()"
      class="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:from-amber-700 active:to-amber-800 text-white font-bold text-base md:text-lg font-mono transition shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2">
      🏦 Contratar Linha de Crédito
    </button>
    <div class="text-xs text-slate-400 font-mono text-center mt-2.5">
      Contratos ativos: <span class="text-slate-200 font-bold">${activeCount}/${maxLoans}</span> · Rating Aplicado: <span class="text-amber-300 font-bold">${score.creditRating.label}</span>
    </div>
  `;
}

export function _bankPreviewHTML(val, inst, total, juros, rate) {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  return `
    <div class="grid grid-cols-2 gap-4 text-xs md:text-sm font-mono">
      <div class="space-y-2">
        <div class="flex justify-between items-center"><span class="text-slate-400">Parcela mensal</span><span class="text-amber-300 font-bold text-sm md:text-base">${bs ? bs.fmtFull(inst) : `$${inst.toFixed(2)}`}</span></div>
        <div class="flex justify-between items-center"><span class="text-slate-400">Taxa efetiva</span><span class="text-slate-200 font-semibold">${(rate*100).toFixed(2)}%/mês</span></div>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between items-center"><span class="text-slate-400">Total a pagar</span><span class="text-slate-100 font-bold text-sm md:text-base">${bs ? bs.fmtFull(total) : `$${total.toFixed(2)}`}</span></div>
        <div class="flex justify-between items-center"><span class="text-slate-400">Custo de juros</span><span class="text-rose-300 font-semibold">${bs ? bs.fmtFull(juros) : `$${juros.toFixed(2)}`}</span></div>
      </div>
    </div>
  `;
}

export function _onBankSlider(val) {
  _bankLoanValue = parseInt(val, 10);
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  const disp = document.getElementById('bank-val-display');
  if (disp && bs) disp.textContent = bs.fmtFull(_bankLoanValue);
  _refreshBankPreview();
}

export function _onBankPlanSelect(idx) {
  _bankLoanPlan = idx;
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return;

  bs.LOAN_PLANS.forEach((p, i) => {
    const btn = document.getElementById(`bank-plan-btn-${i}`);
    if (!btn) return;
    const active = i === idx;
    btn.className = `bank-plan-btn rounded-xl border p-3.5 text-center transition ${active ? 'border-amber-500 bg-amber-950/70 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40' : 'border-slate-700/80 bg-slate-800/50 hover:border-amber-800/80'}`;
    const d1 = btn.querySelector('div:first-child');
    if (d1) d1.className = `text-xl font-black ${active ? 'text-amber-300' : 'text-slate-200'} font-mono`;
    const d2 = btn.querySelector('div:last-child');
    if (d2) d2.className = `text-xs font-semibold ${active ? 'text-amber-400' : 'text-slate-400'} font-mono mt-0.5`;
  });
  _refreshBankPreview();
}

export function _refreshBankPreview() {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return;
  const score = calcBankingCreditScore();
  if (!score) return;
  const plan = bs.LOAN_PLANS[_bankLoanPlan];
  const rate = bs.getEffectiveRate(plan, score.creditRating.label);
  const val  = Math.min(_bankLoanValue, Math.floor(score.availableLimit));
  const inst = bs.calcMonthlyInstallment(val, rate, plan.months);
  const total = inst * plan.months;
  const juros = total - val;
  const preview = document.getElementById('bank-preview');
  if (preview) preview.innerHTML = _bankPreviewHTML(val, inst, total, juros, rate);
}

export function _confirmNewLoan() {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return;
  const score = calcBankingCreditScore();
  if (!score) return;
  const plan = bs.LOAN_PLANS[_bankLoanPlan];
  const val  = Math.min(_bankLoanValue, Math.floor(score.availableLimit));
  if (val < 1000) { alert('Valor mínimo: $1.000'); return; }
  if ((GameState.banking.activeLoans || []).length >= bs.MAX_ACTIVE_LOANS) { alert('Limite de contratos atingido.'); return; }

  const loan = bs.createLoanObject(
    val, plan, score.creditRating.label,
    { day: GameState.day, month: GameState.month, year: GameState.year }
  );

  GameState.banking.activeLoans.push(loan);
  GameState.banking.totalDebt += loan.principal;
  GameState.cash = (GameState.cash || 0) + val;
  if (typeof window !== 'undefined') window.cash = GameState.cash;

  updateBankHUDBadge();
  if (typeof window !== 'undefined' && typeof window.updateUI === 'function') window.updateUI();

  if (typeof window !== 'undefined' && window.TickerSystem && window.TickerSystem.pushFromLog) {
    window.TickerSystem.pushFromLog(
      `🏦 [BANCO] Empréstimo de ${bs.fmtFull(val)} contratado (${plan.label} · parcela ${bs.fmtFull(loan.monthlyInstallment)}/mês)`,
      'text-amber-300 font-bold'
    );
  }

  renderBankTab('active');
}

export function _renderBankActiveTab() {
  const loans = GameState.banking ? (GameState.banking.activeLoans || []) : [];
  if (loans.length === 0) {
    return `<div class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="text-4xl">✅</div>
      <div class="text-base font-bold text-slate-200 font-mono">Nenhum Empréstimo Ativo</div>
      <div class="text-xs md:text-sm text-slate-400 font-mono text-center max-w-md">Sua corporação está operando com autonomia financeira total, sem dívidas bancárias ativas.</div>
    </div>`;
  }

  const macroPhase = (typeof window !== 'undefined' && window.MacroCycleSystem)
    ? window.MacroCycleSystem.getPhaseInfo(GameState.year || 1)
    : null;
  const isRecession = macroPhase && macroPhase.code === 'RECESSION';

  return `
    <div class="space-y-3.5">
      ${isRecession ? `<div class="bg-rose-950/70 border border-rose-800/60 rounded-xl px-4 py-3 text-xs md:text-sm text-rose-200 font-mono font-bold bank-recessao-tag flex items-center gap-2"><span>📉</span> <span>Recessão ativa — parcelas recalculadas com desconto de taxa (-0,3%/mês) neste ciclo.</span></div>` : ''}
      ${loans.map(loan => _loanCard(loan)).join('')}
    </div>
  `;
}

export function _loanCard(loan) {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return '';

  const pct = Math.max(0, Math.min(100, ((loan.planMonths - loan.monthsRemaining) / loan.planMonths) * 100));
  const earlyAmt = bs.calcEarlyPayoffAmount(loan);
  const savings  = (loan.monthlyInstallment * loan.monthsRemaining) - earlyAmt;

  return `
    <div class="bank-loan-card bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 shadow-sm">
      <div class="flex items-start justify-between mb-3.5">
        <div>
          <div class="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Contrato · ${loan.plan}</div>
          <div class="text-xl font-black text-amber-300 font-mono">${bs.fmtFull(loan.principal)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs font-semibold text-slate-400 font-mono">Saldo Devedor</div>
          <div class="text-lg font-black text-rose-300 font-mono">${bs.fmtFull(loan.remainingBalance)}</div>
        </div>
      </div>

      <div class="mb-3.5">
        <div class="flex justify-between text-xs font-semibold text-slate-300 font-mono mb-1.5">
          <span>${loan.monthsTaken || 0} de ${loan.planMonths} meses pagos</span>
          <span>${loan.monthsRemaining} meses restantes</span>
        </div>
        <div class="h-2.5 bg-slate-700/80 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full bank-score-bar" style="width:${pct.toFixed(1)}%"></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2.5 text-center mb-3.5">
        <div class="bg-slate-900/70 rounded-lg p-2.5">
          <div class="text-xs text-slate-400 font-mono mb-0.5">Parcela / mês</div>
          <div class="text-sm font-bold text-slate-100 font-mono">${bs.fmtFull(loan.monthlyInstallment)}</div>
        </div>
        <div class="bg-slate-900/70 rounded-lg p-2.5">
          <div class="text-xs text-slate-400 font-mono mb-0.5">Taxa de Juros</div>
          <div class="text-sm font-bold text-slate-100 font-mono">${(loan.monthlyRate * 100).toFixed(2)}%/m</div>
        </div>
        <div class="bg-slate-900/70 rounded-lg p-2.5">
          <div class="text-xs text-slate-400 font-mono mb-0.5">Total Amortizado</div>
          <div class="text-sm font-bold text-emerald-300 font-mono">${bs.fmtFull(loan.totalPaid || 0)}</div>
        </div>
      </div>

      <button onclick="_promptEarlyPayoff('${loan.id}', ${earlyAmt}, ${savings})"
        class="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-amber-900/60 border border-slate-600 hover:border-amber-700/70 text-slate-100 hover:text-amber-200 text-xs md:text-sm font-mono font-bold transition flex items-center justify-center gap-2">
        💳 Quitar Antecipadamente · <span class="text-emerald-300 font-bold">${bs.fmtFull(earlyAmt)}</span>
        ${savings > 0 ? `<span class="text-xs text-emerald-400/90 font-semibold">(Economia de ${bs.fmtCurrency(savings)})</span>` : ''}
      </button>
    </div>
  `;
}

export function _promptEarlyPayoff(loanId, earlyAmt, savings) {
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  const currentCash = GameState.cash ?? ((typeof window !== 'undefined') ? window.cash : 0);
  if (currentCash < earlyAmt) {
    const notice = `Saldo em caixa insuficiente. Você possui ${bs ? bs.fmtFull(currentCash) : '$' + currentCash}, mas a quitação requer ${bs ? bs.fmtFull(earlyAmt) : '$' + earlyAmt}.`;
    alert(notice);
    return;
  }
  const savingsStr = savings > 0 ? ` (economia garantida de ${bs ? bs.fmtFull(savings) : '$' + savings} em juros futuros)` : '';
  const confirmed = confirm(`Deseja quitar este empréstimo antecipadamente pelo valor líquido de ${bs ? bs.fmtFull(earlyAmt) : '$' + earlyAmt}${savingsStr}?`);
  if (confirmed) _confirmEarlyPayoff(loanId, earlyAmt);
}

export function _confirmEarlyPayoff(loanId, earlyAmt) {
  if (!GameState.banking) return;
  const loan = GameState.banking.activeLoans.find(l => l.id === loanId);
  if (!loan) return;
  const currentCash = GameState.cash ?? ((typeof window !== 'undefined') ? window.cash : 0);
  if (currentCash < earlyAmt) { alert('Saldo insuficiente.'); return; }

  GameState.cash = currentCash - earlyAmt;
  if (typeof window !== 'undefined') window.cash = GameState.cash;
  loan.totalPaid = (loan.totalPaid || 0) + earlyAmt;

  const dateQuitado = { day: GameState.day, month: GameState.month, year: GameState.year };
  GameState.banking.loanHistory.push({ ...loan, quitadoEm: dateQuitado, earlyPayoff: true, earlyPayoffAmount: earlyAmt });
  GameState.banking.activeLoans = GameState.banking.activeLoans.filter(l => l.id !== loanId);
  GameState.banking.totalDebt = GameState.banking.activeLoans.reduce((s, l) => s + (l.remainingBalance || 0), 0);

  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (typeof window !== 'undefined' && window.TickerSystem && window.TickerSystem.pushFromLog && bs) {
    window.TickerSystem.pushFromLog(
      `🏦 [BANCO] Empréstimo de ${bs.fmtFull(loan.principal)} quitado antecipadamente por ${bs.fmtFull(earlyAmt)}!`,
      'text-emerald-400 font-bold'
    );
  }

  updateBankHUDBadge();
  if (typeof window !== 'undefined' && typeof window.updateUI === 'function') window.updateUI();
  renderBankTab('active');
}

export function _renderBankHistoryTab() {
  const history = GameState.banking ? (GameState.banking.loanHistory || []) : [];
  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;

  if (history.length === 0) {
    return `<div class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="text-4xl">🗂</div>
      <div class="text-base font-bold text-slate-200 font-mono">Histórico Vazio</div>
      <div class="text-xs md:text-sm text-slate-400 font-mono text-center max-w-md">Os empréstimos finalizados ou quitados antecipadamente serão catalogados aqui.</div>
    </div>`;
  }

  const rows = [...history].reverse().map(loan => {
    const dateFmt = loan.quitadoEm
      ? `${String(loan.quitadoEm.day).padStart(2,'0')}/${String(loan.quitadoEm.month).padStart(2,'0')} · Ano ${loan.quitadoEm.year}`
      : '—';
    const badge = loan.earlyPayoff
      ? '<span class="bg-emerald-900/70 text-emerald-300 text-xs px-2 py-0.5 rounded border border-emerald-600/60 font-mono font-bold">Quitado Antecipado</span>'
      : '<span class="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700 font-mono font-bold">Amortizado Integral</span>';

    return `
      <div class="flex items-center gap-3.5 py-3 border-b border-slate-800/70 last:border-0">
        <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">💳</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-100 font-mono">${bs ? bs.fmtFull(loan.principal) : '$' + loan.principal}</span>
            ${badge}
          </div>
          <div class="text-xs text-slate-400 font-mono mt-0.5">${loan.plan} · Quitado em ${dateFmt}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-sm font-bold text-slate-200 font-mono">${bs ? bs.fmtFull(loan.totalPaid || 0) : '$' + (loan.totalPaid || 0)}</div>
          <div class="text-xs text-slate-500 font-mono">total pago</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2.5">${history.length} empréstimo${history.length !== 1 ? 's' : ''} liquidado${history.length !== 1 ? 's' : ''}</div>
    <div class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 divide-y divide-slate-800/70">
      ${rows}
    </div>
  `;
}

export function processBankingInstallments() {
  if (!GameState.banking || !Array.isArray(GameState.banking.activeLoans)) return;
  if (GameState.banking.activeLoans.length === 0) return;

  const bs = (typeof window !== 'undefined' && window.BankingSystem) ? window.BankingSystem : null;
  if (!bs) return;

  const macroPhase = (typeof window !== 'undefined' && window.MacroCycleSystem)
    ? window.MacroCycleSystem.getPhaseInfo(GameState.year || 1)
    : null;
  const isRecession = macroPhase && macroPhase.code === 'RECESSION';

  const completed = [];
  for (const loan of GameState.banking.activeLoans) {
    const { installment, isFullyPaid } = bs.processMonthlyInstallment(loan, isRecession);

    const currentCash = GameState.cash ?? ((typeof window !== 'undefined') ? window.cash : 0);
    GameState.cash = currentCash - installment;
    if (typeof window !== 'undefined') window.cash = GameState.cash;

    GameState.monthFinancialExpenses = (GameState.monthFinancialExpenses || 0) + installment;
    if (typeof window !== 'undefined') window.monthFinancialExpenses = GameState.monthFinancialExpenses;

    if (isFullyPaid) {
      completed.push(loan.id);
      const dateQuitado = { day: GameState.day, month: GameState.month, year: GameState.year };
      GameState.banking.loanHistory.push({ ...loan, quitadoEm: dateQuitado, earlyPayoff: false });
      if (typeof window !== 'undefined' && window.TickerSystem && window.TickerSystem.pushFromLog) {
        window.TickerSystem.pushFromLog(
          `🏦 [BANCO] Empréstimo de ${bs.fmtFull(loan.principal)} quitado com sucesso!`,
          'text-emerald-400 font-bold'
        );
      }
    }
  }

  if (completed.length > 0) {
    GameState.banking.activeLoans = GameState.banking.activeLoans.filter(l => !completed.includes(l.id));
  }

  GameState.banking.totalDebt = GameState.banking.activeLoans.reduce((s, l) => s + (l.remainingBalance || 0), 0);
  updateBankHUDBadge();
}

export const BankingPanel = {
  openBankModal,
  closeBankModal,
  updateBankHUDBadge,
  renderBankTab,
  calcBankingCreditScore,
  processBankingInstallments,
  _onBankSlider,
  _onBankPlanSelect,
  _confirmNewLoan,
  _promptEarlyPayoff,
  _confirmEarlyPayoff
};

if (typeof window !== 'undefined') {
  window.BankingPanel = BankingPanel;
  window.openBankModal = openBankModal;
  window.closeBankModal = closeBankModal;
  window.renderBankTab = renderBankTab;
  window.updateBankHUDBadge = updateBankHUDBadge;
  window.calcBankingCreditScore = calcBankingCreditScore;
  window.processBankingInstallments = processBankingInstallments;
  window._onBankSlider = _onBankSlider;
  window._onBankPlanSelect = _onBankPlanSelect;
  window._confirmNewLoan = _confirmNewLoan;
  window._promptEarlyPayoff = _promptEarlyPayoff;
  window._confirmEarlyPayoff = _confirmEarlyPayoff;
}

export default BankingPanel;
