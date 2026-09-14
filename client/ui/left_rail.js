/**
 * left_rail.js — Trilho Executivo Esquerdo (Navegação por Domínios)
 * OIKONOMIA v0.9 (Fase HUD Redesign)
 *
 * Coluna estreita de ícones verticais que expande um painel lateral
 * ao clicar. Cada ícone representa um domínio executivo (CFO, COO, CMO).
 *
 * Não reescreve a lógica interna dos painéis — só muda o ponto de entrada.
 */

const DOMAINS = [
  {
    id: 'cfo',
    icon: '💰',
    label: 'CFO',
    title: 'Chief Financial Officer',
    items: [
      {
        label: 'Banco Central',
        icon: '🏦',
        hint: 'F3',
        action: () => {
          const fn = window.openBankModal || window.toggleBankModal;
          if (typeof fn === 'function') fn();
        }
      },
      {
        label: 'Relatórios Financeiros',
        icon: '📊',
        hint: 'F4',
        action: () => {
          const fn = window.openReportsLedger || window.ReportsLedger?.openOnDRE;
          if (typeof fn === 'function') {
            fn('dre');
          } else {
            const fallback = window.toggleDREModal || window.openDREModal;
            if (typeof fallback === 'function') fallback();
          }
          LeftRail.close();
        }
      }
    ]
  },
  {
    id: 'coo',
    icon: '🏭',
    label: 'COO',
    title: 'Chief Operating Officer',
    items: [
      {
        label: 'Árvore Tecnológica',
        icon: '🧬',
        hint: 'F2',
        action: () => {
          const fn = window.toggleTechTreeModal || window.openTechTreeModal;
          if (typeof fn === 'function') fn();
          LeftRail.close();
        }
      },
      {
        label: 'P&D',
        icon: '🔬',
        action: () => {
          const fn = window.openRDCenterModal;
          if (typeof fn === 'function') fn();
          LeftRail.close();
        }
      },
      {
        label: 'Gestão de Instalações',
        icon: '🏢',
        action: () => {
          // Foca a floating facility window (já aberta pelo clique no mapa normalmente)
          const win = document.getElementById('floating-facility-window');
          if (win && win.classList.contains('hidden')) {
            win.classList.remove('hidden');
          }
          LeftRail.close();
        }
      }
    ]
  },
  {
    id: 'cmo',
    icon: '📢',
    label: 'CMO',
    title: 'Chief Marketing Officer',
    items: [
      {
        label: 'Publicidade & Mídia',
        icon: '📢',
        action: () => {
          const fn = window.openMarketingCentralModal;
          if (typeof fn === 'function') fn();
          LeftRail.close();
        }
      },
      {
        label: 'Diretoria Executiva',
        icon: '👔',
        action: () => {
          const fn = window.toggleExecutiveBoardModal;
          if (typeof fn === 'function') fn();
          LeftRail.close();
        }
      }
    ]
  }
];

let _activeDomain = null;
let _railEl = null;
let _panelEl = null;

function _buildRail() {
  const container = document.getElementById('left-rail');
  if (!container) return;
  _railEl = container;

  container.innerHTML = `
    <div class="oiko-rail-icons" id="left-rail-icons">
      ${DOMAINS.map(d => `
        <button
          class="oiko-rail-icon-btn"
          id="rail-btn-${d.id}"
          data-domain="${d.id}"
          data-tip="${d.title}"
          onclick="LeftRail.toggleDomain('${d.id}')">
          <span class="text-xl">${d.icon}</span>
          <span class="oiko-rail-label">${d.label}</span>
        </button>
      `).join('')}
    </div>
    <div class="oiko-rail-panel hidden" id="left-rail-panel">
      <div class="oiko-rail-panel-header" id="left-rail-panel-header">
        <span id="left-rail-panel-icon" class="text-xl"></span>
        <div>
          <div id="left-rail-panel-title" class="text-[11px] font-bold text-[#c9a86a]"></div>
          <div id="left-rail-panel-subtitle" class="text-[9px] text-slate-500"></div>
        </div>
        <button onclick="LeftRail.close()" class="ml-auto text-slate-500 hover:text-slate-300 text-xs transition">✕</button>
      </div>
      <div class="oiko-rail-panel-body" id="left-rail-panel-body"></div>
    </div>
  `;

  _panelEl = document.getElementById('left-rail-panel');
}

function _renderDomainPanel(domain) {
  const iconEl = document.getElementById('left-rail-panel-icon');
  const titleEl = document.getElementById('left-rail-panel-title');
  const subtitleEl = document.getElementById('left-rail-panel-subtitle');
  const bodyEl = document.getElementById('left-rail-panel-body');

  if (iconEl) iconEl.textContent = domain.icon;
  if (titleEl) titleEl.textContent = domain.label;
  if (subtitleEl) subtitleEl.textContent = domain.title;

  if (bodyEl) {
    bodyEl.innerHTML = domain.items.map(item => `
      <button class="oiko-rail-item-btn" onclick="(${item.action.toString()})()">
        <span class="text-base">${item.icon}</span>
        <span class="flex-1 text-left">${item.label}</span>
        ${item.hint ? `<span class="text-[8px] text-slate-600 font-mono">${item.hint}</span>` : ''}
      </button>
    `).join('');
  }
}

function toggleDomain(domainId) {
  if (_activeDomain === domainId) {
    close();
    return;
  }
  const domain = DOMAINS.find(d => d.id === domainId);
  if (!domain || !_panelEl) return;

  _activeDomain = domainId;

  // Atualizar estado visual dos botões
  DOMAINS.forEach(d => {
    const btn = document.getElementById(`rail-btn-${d.id}`);
    if (btn) btn.classList.toggle('active', d.id === domainId);
  });

  _renderDomainPanel(domain);

  // Mostrar painel com transição
  _panelEl.classList.remove('hidden');
  // Forçar reflow para a transição funcionar
  void _panelEl.offsetWidth;
  _panelEl.classList.add('open');
}

function close() {
  if (!_panelEl) return;
  _panelEl.classList.remove('open');
  _panelEl.classList.add('hidden');
  _activeDomain = null;

  DOMAINS.forEach(d => {
    const btn = document.getElementById(`rail-btn-${d.id}`);
    if (btn) btn.classList.remove('active');
  });
}

function isOpen() {
  return _activeDomain !== null;
}

export function initLeftRail() {
  if (typeof document === 'undefined') return;
  _buildRail();

  // Fechar ao clicar fora do trilho
  document.addEventListener('click', (e) => {
    if (!_activeDomain) return;
    const rail = document.getElementById('left-rail');
    if (rail && rail.contains(e.target)) return;
    close();
  });

  // Expor para o ESC do modal_manager
  window.closeLeftRail = close;
}

export const LeftRail = {
  toggleDomain,
  close,
  isOpen,
  initLeftRail
};

if (typeof window !== 'undefined') {
  window.LeftRail = LeftRail;
}

export default LeftRail;
