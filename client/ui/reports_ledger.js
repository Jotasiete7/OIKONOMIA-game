/**
 * reports_ledger.js — Fichário de Relatórios Financeiros (domínio CFO)
 * OIKONOMIA v0.9 (Fase HUD Redesign)
 *
 * Invólucro navegável com abas para os relatórios existentes.
 * Não reescreve a lógica interna dos painéis — apenas os aciona.
 *
 * Abas: DRE | Fluxo de Caixa | Balanço | Riscos & Dívidas
 */

const TABS = [
  {
    id: 'dre',
    label: 'DRE',
    icon: '📊',
    color: 'var(--oiko-gold)',
    open: () => {
      const fn = window.openDREModal || window.toggleDREModal || window.DREPanel?.renderDREModal;
      if (typeof fn === 'function') fn();
    }
  },
  {
    id: 'cashflow',
    label: 'Fluxo de Caixa',
    icon: '💧',
    color: '#b8c9a3',
    open: () => {
      // Abre o DRE na aba de fluxo de caixa se disponível, senão o DRE geral
      const fn = window.openDREModal || window.toggleDREModal;
      if (typeof fn === 'function') fn('cashflow');
    }
  },
  {
    id: 'balance',
    label: 'Balanço',
    icon: '⚖️',
    color: '#c9b483',
    open: () => {
      const fn = window.openDREModal || window.toggleDREModal;
      if (typeof fn === 'function') fn('balance');
    }
  },
  {
    id: 'risks',
    label: 'Riscos & Dívidas',
    icon: '🏦',
    color: '#9b2335',
    open: () => {
      const fn = window.openBankModal || window.toggleBankModal;
      if (typeof fn === 'function') fn();
    }
  }
];

let _activeTab = 'dre';
let _ledgerEl = null;

function _getOrCreateLedger() {
  if (_ledgerEl) return _ledgerEl;
  _ledgerEl = document.getElementById('reports-ledger-modal');
  if (!_ledgerEl) {
    _ledgerEl = document.createElement('div');
    _ledgerEl.id = 'reports-ledger-modal';
    _ledgerEl.className = 'fixed inset-0 z-[55] pointer-events-none hidden';
    document.body.appendChild(_ledgerEl);
  }
  return _ledgerEl;
}

function _renderLedger() {
  const el = _getOrCreateLedger();
  el.innerHTML = `
    <div class="oiko-ledger-overlay pointer-events-auto" onclick="ReportsLedger.close()"></div>
    <div class="oiko-ledger-card pointer-events-auto">
      <!-- Header do fichário -->
      <div class="oiko-ledger-header">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">📋</span>
          <div>
            <div class="text-[12px] font-bold text-[#c9a86a] tracking-wide">Fichário de Relatórios</div>
            <div class="text-[9px] text-slate-500 font-mono uppercase tracking-wider">CFO — Análise Financeira Integrada</div>
          </div>
        </div>
        <button onclick="ReportsLedger.close()" class="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center border border-white/[0.08] cursor-pointer transition" data-tip="Fechar (Esc)">✕</button>
      </div>

      <!-- Abas do fichário -->
      <div class="oiko-ledger-tabs">
        ${TABS.map(tab => `
          <button
            class="oiko-ledger-tab ${tab.id === _activeTab ? 'active' : ''}"
            style="--tab-color: ${tab.color}"
            onclick="ReportsLedger.switchTab('${tab.id}')">
            <span>${tab.icon}</span>
            <span>${tab.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- Corpo: instrução para abrir o painel existente -->
      <div class="oiko-ledger-body" id="ledger-body">
        <div class="flex flex-col items-center justify-center h-full gap-4 text-center text-slate-500">
          <span class="text-4xl opacity-40">${TABS.find(t => t.id === _activeTab)?.icon || '📊'}</span>
          <div>
            <div class="text-[13px] font-bold text-slate-300 mb-1">${TABS.find(t => t.id === _activeTab)?.label || ''}</div>
            <div class="text-[11px] text-slate-500 mb-3">Clique para abrir o relatório completo</div>
            <div class="flex items-center gap-2 justify-center">
              <button class="oiko-btn-terminal oiko-btn-gold px-4 py-2 text-[11px]" onclick="ReportsLedger.openCurrentTab()">
                Abrir ${TABS.find(t => t.id === _activeTab)?.label || 'Relatório'}
              </button>
              ${_activeTab === 'dre' ? `
                <button class="oiko-btn-terminal px-3 py-2 text-[11px] text-indigo-300 border-indigo-500/40 hover:bg-indigo-950/50" onclick="if(window.triggerPriceSimulationFromDRE)window.triggerPriceSimulationFromDRE();ReportsLedger.close();" data-tip="Simular impacto de preços no resultado">
                  🎯 Simular Cenário
                </button>
              ` : ''}
            </div>
          </div>
          <div class="border-t border-white/[0.06] pt-3 w-full">
            <button class="text-[10px] text-slate-600 hover:text-slate-400 transition font-mono" onclick="ReportsLedger.openCurrentTab()">
              💡 Dica: use F4 para abrir o Fichário direto na aba DRE
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  el.classList.remove('hidden');
}

export function openOnDRE(tabId = 'dre') {
  _activeTab = tabId;
  _renderLedger();
}

export function switchTab(tabId) {
  _activeTab = tabId;
  // Re-renderizar apenas as abas e o corpo
  const el = _getOrCreateLedger();
  if (el.classList.contains('hidden')) return;
  _renderLedger();
}

export function openCurrentTab() {
  const tab = TABS.find(t => t.id === _activeTab);
  if (tab && typeof tab.open === 'function') {
    tab.open();
    // Fechar o fichário após abrir o painel (o painel é independente)
    close();
  }
}

export function close() {
  const el = _getOrCreateLedger();
  if (el) el.classList.add('hidden');
}

export function isOpen() {
  const el = _getOrCreateLedger();
  return el ? !el.classList.contains('hidden') : false;
}

export function initReportsLedger() {
  if (typeof window === 'undefined') return;

  window.closeReportsLedger = close;
  window.openReportsLedger = openOnDRE;
}

export const ReportsLedger = {
  openOnDRE,
  switchTab,
  openCurrentTab,
  close,
  isOpen,
  initReportsLedger
};

if (typeof window !== 'undefined') {
  window.ReportsLedger = ReportsLedger;
  window.openReportsLedger = openOnDRE;
}

export default ReportsLedger;
