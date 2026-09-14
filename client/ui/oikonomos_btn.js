/**
 * oikonomos_btn.js — Botão Persistente do Conselheiro Oikonomos
 * OIKONOMIA v0.9 (Fase HUD Redesign)
 *
 * Botão circular fixo no canto inferior direito (junto ao minimap).
 * Ao clicar, exibe um popover com o conselho mais urgente do AdvisorSystem.
 * Reaproveira a análise já existente — não cria sistema de análise paralelo.
 */

let _isOpen = false;

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
      return '✅ Nenhuma irregularidade crítica detectada. Continue expandindo!';
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

export function open() {
  const pop = _getPopover();
  const txt = _getAdviceText();
  if (!pop) return;

  if (txt) txt.textContent = _fetchLatestAdvice();
  pop.classList.remove('hidden');
  _isOpen = true;
}

export function close() {
  const pop = _getPopover();
  if (!pop) return;
  pop.classList.add('hidden');
  _isOpen = false;
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
  initOikonomosBtn
};

if (typeof window !== 'undefined') {
  window.OikonomosBtn = OikonomosBtn;
}

export default OikonomosBtn;
