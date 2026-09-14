/**
 * tooltip.js — Sistema de Tooltip Customizado Global
 * OIKONOMIA v0.9 (Fase HUD Redesign)
 *
 * Intercepta qualquer elemento com atributo [data-tip] e exibe um tooltip
 * estilizado com a paleta Obsidian & Ouro, eliminando o tooltip nativo do SO.
 *
 * Uso: adicionar data-tip="Texto do tooltip" ao elemento HTML.
 * O #oiko-tooltip (antigo #iso-tooltip) é reutilizado como container.
 */

let _tooltipEl = null;
let _showTimer = null;
const DELAY_MS = 380;

function _getOrCreateTooltip() {
  if (_tooltipEl) return _tooltipEl;
  _tooltipEl = document.getElementById('oiko-tooltip') || document.getElementById('iso-tooltip');
  if (!_tooltipEl) {
    _tooltipEl = document.createElement('div');
    _tooltipEl.id = 'oiko-tooltip';
    _tooltipEl.className = 'oiko-custom-tooltip hidden';
    document.body.appendChild(_tooltipEl);
  }
  _tooltipEl.className = 'oiko-custom-tooltip hidden';
  return _tooltipEl;
}

function _show(text, targetEl) {
  const tip = _getOrCreateTooltip();
  tip.textContent = text;
  tip.classList.remove('hidden');

  const rect = targetEl.getBoundingClientRect();
  const tipW = tip.offsetWidth || 160;
  const tipH = tip.offsetHeight || 32;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = rect.bottom + 6;
  let left = rect.left + rect.width / 2 - tipW / 2;

  if (left + tipW > vw - 8) left = vw - tipW - 8;
  if (left < 8) left = 8;
  if (top + tipH > vh - 8) top = rect.top - tipH - 6;

  tip.style.position = 'fixed';
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
  tip.style.zIndex = '9999';
}

function _hide() {
  clearTimeout(_showTimer);
  _showTimer = null;
  const tip = _getOrCreateTooltip();
  tip.classList.add('hidden');
}

export function initTooltipSystem() {
  if (typeof document === 'undefined') return;

  document.addEventListener('mouseover', (e) => {
    const target = e.target?.closest('[data-tip]');
    if (!target) return;
    const text = target.getAttribute('data-tip');
    if (!text) return;
    clearTimeout(_showTimer);
    _showTimer = setTimeout(() => _show(text, target), DELAY_MS);
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target?.closest('[data-tip]');
    if (!target) return;
    if (target.contains(e.relatedTarget)) return;
    _hide();
  });

  document.addEventListener('click', _hide, { passive: true });
  document.addEventListener('scroll', _hide, { passive: true, capture: true });
}

export const TooltipSystem = { initTooltipSystem };

if (typeof window !== 'undefined') {
  window.TooltipSystem = TooltipSystem;
}

export default TooltipSystem;
