/**
 * oikonomos_btn.js — Botão Persistente do Conselheiro Oikonomos
 * OIKONOMIA v0.9 (Fase HUD Redesign)
 *
 * Botão circular fixo no canto inferior direito (junto ao minimap).
 * Ao clicar, exibe um popover com abas:
 * 1. Diagnóstico: alerta corporativo urgente do AdvisorSystem
 * 2. Dica do Mentor: sabedoria econômica e boas práticas de gestão
 */

import { ECONOMIC_TIPS } from '../game_config.js';

let _isOpen = false;
let _currentTab = 'diagnosis'; // 'diagnosis' | 'tips'
let _currentTipIndex = 0;

function _getPopover() {
  return document.getElementById('oikonomos-popover');
}

function _getAdviceText() {
  return document.getElementById('oikonomos-advice-text');
}

function _fetchLatestAdvice() {
  try {
    const advSys = window.AdvisorSystem;
    if (!advSys || typeof advSys.diagnoseCorporateIssues !== 'function') {
      return '📊 Aguardando dados da simulação para gerar conselho…';
    }

    const facSet = window.activeFacilitySet || new Map();
    const rd = window.rdLabs || {};
    const GameState = window.GameState || {};

    const alerts = advSys.diagnoseCorporateIssues({
      state: GameState,
      activeFacilitySet: facSet,
      rdLabs: rd
    });

    if (!alerts || alerts.length === 0) {
      return '✅ Nenhuma irregularidade crítica detectada. A operação está estável. Continue expandindo!';
    }

    // Pegar o alerta de maior prioridade (primeiro da lista, já ordenado por severidade)
    const top = alerts[0];
    const icon = top.severity === 'critical' ? '🚨' :
                 top.severity === 'warning'  ? '⚠️' : '💡';
    return `${icon} ${top.message || top.title || 'Verifique o painel da Diretoria.'}`;
  } catch (e) {
    return '🧐 Oikonomos está avaliando sua empresa…';
  }
}

function _getNextTip() {
  const tips = (ECONOMIC_TIPS && ECONOMIC_TIPS.length > 0) ? ECONOMIC_TIPS : [
    "🧐 Oikonomos aconselha: Mantenha sempre uma reserva de liquidez segura para amortecer oscilações de juros e demanda.",
    "🧐 Oikonomos aconselha: A integração vertical (Fazendas/Minas ➔ Fábricas ➔ Lojas) elimina atravessadores e maximiza a margem líquida."
  ];
  const tip = tips[_currentTipIndex % tips.length];
  _currentTipIndex = (_currentTipIndex + 1) % tips.length;
  return tip;
}

export function setTab(tabId) {
  _currentTab = tabId || 'diagnosis';
  const tabDiag = document.getElementById('oiko-tab-diagnosis');
  const tabTips = document.getElementById('oiko-tab-tips');
  const txt = _getAdviceText();

  const activeClasses = ['bg-[#c9a86a]/15', 'text-[#c9a86a]', 'font-bold', 'border-[#c9a86a]/30'];
  const inactiveClasses = ['text-slate-400', 'border-transparent'];

  if (_currentTab === 'diagnosis') {
    if (tabDiag) {
      tabDiag.classList.remove(...inactiveClasses);
      tabDiag.classList.add(...activeClasses);
    }
    if (tabTips) {
      tabTips.classList.remove(...activeClasses);
      tabTips.classList.add(...inactiveClasses);
    }
    if (txt) {
      txt.onclick = null;
      txt.textContent = _fetchLatestAdvice();
    }
  } else {
    if (tabTips) {
      tabTips.classList.remove(...inactiveClasses);
      tabTips.classList.add(...activeClasses);
    }
    if (tabDiag) {
      tabDiag.classList.remove(...activeClasses);
      tabDiag.classList.add(...inactiveClasses);
    }
    if (txt) {
      const renderTip = () => {
        txt.innerHTML = `${_getNextTip()} <div class="mt-2 text-[9px] text-[#c9a86a]/70 hover:text-[#c9a86a] cursor-pointer flex items-center gap-1 select-none"><span>↻</span> <u>Outra dica do mentor</u></div>`;
      };
      renderTip();
      txt.onclick = (e) => {
        if (_currentTab === 'tips') {
          e.stopPropagation();
          renderTip();
        }
      };
    }
  }
}

export function open() {
  const pop = _getPopover();
  if (!pop) return;

  setTab(_currentTab);
  pop.classList.remove('hidden');
  _isOpen = true;
}

export function close() {
  const pop = _getPopover();
  if (!pop) return;
  pop.classList.add('hidden');
  _isOpen = false;
  const txt = _getAdviceText();
  if (txt) txt.onclick = null;
}

export function toggle() {
  if (_isOpen) {
    close();
  } else {
    open();
  }
}

export function isOpen() {
  return _isOpen;
}

export function initOikonomosBtn() {
  if (typeof document === 'undefined') return;

  // Fechar ao clicar fora do popover e do botão
  document.addEventListener('click', (e) => {
    if (!_isOpen) return;
    const btn = document.getElementById('oikonomos-advisor-btn');
    const pop = _getPopover();
    if (btn && btn.contains(e.target)) return;
    if (pop && pop.contains(e.target)) return;
    close();
  });

  // Expor para o ESC do modal_manager
  window.closeOikonomosPopover = close;
}

export const OikonomosBtn = {
  open,
  close,
  toggle,
  isOpen,
  setTab,
  initOikonomosBtn
};

if (typeof window !== 'undefined') {
  window.OikonomosBtn = OikonomosBtn;
}

export default OikonomosBtn;
